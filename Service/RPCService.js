"use strict";

var doValidation = require("../misc/Validation").RPCValidation;

class RPCService{
    constructor(endpoint, handler){
        this.endpoint = endpoint;
        this.handler = handler;
        this.stats = {updates: 0};
    }

    call(input, callback){
        if (this.endpoint.name != input.endpoint)
            throw ("Wrong handler called!");

        var req = JSON.parse(input.input);

        doValidation(this.endpoint, 'input', req);
        this.stats.updates++;

        this.handler(req, (err, res) => {

            if (!err){
                doValidation(this.endpoint, 'output', res);
            }

            var reply = JSON.stringify({err,res});
            callback(reply);
        });
    }

    getStats(){
        var current_stats = JSON.parse(JSON.stringify(this.stats));
        this.stats.updates = 0;
        return current_stats;
    }
}

module.exports = RPCService;