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

        this.endpoint = endpoint;
        this.initTransport = transports.rpc;
        transports.source.on('message', this._processSource.bind(this));

        this._init();
    }

    _processSource(data){
        data = JSON.parse(data.toString());
        if (data.endpoint == "_SO_" + this.endpoint.name){

            if (data.message.v == (this._v+1)) {

                var old = clone(this.data);

                var diffs = data.message.diffs;
                for (let diff of diffs) {
                    differ.applyChange(this.data, true, diff);
                }

                this._v = data.message.v;

                this._validate();
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