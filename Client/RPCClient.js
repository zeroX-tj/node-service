"use strict";

var doValidation = require("../misc/Validation").RPCValidation;

class RPCClient {
    constructor(endpoint, transports){
        this.transport = transports.rpc;
        this.endpoint = endpoint;
        if (!this.transport)
            throw "Trying to initialise an RPC service without RPC config!";
    }

    call(input, timeout, callback){
        if(!callback){ // Make compatible with old code
            callback = timeout;
            timeout = 10e3;
        }

        doValidation(this.endpoint, 'input', input);
        var answer_received = false;
        var answer_timeout = setTimeout(() => {
            if(!answer_received)
                callback('timeout');
                callback = null;
                answer_received = null;
        }, timeout);
        this.transport.send({
            endpoint: this.endpoint.name,
            input: JSON.stringify(input)
        }, (answer) => {
            answer_received = true;
            clearTimeout(answer_timeout);
            answer_timeout = null;

            answer = JSON.parse(answer);
            if (!answer.err)
                doValidation(this.endpoint, 'output', answer.res);
            if(callback) callback(answer.err, answer.res);
        });
    }


}

module.exports = RPCClient;