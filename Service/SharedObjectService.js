"use strict";

var clone = require("../misc/clone");
var doValidate = require("../misc/Validation").SharedObjectValidation;
var applyDiff = require('../misc/update').applyDiff;
var differ = require("deep-diff");
var meta = require('meta-objects');

class SharedObjectService{

    constructor(endpoint, transports, initial){
        this._data = initial;
        if (!transports.rpc || !transports.source)
            throw new Error("Shared objects need both Source and RPC transports to be configured");

        doValidate(endpoint, initial);

        var emitter = meta.tracer(function () {
            //empty
            this.tracer_data = {};
        }, 'Data');
        this.tracer_data = new emitter.Data().tracer_data;
        Object.keys(initial).forEach((key)=>{
            this.tracer_data[key] = initial[key];
        })
        emitter.on('*', this._handleChange.bind(this));
        this._v = 0;
        this.endpoint = endpoint;
        transports.rpc.on('message', this._processRPC.bind(this));
        this.diffTransport = transports.source;
    }
    // Handle sets on tracer_data, else we lose the tracer!
    set data (obj) {
        Object.keys(this.tracer_data).forEach((key)=>{
            delete this.tracer_data[key];
        });
        Object.keys(obj).forEach((key)=>{
            this.tracer_data[key] = obj[key];
        });
    }

    get data(){
        return this.tracer_data;
    }
    _processRPC(message, reply){
        if (message.endpoint == "_SO_" + this.endpoint.name){
            if (message.input == "init"){
                reply({err:null, res:{data: this._data, v: this._v}});
            }else{
                throw "Got bad tracer_data on RPC channel";
            }
        }
    }

    notify(hint){
       return
    }

    _handleChange(event) {
        if (event.property) {
            if (event.type == 'set') {
                //console.log('SET', event);
                this.updateRemote(event)
            }
        } else {
            if (event.type == 'apply' && ['pop','push','shift','unshift'].indexOf(event.path[event.path.length-1]) != -1){
                //console.log('Array func', event);
                this.updateRemote(event)
            } else {
                console.log(event.type, event.path.join('.'));
            }

        }
    };

    updateRemote(event){
        var now = new Date();
        var path =  event.path.slice(3, event.path.length);
        var field = event.property;
        var value = event.value;
        var type = event.type;
        //console.log(path)

        if(!field){
            value = event.args;
            type = path.pop();
            field = path.pop();
        }
        path.push(field);

        var diffs = [{type, path, value, field}];
        console.log(diffs);

        // update internal object
        this._update(diffs);

        // Validate
        //doValidate(this.endpoint, this._data, path);

        this._v++;
        var OTW = {
            endpoint: "_SO_" + this.endpoint.name,
            message: { diffs,v: this._v, now}
        };
        this.diffTransport.send([OTW.endpoint,JSON.stringify(OTW)]);
    }

    _update(diffs){
        for (let diff of diffs) {
            applyDiff(this._data, diff);
        }
    }
}

function diffAndReverseAndApplyWithHint(lhs, rhs, hint){
    var lhsWithHint = lhs;
    var rhsWithHint = rhs;
    var i = 0;

    while(i < hint.length){
        // Stop if add or delete.
        if (!(hint[i] in lhsWithHint) || !(hint[i] in rhsWithHint)){
            break
        }

        lhsWithHint = lhsWithHint[hint[i]];
        rhsWithHint = rhsWithHint[hint[i]];
        i++;
    }

    var hintUsed = hint.slice(0,i);


    var diffs = differ(lhsWithHint, rhsWithHint);

    var reportDiffs = []; // Separate because of clone changes

    if (diffs) {
        diffs.reverse().forEach(function (diff) {
            var diff = clone(diff);
            differ.applyChange(lhsWithHint, rhsWithHint, diff);
            if(diff.path)
                diff.path = hintUsed.concat(diff.path);
            else
                diff.path = hintUsed;
            reportDiffs.push(diff);
        });
    }

    return reportDiffs;
}

module.exports = SharedObjectService;