"use strict";

var EventEmitter = require("events").EventEmitter;

class SinkService extends EventEmitter{
    constructor(endpoint, transports, hostname){
        super();
        this.endpoint = endpoint;
        this.transport = transports.sink;
        this.hostname = hostname;
        if (!this.transport)
            throw new Error("Trying to construct Sink endpoint without Source transport");
    }

    subscribe(){
        this.transport.connect(this.hostname);
    };

    unsubscribe(){
        this.transport.disconnect(this.hostname);
    };

    _processMessage(data){
        this.emit("message", data);
    }
}


module.exports = SinkService;