var service = require("../index");

var SharedObjectSchema = {
    type: 'object',
    properties:{
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
            client: "tcp://127.0.0.1:13001",
            server: "tcp://127.0.0.1:13001"
        },
        sink: {
            client: "tcp://127.0.0.1:13002",
            server: "tcp://127.0.0.1:13002"
        },
        rpc: {
            client: "tcp://127.0.0.1:13003",
            server: "tcp://127.0.0.1:13003"
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

var lastMSG = "*NOTHING*";

var initials = {
    SO: {
        message: "Last thing you said was *NOTHING*",
        rand: 0,
        now: new Date()
    }
};

var s = new service.Service(descriptor, {}, initials);

/**
 * SharedObject test
 */

setInterval(function() {
    s.SO.data.rand = Math.random();
    s.SO.data.now = new Date();
    s.SO.data.message = "Last thing you said was " + lastMSG;
    s.SO.notify();
},1);


