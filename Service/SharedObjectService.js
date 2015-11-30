"use strict";

var differ = require("deep-diff");
var clone = require("../misc/clone");
var doValidate = require("../misc/Validation").SharedObjectValidation;

var getEntryForPath = function (data, pathArr) {
    var nPathArr = JSON.parse(JSON.stringify(pathArr));
    if (pathArr.length == 0) return data;
    var property = nPathArr.splice(0, 1)[0];
    var ndata = data[property];
    return getEntryForPath(ndata, nPathArr)
}

var getSchemaForPath = function (endpoint, pathArr, i) {
    if (pathArr.length == 0) return endpoint;
    if (!i) {
        i = 1;
        endpoint = endpoint.objectSchema;
    }
    else i++;

    var prop_type;
    if (endpoint.type == 'array') {
        prop_type = 'items'
    } else if (endpoint.type == 'object') {
        prop_type = 'properties'
    }

    var property = pathArr.splice(0, 1)[0];
    if (!endpoint[prop_type][property]) {
        if (prop_type == 'items') {
            return getSchemaForPath(endpoint[prop_type], pathArr, i);
        } else {
            var endpoints = Object.keys(endpoint[prop_type]);
            if (endpoints && endpoints[0] == '*') property = '*';
            return getSchemaForPath(endpoint[prop_type][property], pathArr, i);
        }
    } else return getSchemaForPath(endpoint[prop_type][property], pathArr, i);
}

class SharedObjectService{
    constructor(endpoint, transports, initial){
        if (!transports.rpc || !transports.source)
            throw new Error("Shared objects need both Source and RPC transports to be configured");

        doValidate(endpoint, initial);
        this.data = initial;
        this._lastTransmit = clone(initial);
        this._v = 0;
        this.endpoint = endpoint;
        transports.rpc.on('message', this._processRPC.bind(this));
        this.diffTransport = transports.source;
    }

    _processRPC(message, reply){
        if (message.endpoint == "_SO_" + this.endpoint.name){
            if (message.input == "init"){
                reply({err:null, res:{data: this.data, v: this._v}});
            }else{
                throw "Got bad data on RPC channel";
            }
        }
    }

    notify(){
        var now = new Date();
        var diffs = differ(this._lastTransmit, this.data);
        if (diffs) {
            diffs.forEach((change)=>{
                var dataEntry = getEntryForPath(this.data, change.path);
                if(change.kind == "N" || change.kind == "E") {
                    var dataSchema = getSchemaForPath(this.endpoint, change.path);
                    dataEntry = doValidate(dataSchema, change.rhs)
                }
                if(change.kind == "A" || change.kind == "D") {
                    dataEntry = getEntryForPath(this.data, [change.path[0]]);
                    dataEntry = doValidate(this.endpoint.objectSchema.properties['*'], dataEntry)
                }
            })
            diffs = differ(this._lastTransmit, this.data);
            this._v++;
            var OTW = {
                endpoint: "_SO_" + this.endpoint.name,
                message: {diffs, v: this._v, now}
            };
            this.diffTransport.send([OTW.endpoint,JSON.stringify(OTW)]);
            this._lastTransmit = clone(this.data);
        }
    }
}

module.exports = SharedObjectService;