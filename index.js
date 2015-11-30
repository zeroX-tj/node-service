"use strict";
require('json.date-extensions');
JSON.useDateParser();

var Service = require("./Service/Service");
var Client = require("./Client/Client");

module.exports = {
    Service,
    Client
};