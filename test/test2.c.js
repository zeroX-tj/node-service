"use strict";
var service = require("../index");


var SharedObjectSchema = {
    type: 'object',
    properties: {
        message: {
            type: 'string',
            pattern: /Last thing you said was .*/
        },
        rand: {
            type: 'number'
        },
        now: {
            type: 'date'
        }
    }
};

var descriptor = {
    transports: {
        source: {
            client: "tcp://127.0.0.1:14001",
            server: "tcp://127.0.0.1:14001"
        },
        sink: {
            client: "tcp://127.0.0.1:14002",
            server: "tcp://127.0.0.1:14002"
        },
        rpc: {
            client: "tcp://127.0.0.1:14003",
            server: "tcp://127.0.0.1:14003"
        }
    },
    endpoints: [
        {
            name: "SO",
            type: "SharedObject",
            objectSchema: SharedObjectSchema
        }
    ]
};

var c = new service.Client(descriptor);
c.SO.on('init', ()=> {
    console.log("Client object was initialised:", c.SO.data);
});

c.SO.on('update', (oldVal, newVal, diffs) => {
    console.log("Client object was updated:", c.SO.data);
});
c.SO.subscribe();
