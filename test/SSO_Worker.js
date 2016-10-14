"use strict";
var service = require("../index");
var s;
var data = {};
module.exports = {
    init: (descriptor,initial_data)=>{
        s = new service.Service(descriptor, {TakeSnapshot: (req, rep)=>{
            rep(null, {w00t:'t00t'})
        }}, initial_data);
        data = initial_data;
        return s;
    },
    put: (endpointName, path, value)=>{
        var to = s[endpointName].data;
        var field = path.pop();
        path.forEach((k)=>{
            if(!to[k])
                to[k]={};
            to = to[k];
        });
        to[field] = value;
        s[endpointName].notify(path);
    },
    remove: (endpointName, path)=>{
        var to = s[endpointName].data;
        var field = path.pop();
        path.forEach((k)=>{
            if(!to[k])
                return;
            to = to[k];
        });
        delete to[field];
        s[endpointName].notify(path);
    },
};