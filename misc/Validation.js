var inspector = require("schema-inspector");

module.exports.RPCValidation = function _doValidation(endpoint, inout, obj){
    var schema;
    if (inout == "input"){
        schema = endpoint.requestSchema;
    }else if (inout == "output"){
        schema = endpoint.replySchema;
    }else{
        throw new Error("doValidation called with wrong argument");
    }


    if (!schema){
        console.error("There's no schema for RPC Call " + endpoint.name + ". Fix this!");
        return obj;
    }else {
        // Sanitise first for date handling.
        var r = inspector.sanitize(schema, obj);
        var validation = inspector.validate(schema, r.data);
        if (!validation.valid){
            throw new Error("Validation failed! " + JSON.stringify(validation));
        }

        return r.data;
    }
};

module.exports.SourceValidation = function _doValidation(endpoint, obj){
    var schema = endpoint.messageSchema;
    if (!schema){
        console.error("There's no schema for Source " + endpoint.name + ". Fix this!");
        return obj;
    }

    var r = inspector.sanitize(schema, obj);
    var validation = inspector.validate(schema, r.data);

    if (!validation.valid){
        throw new Error("Validation failed! " + JSON.stringify(validation));
    }

    return r.data;
};

module.exports.SharedObjectValidation = function _doValidation(schema, obj){
    if (!schema){
        console.error("There's no schema for SharedObject " + endpoint.name + ". Fix this!");
        return obj;
    }

    var r = inspector.sanitize(schema, obj);
    var validation = inspector.validate(schema, r.data);

    if (!validation.valid){
        throw new Error("Validation failed! " + JSON.stringify(validation));
    }

    return r.data;
};