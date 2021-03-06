"use strict";
require('json.date-extensions');
JSON.useDateParser();
var worker_id = process.argv[2];
var initial_data = JSON.parse(process.argv[3]);
var descriptor = JSON.parse(process.argv[4]);
var worker = {};
if(process.argv[5] != 'undefined'){
    worker = require(process.argv[5]);
}
var nodeservice = require("../index");
var service = new nodeservice.Service(descriptor, worker.handlers, initial_data);
worker.data = initial_data;
if(worker.init){
    worker.init(worker_id);
}
process.on('message', (payload)=>{
    switch (payload.cmd){
        case 'put':
            var path = payload.data.key;
            var endpointName = path.shift();
            var to = service[endpointName].data;
            var field = path.pop();
            path.forEach((k)=>{
                if(!to[k])
                    to[k]={};
                to = to[k];
            });
            to[field] = payload.data.value;
            service[endpointName].notify(path);
            break;
        case 'remove':
            var path = payload.data.key;
            var endpointName = path.shift();
            var to = service[endpointName].data;
            var field = path.pop();
            path.forEach((k)=>{
                if(!to[k])
                    return;
                to = to[k];
            });
            delete to[field];
            service[endpointName].notify(path);
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