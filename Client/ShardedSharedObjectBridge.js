"use strict";
var clone = require("../misc/clone");
var EventEmitter = require("events").EventEmitter;
var differ = require("deep-diff");

class EndpointBridge extends EventEmitter {
    constructor(endpoint, bridge) {
        super();
        this.endpoint = endpoint;
        this.data = {};

        this.on('_init', () => {
            this.data = {};
            bridge.clients.forEach((client)=>{
                for (var attrname in client[endpoint.name].data) { this.data[attrname] = client[endpoint.name].data[attrname]; }
            })
            console.log('got init')
            this.emit('init')
        });
        this.on('update', (d) => {
            console.log('got update')
            for (let diff of d) {
                differ.applyChange(this.data, true, diff);
            }
        });
    }

    subscribe() {
        this.emit('subscribe', "_SO_" + this.endpoint.name);
    }
}

class ShardedSharedObjectBridge {
    constructor(endpoints) {
        this.endpoints = {};

        endpoints.forEach((endpoint) => {
            this.endpoints[endpoint.name] = new EndpointBridge(endpoint, this);
        })

        this.clients = [];

    }

}

module.exports = ShardedSharedObjectBridge;