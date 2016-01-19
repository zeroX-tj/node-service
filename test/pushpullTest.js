var nodeservice = require("../index");

var descriptor = {
    transports: {
        pushpull: {
            client: "tcp://127.0.0.1:14001",
            server: "tcp://127.0.0.1:14001"
        }
    },
    endpoints: [
        {
            name: "Work",
            type: "PushPull",
            messageSchema: {
                type: 'object',
                strict: true,
                properties:{
                    i:      {type: 'integer'},
                    rand:   {type: 'number'},
                    date:   {type: 'date'}
                }
            }
        }
    ]
};

var Server = new nodeservice.Service(descriptor, {}, {});

var Client1 = new nodeservice.Client(descriptor);
var Client2 = new nodeservice.Client(descriptor);

Client1.Work.subscribe();
Client2.Work.subscribe();

Client1.Work.on('message', function(msg){
    console.log("Client 1", msg);
});

Client2.Work.on('message', function(msg){
    console.log("Client 2", msg);
});

var i = 0;
setInterval(function(){
    i++;
    Server.Work.push({i, rand: Math.random(), date: new Date()});
}, 100);