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

        this.subscribe = function(){
            transports.source.subscribe(this.endpoint.name);
        };
    }

    _processMessage(data){
        if (this.endpoint.name == data.endpoint){
            var obj = doValidation(this.endpoint, data.message);
            this.emit('message',obj);
        }
    }
}

module.exports = SourceClient;