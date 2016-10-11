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
        this.diffTransport = transports.source;
        this.workerCount = Object.keys(this.endpoint.transports).length;
        this.sharding = new shard(this.workerCount);
        this.workerPath = endpoint.workerPath; // worker which will inherit data structure
        this.shards=[];
        process.nextTick(this.fork.bind(this))
    }

    _processRPC(message, reply) {
        if (message.endpoint == "_SO_" + this.endpoint.name) {
            if (message.input == "init") {
                reply({err: null, res: {data: this.data, v: this._v}});
            } else {
                throw "Got bad data on RPC channel";
            }
        }
    }

    fork(){
        for (var i = 0; i < this.workerCount; i++) {
            console.log('spawning', i, this.workerPath)
            this.shards[i] = cp.fork(WORKER_WRAPPER, [i, JSON.stringify(this.initial_data), JSON.stringify(this.endpoint.transports[i]), this.workerPath]);

        }
    }
}

module.exports = ShardedSharedObjectService;