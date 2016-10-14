"use strict";
require('json.date-extensions');
JSON.useDateParser();
var id = process.argv[2];
var init_data = JSON.parse(process.argv[3]);
var descriptor = JSON.parse(process.argv[4]);
var worker = require(process.argv[5]);
var _ = require('underscore');

if(!(_.isFunction(worker.init) && _.isFunction(worker.put) && _.isFunction(worker.remove)))
    throw new Error('worker should implement init, put, remove');

var service = worker.init(descriptor, init_data);

process.on('message', (payload)=>{
    switch (payload.cmd){
        case 'put':
            var path = payload.data.key;
            var endpointName = path.shift();
            //console.log(data)
            worker.put(endpointName, path, payload.data.value);
            break;
        case 'remove':
            worker.remove(payload.data);
            break;
        case 'rpc':
            service.RPCServices[payload.data.endpointName].handler(payload.data.req, (err, res)=>{
                var replyPayload = {cmd:"rpc", id:payload.data.req_id, err, res};
                process.send(replyPayload);
            })
            break;
        default:
            throw new Error('unknown cmd');
    }
})