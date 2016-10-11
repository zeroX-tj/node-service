"use strict";
var EventEmitter = require("events").EventEmitter;
var doValidation = require("../misc/Validation").SharedObjectValidation;
var differ = require("deep-diff");
var clone = require("../misc/clone");

class ShardedSharedObjectClient{
    constructor(descriptor, bridge, Client){
        this.endpoints = descriptor.subEndpoints;
        this.transports = descriptor.transports;
        this.service = new Client(descriptor);
        bridge.clients.push(this.service);
        var self = this;

        Object.keys(this.endpoints).forEach((endpointName)=>{
            this.endpoints[endpointName].on('subscribe', (channel)=>{
                self.service[endpointName].subscribe(channel);
            });
            this.service[endpointName].on('init', ()=>{
                bridge.endpoints[endpointName].emit('init')
            });
            this.service[endpointName].on('update', (d)=>{
                console.log(d)
                self.endpoints[endpointName].emit('update', d)
            });
        })
    }


}

module.exports = ShardedSharedObjectClient;