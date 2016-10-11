"use strict";
module.exports = {
    init: (descriptor,initial_data)=>{
        console.log(descriptor, initial_data);

    },
    put: (key, value)=>{
        console.log('put', key, value)
    },
    remove: ()=>{

    }
}