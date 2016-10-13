"use strict";
var EventEmitter = require("events").EventEmitter;
var doValidation = require("../misc/Validation").SharedObjectValidation;
var differ = require("deep-diff");
var clone = require("../misc/clone");

class ShardedSharedObjectClient{
    constructor(descriptor, bridge, Client){
        this.endpoints = descriptor.endpoints;
        this.transports = descriptor.transports;
        this.service = new Client(descriptor);
        bridge.clients.push(this.service);
        var self = this;

        this.endpoints.forEach((endpoint)=>{
            bridge.endpoints[endpoint.name].on('subscribe', (channel)=>{
                self.service[endpoint.name].subscribe(channel);
            });
            this.service[endpoint.name].on('init', ()=>{
                //console.log('init')
                bridge.endpoints[endpoint.name].emit('_init')
            });
            this.service[endpoint.name].on('update', (d)=>{
                //console.log('update',JSON.stringify(d))
                bridge.endpoints[endpoint.name].emit('update', d)
            });
        })
    }


}

module.exports = ShardedSharedObjectClient;