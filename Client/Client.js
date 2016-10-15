"use strict";

var zmq = require("zmq");
var axon = require("axon");
var MonitoredSocket = require("./MonitoredSocket");

var RPCClient = require("./RPCClient");
var SourceClient = require("./SourceClient");
var SharedObjectClient = require("./SharedObjectClient");
var PullClient = require("./PullClient");
var SinkClient = require("./SinkClient");
var ShardedSharedObjectClient = require("./ShardedSharedObjectClient");
var ShardedSharedObjectBridge = require("./ShardedSharedObjectBridge");

class Client {
    constructor(descriptor){
        this.descriptor = descriptor;
        this.transports = {};

        this._setupTransports();
        this._setupEndpoints();
    }

    _setupTransports(){
        for(let transport in this.descriptor.transports){
            switch (transport){
                case 'source':
                    this._setupSource(this.descriptor.transports.source.client);
                    break;
                case 'sink':
                    this._setupSink(this.descriptor.transports.sink.client);
                    break;
                case 'rpc':
                    this._setupRpc(this.descriptor.transports.rpc.client);
                    break;
                case 'pushpull':
                    this._setupPull();
                    break;
                default:
                    break;
            }
        }
    }

    _setupSource(hostname){
        var msock = new MonitoredSocket('sub');
        this.transports.source = msock.sock;
        this.transports.source.connect(hostname);
        this.transports.source.on('message', this._sourceCallback.bind(this));
        msock.on('disconnected', this._sourceClosed.bind(this));
        msock.on('connected', this._sourceConnected.bind(this));
    }

    _setupSink(hostname){
        var sock = new zmq.socket('push');
        this.transports.sink = sock;
        sock.connect(hostname);
    }

    _sourceCallback(endpoint, message){
        var data = JSON.parse(message);
        this[endpoint]._processMessage(data);
    }

    _sourceConnected(){
        // Loop endpoints
        for(let endpoint of this.descriptor.endpoints) {
            if (endpoint.type == 'Source' || endpoint.type == 'SharedObject') {
                console.log(endpoint.name, 'connected');
                this[endpoint.name].emit('connected')
                if (endpoint.type == 'SharedObject') {
                    if(this[endpoint.name].ready == false) this[endpoint.name]._init();
                }
            }
        }
    }

    _sourceClosed(){
        // Loop endpoints
        for(let endpoint of this.descriptor.endpoints) {
            if (endpoint.type == 'Source' || endpoint.type == 'SharedObject') {
                console.log(endpoint.name, 'disconnected');
                this[endpoint.name].emit('disconnected')
                if (endpoint.type == 'SharedObject') {
                    this[endpoint.name]._flushData();
                }
            }
        }
    }

    _setupRpc(hostname){
        var sock = new axon.socket('req');
        sock.connect(hostname);
        this.transports.rpc = sock;
    }

    _setupPull(hostname){
        var sock = new zmq.socket("pull");
        // DON'T CONNECT! Client must explicitly ask!
        sock.on('message', this._pullCallback.bind(this));
        this.transports.pushpull = sock;
    }

    _pullCallback(message){
        if (!this.PullEndpoint){
            throw new Error("Got a pull message, but ot Pull enpoint is connected!");
        }

        this.PullEndpoint._processMessage(JSON.parse(message));
    }

    _setupEndpoints(){
        for(let endpoint of this.descriptor.endpoints){
            switch(endpoint.type){
                case 'RPC':
                    this[endpoint.name] = new RPCClient(endpoint, this.transports);
                    break;
                case 'Source':
                    this[endpoint.name] = new SourceClient(endpoint, this.transports);
                    break;
                case 'SharedObject':
                    this[endpoint.name] = new SharedObjectClient(endpoint, this.transports);
                    this['_SO_'+endpoint.name] = this[endpoint.name];
                    break;
                case 'PushPull':
                    if (this.PullEndpoint){
                        throw new Error("Only a singly Pushpull endpoint can be constructed per service!");
                    }
                    this[endpoint.name] = new PullClient(endpoint, this.transports, this.descriptor.transports.pushpull.client);
                    this.PullEndpoint = this[endpoint.name];
                    break;
                case 'Sink':
                    this[endpoint.name] = new SinkClient(endpoint, this.transports, this.descriptor.transports.sink.client);
                    this.SinkEndpoint = this[endpoint.name];
                    break;
                case 'ShardedSharedObjects':
                    var bridge = new ShardedSharedObjectBridge(endpoint.subEndpoints);
                    endpoint.transports.forEach((transport)=>{
                        var descriptor = JSON.parse(JSON.stringify(this.descriptor));
                        descriptor.endpoints = endpoint.subEndpoints;
                        descriptor.transports = transport;
                        new ShardedSharedObjectClient(descriptor, bridge, Client);
                    });
                    endpoint.subEndpoints.forEach((sub_endpoint)=>{
                        this[sub_endpoint.name] = bridge.endpoints[sub_endpoint.name];
                        this['_SO_'+sub_endpoint.name] = this[sub_endpoint.name];
                    });

                    break;
                default:
                    throw "Unknown endpoint type.";
            }
        }
    }
}

module.exports = Client;
