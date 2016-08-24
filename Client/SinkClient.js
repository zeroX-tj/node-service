"use strict";
var doValidation = require("../misc/Validation").PushValidation;


class SinkClient {
    constructor(endpoint, transports){
        this.endpoint = endpoint;
        this.transport = transports.sink;
        if (!this.transport)
            throw "Trying to construct Sink endpoint without pushpull transport";
    }

    push(message){
        doValidation(this.endpoint, message);

        var OTW = message;
        this.transport.send(JSON.stringify(OTW));
    }
}

module.exports = SinkClient;