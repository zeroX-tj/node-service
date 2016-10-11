"use strict";
var id = process.argv[2];
var init_data = JSON.parse(process.argv[3]);
var descriptor = JSON.parse(process.argv[4]);
var worker = require(process.argv[5]);

worker.init(descriptor, init_data);

process.on('message', (payload)=>{
    switch (payload.cmd){
        case 'put':
            worker.put(payload.data.key, payload.data.value);
            break;
        case 'remove':
            worker.remove(payload.data);
            break;
        default:
            throw new Error('unknown cmd');
    }
})