/*
 ShardedSharedObject
 */

var service = require("../index");

var SharedObjectSchema = {
    type: 'object',
    properties: {
        message: {
            type: 'string',
        },
        rand: {
            type: 'number'
        },
        now: {
            type: 'date'
        },
        '*': {
            type: 'object',
            properties: {}
        }
    }
};

var TakeSnapshot = {
    RequestSchema: {
        type: 'object',
        properties: {
            id: {
                type: 'string'
            },
            provider: {
                type: 'string'
            },
            tag: {
                type: 'string'
            }
        }
    },
    ReplySchema: {}
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
            type: "ShardedSharedObjects",
            workerPath: require.resolve('./SSO_Worker'),
            transports: [
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
                        client: "tcp://127.0.0.1:14012",
                        server: "tcp://127.0.0.1:14012"
                    },
                    rpc: {
                        client: "tcp://127.0.0.1:14032",
                        server: "tcp://127.0.0.1:14032"
                    }
                },
                {
                    source: {
                        client: "tcp://127.0.0.1:14013",
                        server: "tcp://127.0.0.1:14013"
                    },
                    rpc: {
                        client: "tcp://127.0.0.1:14033",
                        server: "tcp://127.0.0.1:14033"
                    }
                }
            ],
            subEndpoints: [{
                name: "TakeSnapshot",
                type: "RPC",
                requestSchema: TakeSnapshot.RequestSchema,
                replySchema: TakeSnapshot.ReplySchema,
                shardKey: ['id']
            }, {
                name: "SO",
                type: "SharedObject",
                objectSchema: SharedObjectSchema,
                shardKeyIndex: 0
            }]
        }
    ],
};


var initials = {
    SO: {
        message: "Last thing you said was test",
        rand: Math.random(),
        now: new Date()
    }
};


var c = new service.Client(descriptor);
/**
 * SharedObject test
 */

c.SO.on('connected', () => {
    console.log("Client object was connected!");
});

c.SO.on('init', () => {
    console.log("Client object was initialised:", c.SO.data);
});

c.SO.on('update', (oldVal, newVal, diffs) => {
    console.log("Client object was updated:", c.SO.data);
});
c.SO.subscribe()

var s = new service.Service(descriptor, {}, initials);
setInterval(function () {
    s.SO.put(['1234', 'rand'], Math.random());
    s.SO.put(['666', 'now'], new Date());
    s.SO.put(['sdfsdfs', 'now'], new Date());
    s.SO.put(['665646546546', 'now'], new Date());
    s.SO.remove(['66eeeee6']);

    //s.SO.notify();
}, 5000);
setTimeout(()=>{
    "use strict";
    s.SO.put(['66eeeee6', 'now'], new Date());

},1000)


setTimeout(()=>{
    c.TakeSnapshot.call({id:'1234', provider: 'mollybet', tag: 'START'}, (err, result)=>{
        if(err)
            console.error(err)
        console.log('got result')
        console.log(result)
    })
}, 5000)

