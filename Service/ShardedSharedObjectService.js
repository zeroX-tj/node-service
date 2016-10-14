"use strict";
const WORKER_WRAPPER = require.resolve('./../misc/worker');
var clone = require("../misc/clone");
var shard = require("../misc/shard");
var cp = require('child_process');

class ShardedSharedObjectService {
    constructor(endpoint, transports, initial) {
        if (!transports.rpc || !transports.source)
            throw new Error("Shared objects need both Source and RPC transports to be configured");
        this.initial_data = clone(initial);
        this.endpoint = endpoint;
        transports.rpc.on('message', this._processRPC.bind(this));
        this.RpcCallQueue = {};
        this.RpcCallQueueNr = 0;
        this.diffTransport = transports.source;
        this.workerCount = Object.keys(this.endpoint.transports).length;
        this.sharding = new shard(this.workerCount);
        this.workerPath = endpoint.workerPath; // worker which will inherit data structure
        this.shards = [];
        process.nextTick(this.fork.bind(this))
    }

    _processRPC(message, reply) {
        if (message.endpoint == "_SO_" + this.endpoint.name) {
            console.log('got request for init');
            if (message.input == "init") {
                reply({err: null, res: {data: this.data, v: this._v}});
            } else {
                throw "Got bad data on RPC channel";
            }
        }
    }

    fork() {
        var self = this;

        // SIGTERM AND SIGINT will trigger the exit event.
        process.once("SIGTERM", function () {
            process.exit(0);
        });
        process.once("SIGINT", function () {
            process.exit(0);
        });
        // And the exit event shuts down the child.
        process.once("exit", function () {
            self._killChildren();
        });

        // This is a somewhat ugly approach, but it has the advantage of working
        // in conjunction with most of what third parties might choose to do with
        // uncaughtException listeners, while preserving whatever the exception is.
        process.once("uncaughtException", function (error) {
            // If this was the last of the listeners, then shut down the child and rethrow.
            // Our assumption here is that any other code listening for an uncaught
            // exception is going to do the sensible thing and call process.exit().
            if (process.listeners("uncaughtException").length === 0) {
                self._killChildren();
                throw error;
            }
        });

        for (var i = 0; i < this.workerCount; i++) {
            //console.log('spawning', i, this.workerPath)
            //console.log(JSON.stringify(this.endpoint.subEndpoints,null,2))
            this.shards[i] = cp.fork(WORKER_WRAPPER, [i, JSON.stringify(this.initial_data), JSON.stringify({
                endpoints: this.endpoint.subEndpoints,
                transports: this.endpoint.transports[i]
            }), this.workerPath], {detached: true});
            // A helper function to shut down the child.
            // Helper function added to the child process to manage shutdown.
            this.shards[i].onUnexpectedExit = function (code, signal) {
                console.log("Child process terminated with code: " + code);
                process.exit(1);
            };
            this.shards[i].on("exit", this.shards[i].onUnexpectedExit);
            this.shards[i].shutdown = function () {
                // Get rid of the exit listener since this is a planned exit.
                this.removeListener("exit", this.onUnexpectedExit);
                this.kill("SIGTERM");
            };
            this.shards[i].on('error', (code) => {
                console.log(`child process errored with code ${code}`);
            });
            this.shards[i].on("message", this.processChildMessage.bind(this));
        }
    }

    processChildMessage(payload) {
        switch(payload.cmd){
            case 'rpc':
                this._processRpcCallback(payload.id, payload.err, payload.res);
                break;
        }
    }

    _killChildren() {
        // Functions to kill children when things go wrong
        this.shards.forEach((shard) => {
            shard.shutdown();
        })
    }

    rpc(endpointName, req, rep){
        var shardKey = this.endpoint.subEndpoints.filter((e)=>{return (endpointName==e.name)})[0].shardKey;
        if(!shardKey) {
            return rep({error: 'Please provide shard key in request to do RPC on Sharded Service'});
        }

        var key = req;
        shardKey.forEach((path)=>{
            key = key[path]
        });

        var shard_id = this.sharding.get(key);
        var callQueueNr = this.RpcCallQueueNr++;
        //console.log('delete', key.join('.'), 'on shard id', shard_id, 'for path', key[0])
        //key.unshift(this.endpoint.name); // Add endpoint to path
        this.RpcCallQueue[callQueueNr] = rep;
        this.shards[shard_id].send({cmd: 'rpc', data:{endpointName, req_id: callQueueNr, req}})
    }

    _processRpcCallback(reqId, err, result){
        this.RpcCallQueue[reqId](err, result);
        delete this.RpcCallQueue[reqId];
    }
}

module.exports = ShardedSharedObjectService;