"use strict";
var clone = require("../misc/clone");
var EventEmitter = require("events").EventEmitter;

class ShardedSharedObjectBridge extends EventEmitter{
    constructor(endpoint, transports) {
     super();

      this.endpoint = endpoint;

    }

    subscribe(){
        this.updateTransport.subscribe("_SO_" + this.endpoint.name);
    }
}

module.exports = ShardedSharedObjectBridge;