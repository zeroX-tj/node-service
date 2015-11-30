"use strict";

var doValidation = require("../misc/Validation").SourceValidation;
var EventEmitter = require("events").EventEmitter;

class SourceClient extends EventEmitter{
    constructor(endpoint, transports){
        super();
        this.endpoint = endpoint;
        this.transport = transports.source;
        if (!this.transport)
            throw "Trying to construct Source endpoint without Source transport";
    }

    subscribe(){
        this.transport.subscribe(this.endpoint.name);
    };

    _processMessage(data){
        if (this.endpoint.name == data.endpoint){
            this.emit('message',data.message);
        }
    }
}

module.exports = SourceClient;