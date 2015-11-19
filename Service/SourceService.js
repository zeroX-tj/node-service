"use strict";

var doValidation = require("../misc/Validation").SourceValidation;

class SourceService{
    constructor(endpoint, transports){
        this.endpoint = endpoint;
        this.transport = transports.source;
        if (!this.transport)
            throw "Trying to construct Source endpoint without Source transport";
    }

    send(message){
        message = doValidation(this.endpoint, message);
        var OTW = {
            endpoint: this.endpoint.name,
            message: message
        };
        this.transport.send([OTW.endpoint, JSON.stringify(OTW)]);
    }
}

module.exports = SourceService;