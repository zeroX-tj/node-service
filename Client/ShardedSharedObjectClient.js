"use strict";
var Client = require('./Client');
var EventEmitter = require("events").EventEmitter;
var doValidation = require("../misc/Validation").SharedObjectValidation;
var differ = require("deep-diff");
var clone = require("../misc/clone");

class ShardedSharedObjectClient{
    constructor(descriptor, endpoints){
        this.endpoints = endpoints;
        this.transports = descriptor.transports;
        this.service = new Client(descriptor);
        Object.keys(this.endpoints).forEach((endpointName)=>{
            this.service[endpointName].on('init', this.endpoints[endpointName].emit.bind(this, 'init'))
            this.service[endpointName].on('update', this.endpoints[endpointName].emit.bind(this, 'update'))
        })
    }


}

module.exports = ShardedSharedObjectClient;