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
    }else {
        var validation = inspector.validate(schema, obj);

        if (!validation.valid){
            throw new Error("Validation failed! " + validation.format());
        }
    }
};

module.exports.SourceValidation = function _doValidation(endpoint, obj){
    var schema = endpoint.messageSchema;

    if (!schema){
        console.error("There's no schema for Source " + endpoint.name + ". Fix this!");
    }

    // Check if we need to run validation
    if(schema.skip){
        return
    }
    
    var validation = inspector.validate(schema, obj);

    if (!validation.valid){
        throw new Error("Validation failed! " + validation.format());
    }
};

module.exports.PushValidation = function _doValidation(endpoint, obj){
    var schema = endpoint.messageSchema;

    if (!schema){
        console.error("There's no schema for Source " + endpoint.name + ". Fix this!");
    }

    var validation = inspector.validate(schema, obj);

    if (!validation.valid){
        throw new Error("Validation failed! " + validation.format());
    }
};

module.exports.SharedObjectValidation = function _doValidation(endpoint, obj, hint){
    if (!endpoint.objectSchema){
        console.error("There's no schema for SharedObject " + endpoint.name + ". Fix this!");
    }

    if (!hint) {
        hint = [];
    }

    var subs = _getSubsForHint(endpoint.objectSchema, obj, hint);

    var schema = subs.schema;
    obj = subs.obj;

    var validation = inspector.validate(schema, obj);

    if (!validation.valid){
        throw new Error("Validation failed! " + validation.format());
    }
};

function _getSubsForHint(schema, obj, hint){
    var i = 0;
    while(i < hint.length){
        if (!(hint[i] in obj)) {
            break; // On delete, validate entire parent. Otherwise possible missing items may not be caught.
        }

        obj = obj[hint[i]];

        if (schema.type == 'object'){
            if (hint[i] in schema.properties){
                schema = schema.properties[hint[i]];
            }else if ('*' in schema.properties){
                schema = schema.properties['*'];
            }else{
                throw new Error("Unknown property, and no catch all!")
            }
        }else if (schema.type == 'array'){
            schema = schema.items;
        }else{
            // Hinting on anything else is not currently supported, crash on possible weirdness.
            throw new Error("Please only do hinting on objects/arrays.");
        }

        i++;
    }

    return {schema, obj};
}