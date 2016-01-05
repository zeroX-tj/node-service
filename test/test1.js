var service = require("../index");

var RPCTestRequestSchema = {
    type: 'string'
};

var RPCTestReplySchema = {
    type: 'object',
    properties: {
        msg: {
            type: 'string',
            pattern: /You said .*/
        },
        date: {
            type: 'date'
        }
    }
};

var SourceSchema = {
    type: 'object',
    properties: {
        message: {
            type: 'string'
        },
        rand: {
            type: 'number'
        }
    }
};

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
            name: "RPCTest",
            type: "RPC",
            requestSchema: RPCTestRequestSchema,
            replySchema: RPCTestReplySchema
        },
        {
            name: "Sourcetest",
            type: "Source",
            messageSchema: SourceSchema
        },
        {
            name: "SO",
            type: "SharedObject",
            objectSchema: SharedObjectSchema
        }
    ]
};

var lastMSG = "*NOTHING*";

function RPCHandler(req,rep){
    console.log("Handler called");
    lastMSG = req;
    rep(null,{
        msg: "You said " + req,
        date: new Date()
    });
}

var handlers = {
    RPCTest: RPCHandler
};

var initials = {
    SO: {
        message: "Last thing you said was *NOTHING*",
        rand: 0,
        now: new Date()
    }
};

var s = new service.Service(descriptor, handlers, initials);
var c = new service.Client(descriptor);
c.Sourcetest.subscribe();
/**
 * RPC Test
 */
/*
setTimeout(()=> {
    c.RPCTest.call("Hello", function (err, res) {
        console.log("Server answered:", res);
    });
},5000);
*/
/**
 * Source test
 */

c.Sourcetest.on('message', function(msg){
    console.log("Got a message:", msg);
});

setInterval(function() {
    s.Sourcetest.send({
        message: "This is a message",
        rand: Math.random()
    });
},2000);


/**
 * SharedObject test
 */

c.SO.on('init',()=>{
    console.log("Client object was initialised:",c.SO.data);
});

c.SO.on('update',(oldVal, newVal, diffs) => {
    console.log("Client object was updated:", c.SO.data);
});
c.SO.subscribe()
setInterval(function() {
    s.SO.data.rand = Math.random();
    s.SO.data.now = new Date();
    s.SO.data.message = "Last thing you said was " + lastMSG;
    s.SO.notify();
},1000);

