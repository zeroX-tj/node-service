"use strict";

var clone = require("../misc/clone");
var doValidate = require("../misc/Validation").SharedObjectValidation;
var differ = require("deep-diff");

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

    notify(hint){
        var now = new Date();

        if (!hint)
            hint = [];

        doValidate(this.endpoint, this.data, hint);

        var diffs = diffAndReverseAndApplyWithHint(this._lastTransmit, this.data, hint);
        if (diffs) {
            this._v++;
            var OTW = {
                endpoint: "_SO_" + this.endpoint.name,
                message: {diffs, v: this._v, now}
            };
            this.diffTransport.send([OTW.endpoint,JSON.stringify(OTW)]);
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