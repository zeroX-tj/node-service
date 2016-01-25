"use strict";

var EventEmitter = require("events").EventEmitter;
var doValidation = require("../misc/Validation").SharedObjectValidation;
var differ = require("deep-diff");
var clone = require("../misc/clone");

class SharedObjectClient extends EventEmitter{
    constructor(endpoint, transports){
        super();
        if (!transports.rpc || !transports.source)
            throw new Error("Shared objects need both Source and RPC transports to be configured");

        this.endpoint = endpoint;
        this.initTransport = transports.rpc;
        this.updateTransport = transports.source;

        this._init();
    }

    subscribe(){
        this.updateTransport.subscribe("_SO_" + this.endpoint.name);
    }

    _processMessage(data){
        if (data.endpoint == "_SO_" + this.endpoint.name){
            var idx = data.message.v - (this._v + 1);
            if (idx < 0){
                console.error("Bad version! Reinit!");
                return this._init();
            }
            this.procBuffer[idx] = data.message.diffs;
            this.timeBuffer[idx] = data.message.now;

            this.outstandingDiffs++;
            process.nextTick(this._tryApply.bind(this));
        }
    }

    _tryApply(){
        var totalDiffs = [];

        while(!!this.procBuffer[0]){
            // Diffs are already reversed by Server!
            var diffs = this.procBuffer.shift();
            this.outstandingDiffs--;
            totalDiffs = diffs.concat(totalDiffs);

            for (let diff of diffs){
                if(diff.custom){
                    var data = this.data;
                    while(i < diff.hint.length){
                        // Stop if add or delete.
                        if (!(hint in data)){
                            break
                        }
                        data = data[diff.hint[i]];
                        i++;
                    }
                }
                else
                    differ.applyChange(this.data, true, diff);
            }

            this.timeSum += new Date() - this.timeBuffer.shift();
            this.timeCount++;
            if (this.timeCount == 10){
                console.log("Average time: " + (this.timeSum/10) + " ms");
                this.timeSum = 0;
                this.timeCount = 0;
            }

            this._v++;
        }

        if (totalDiffs.length > 0) {
            this.emit('update', totalDiffs);
        }else if (this.ready && this.outstandingDiffs > 10){
            console.error("Too many outstanding diffs, missed a version. Reinit.");
            this._init();
        }
    }

    _flushData() {
        this.data = {};
        this._v = 0;
        this.procBuffer = [];
        this.timeBuffer = [];

        this.timeSum = 0;
        this.timeCount = 0;

        this.outstandingDiffs = 0;

        this.ready = false;
    }

    _init(){

        this.data = {};
        this._v = 0;
        this.procBuffer = [];
        this.timeBuffer = [];

        this.timeSum = 0;
        this.timeCount = 0;

        this.outstandingDiffs = 0;

        this.ready = false;

        this.initTransport.send({
            endpoint: "_SO_" + this.endpoint.name,
            input: "init"
        }, (answer) => {
            this.data = answer.res.data;
            this._v = answer.res.v;
            console.log("Init installed version",this._v);
            this.procBuffer.splice(0,this._v);
            this.timeBuffer.splice(0,this._v);
            this.outstandingDiffs = 0;
            for (let i of this.procBuffer){
                if (!!i)
                    this.outstandingDiffs++;
            }
            this.ready = true;
            this._tryApply();
            this.emit('init');
        });
    }
}

module.exports = SharedObjectClient;