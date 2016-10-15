"use strict";
var EventEmitter = require("events").EventEmitter;
var doValidation = require("../misc/Validation").SharedObjectValidation;
var differ = require("deep-diff");
var clone = require("../misc/clone");

class ShardedSharedObjectClient{
    constructor(descriptor, bridge, Client){
        this.endpoints = descriptor.endpoints.filter((endpoint)=>{
            return (endpoint.type == 'SharedObject')
        });
        descriptor.endpoints = this.endpoints;
        this.transports = descriptor.transports;
        this.service = new Client(descriptor);
        bridge.clients.push(this.service);
        var self = this;
        this.lastState = 'disconnected';

        this.endpoints.forEach((endpoint)=>{
            if(endpoint.type == 'SharedObject') {
                bridge.endpoints[endpoint.name].on('subscribe', (channel) => {
                    self.service[endpoint.name].subscribe(channel);
                });
                this.service[endpoint.name].on('init', () => {
                    //console.log('init')
                    bridge.endpoints[endpoint.name].emit('_init')
                });
                this.service[endpoint.name].on('update', (d) => {
                    //console.log('update',JSON.stringify(d))
                    bridge.endpoints[endpoint.name].emit('update', d)
                });
                this.service[endpoint.name].on('connected', () => {
                    this.lastState = 'connected'
                    if(this.lastState != 'connected') {
                        bridge.endpoints[endpoint.name].emit('connected');
                    }
                });
                this.service[endpoint.name].on('disconnected', () => {
                    if(this.lastState != 'disconnected') {
                        bridge.endpoints[endpoint.name].emit('disconnected');
                        this.lastState = 'disconnected'
                    }
                });
            }/*else if (endpoint.type == 'RPC'){
                this.RPCServices[endpoint.name] =
            }*/
        })
    }


}

module.exports = ShardedSharedObjectClient;