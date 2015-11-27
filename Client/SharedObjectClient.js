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

        this.data = {};
        this._v = 0;
        this.ready = false;
        this.delayCount = 0;
        this.delay = 0;
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

            if (data.message.v == (this._v+1)) {

                var old = clone(this.data);

                var diffs = data.message.diffs.reverse(); // Reverse for array delete issues
                for (let diff of diffs) {
                    differ.applyChange(this.data, true, diff);
                }

                this._v = data.message.v;

                this._validate();
                this.delay += new Date() - new Date(data.message.now);
                this.delayCount++;
                if (this.delayCount % 10 == 0){
                    console.log("Average time: " + (this.delay/10) + "ms");
                    this.delay = 0;
                }
                this.emit('update', old, this.data, diffs);

            }else{

                console.error("Missed a version, refetching.");
                this.ready = false;
                this._init();

            }
        }
    }

    _init(){
        this.initTransport.send({
            endpoint: "_SO_" + this.endpoint.name,
            input: "init"
        }, (answer) => {
            this.data = answer.res.data;
            this._v = answer.res.v;
            this._validate();
            this.ready = true;
            this.emit('init');
        });
    }

    _validate(){
        this.data = doValidation(this.endpoint,this.data);
    }
}

module.exports = SharedObjectClient;