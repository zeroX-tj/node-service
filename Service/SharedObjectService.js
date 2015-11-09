"use strict";

var differ = require("deep-diff");
var clone = require("../misc/clone");
var doValidate = require("../misc/Validation").SharedObjectValidation;

class SharedObjectService{
    constructor(endpoint, transports, initial){
        if (!transports.rpc || !transports.source)
            throw new Error("Shared objects need both Source and RPC transports to be configured");

        doValidate(endpoint, initial);
        this.data = initial;
        this._lastTransmit = clone(initial);

        this.endpoint = endpoint;
        transports.rpc.on('message', this._processRPC.bind(this));
        this.diffTransport = transports.source;
    }

    _processRPC(message, reply){
        if (message.endpoint == "_SO_" + this.endpoint.name){
            if (message.input == "init"){
                reply({err:null, res:this.data});
            }else{
                throw "Got bad data on RPC channel";
            }
        }
    }

    notify(){
        doValidate(this.endpoint, this.data);
        var diffs = differ(this._lastTransmit, this.data);
        var OTW = {
            endpoint: "_SO_" + this.endpoint.name,
            message: diffs
        };
        this.diffTransport.send(JSON.stringify(OTW));
        this._lastTransmit = clone(this.data);
    }
}

module.exports = SharedObjectService;