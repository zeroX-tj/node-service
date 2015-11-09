"use strict";

var doValidation = require("../misc/Validation").RPCValidation;

class RPCService{
    constructor(endpoint, handler){
        this.endpoint = endpoint;
        this.handler = handler;
    }

    call(input, callback){
        if (this.endpoint.name != input.endpoint)
            throw ("Wrong handler called!");

        var req = JSON.parse(input.input);

        req = doValidation(this.endpoint, 'input', req);

        this.handler(req, (err, res) => {

            if (!err){
                res = doValidation(this.endpoint, 'output', res);
            }

            var reply = JSON.stringify({err,res});
            callback(reply);
        });
    }
}

module.exports = RPCService;