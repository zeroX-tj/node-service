"use strict";

var doValidation = require("../misc/Validation").RPCValidation;

class RPCClient {
    constructor(endpoint, transports){
        this.transport = transports.rpc;
        this.endpoint = endpoint;
        if (!this.transport)
            throw "Trying to initialise an RPC service without RPC config!";
    }

    call(input, callback){
        input = doValidation(this.endpoint, 'input', input);

        this.transport.send({
            endpoint: this.endpoint.name,
            input: JSON.stringify(input)
        }, (answer) => {
            answer = JSON.parse(answer);
            if (!answer.err)
                answer.res = doValidation(this.endpoint, 'output', answer.res);
            callback(answer.err, answer.res);
        });
    }


}

module.exports = RPCClient;