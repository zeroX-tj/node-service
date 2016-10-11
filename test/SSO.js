/*
 ShardedSharedObject
 */

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
        rpc: {
            client: "tcp://127.0.0.1:14003",
            server: "tcp://127.0.0.1:14003"
        }
    },
    endpoints: [
        {
            name: "SO",
            type: "ShardedSharedObject",
            objectSchema: SharedObjectSchema,
            workerPath:  require.resolve('./SSO_Worker'),
            transports: [
                {
                    source: {
                        client: "tcp://127.0.0.1:14001",
                        server: "tcp://127.0.0.1:14001"
                    },
                    rpc: {
                        client: "tcp://127.0.0.1:14003",
                        server: "tcp://127.0.0.1:14003"
                    }
                },
                {
                    source: {
                        client: "tcp://127.0.0.1:14010",
                        server: "tcp://127.0.0.1:14010"
                    },
                    rpc: {
                        client: "tcp://127.0.0.1:14030",
                        server: "tcp://127.0.0.1:14030"
                    }
                },
                {
                    source: {
                        client: "tcp://127.0.0.1:14011",
                        server: "tcp://127.0.0.1:14011"
                    },
                    rpc: {
                        client: "tcp://127.0.0.1:14031",
                        server: "tcp://127.0.0.1:14031"
                    }
                },
                {
                    source: {
                        client: "tcp://127.0.0.1:14012",
                        server: "tcp://127.0.0.1:14012"
                    },
                    rpc: {
                        client: "tcp://127.0.0.1:14032",
                        server: "tcp://127.0.0.1:14032"
                    }
                }
            ],
            sub_endpoints: [ {
                name: "SO",
                type: "ShardedSharedObject",
                objectSchema: SharedObjectSchema,
            }]
        }
    ],
};


var initials = {
    SO: {
    }
};


var c = new service.Client(descriptor);
/**
 * SharedObject test
 */

c.SO.on('init', () => {
    console.log("Client object was initialised:", c.SO.data);
});

c.SO.on('update', (oldVal, newVal, diffs) => {
    console.log("Client object was updated:", c.SO.data);
});
c.SO.subscribe()

var s = new service.Service(descriptor, {}, initials);
setInterval(function () {
    s.SO.put(['1234','rand'], Math.random());
    s.SO.put(['666','now'], new Date());
    //s.SO.notify();
}, 1000);