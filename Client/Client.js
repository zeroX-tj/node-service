"use strict";

var zmq = require("zmq");
var axon = require("axon");

var RPCClient = require("./RPCClient");
var SourceClient = require("./SourceClient");
var SharedObjectClient = require("./SharedObjectClient");


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
                default:
                    break;
            }
        }
    }

    _setupSource(hostname){
        var sock = new zmq.socket('sub');
        this.transports.source = sock;
        sock.connect(hostname);
        sock.subscribe("");
        //sock.on('message', this._sourceCallback.bind(this));
    }

    _setupSink(hostname){
        var sock = new zmq.socket('pub');
        this.transports.sink = sock;
        sock.connect(hostname);
    }

    _sourceCallback(message){
        // TODO: pass message to eventemitter
    }

    _setupRpc(hostname){
        var sock = new axon.socket('req');
        sock.connect(hostname);
        this.transports.rpc = sock;
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
                    break;
                default:
                    throw "Unknown endpoint type.";
            }
        }
    }
}

module.exports = Client;
