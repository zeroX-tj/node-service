var nodeservice = require("../index");

var descriptor = {
    transports: {
        sink: {
            client: "tcp://127.0.0.1:14001",
            server: "tcp://127.0.0.1:14001"
        }
    },
    endpoints: [
        {
            name: "Work",
            type: "Sink",
            messageSchema: {
                type: 'object',
                strict: false,
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

Server.Work.on('message', function(msg){
    console.log("Server", msg);
});

var i = 0;
setInterval(function(){
    i++;
    if(i%2==0)
        Client1.Work.push({i, rand: Math.random(), client: 1, date: new Date()});
    else
        Client2.Work.push({i, rand: Math.random(), client: 2, date: new Date()});

}, 100);