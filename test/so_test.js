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
        },
        ar: {type: 'array'}
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

var initials = {
    SO: {
        message: "Last thing you said was *NOTHING*",
        rand: 0,
        now: new Date(),
        ar: []
    }
};

var s = new service.Service(descriptor, null, initials);
var c = new service.Client(descriptor);

/**
 * SharedObject test
 */

c.SO.on('init',()=>{
    console.log("Client object was initialised:",c.SO.data);
});

c.SO.on('update',(oldVal, newVal, diffs) => {
    //console.log(oldVal);
    console.log("Client object was updated:", c.SO.data);
    if(c2++>1000) process.exit();
});
c.SO.subscribe()
var t = 0;
var c2 = 0;
setTimeout(()=>{

setInterval(function() {
    if(t==0){
        s.SO.data.x = [];
        t = 1;
        return
    }
    if(s.SO.data.x.length < 3) s.SO.data.x.push('1');
    else s.SO.data.x.pop()

    s.SO.notify();
});

},500)
