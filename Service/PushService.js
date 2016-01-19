"use strict";

var doValidation = require("../misc/Validation").PushValidation;

class SourceService{
    constructor(endpoint, transports){
        this.endpoint = endpoint;
        this.transport = transports.pushpull;
        if (!this.transport)
            throw "Trying to construct PushPull endpoint without pushpull transport";
    }

    push(message){
        doValidation(this.endpoint, message);

        var OTW = message;
        this.transport.send(JSON.stringify(OTW));
    }
}

module.exports = SourceService;