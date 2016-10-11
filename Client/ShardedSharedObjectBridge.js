"use strict";
var clone = require("../misc/clone");
var EventEmitter = require("events").EventEmitter;
var differ = require("deep-diff");

class ShardedSharedObjectBridge extends EventEmitter {
    constructor(endpoints) {
        super();

        this.endpoints = endpoints;
        this.clients = [];
        this.data;
        this.on('init', () => {
            var data = [];
            Object.keys(self.endpoints).forEach((e)=>{
                data = data.concat(this.service[e].data)
            })

            this.data = d;
        });
        this.on('update', (d) => {
            for (let diff of d){
                differ.applyChange(this.data, true, diff);
            }
        });
    }

    subscribe() {
        this.emit('subscribe', "_SO_" + this.endpoint.name);
    }
}

module.exports = ShardedSharedObjectBridge;