"use strict";
(function () {
    var proxyHandler = (id)=> {
        return {
            get: function (target, key) {
                if (!(key in target)) {
                    return undefined;
                }

                return target[key]
            },
            set: (target, key, value) => {
                console.log(id, 'set', key, 'from', target[key], 'to', value)
                if (!(key in target)) {
                    if (typeof value == 'object') {
                        id.push(key)
                        target[key] = deepProxy(value, id)
                    }else {
                        target[key] = value
                    }
                }else if(typeof target[key] == 'object'){
                    id.push(key)
                    target[key] = deepProxy(value, id)
                }else
                    target[key] = value;
                return true
            }
        }
    }

    function deepProxy (obj, key) {
        return new Proxy(obj, proxyHandler(key))
    }

    if (typeof module === 'undefined') {
        this.deepProxy = deepProxy
    } else {
        module.exports = deepProxy
    }
let obj = {}

let proxy = deepProxy(obj, [])
    proxy.very = {};
    proxy.very.deeply = {}
    proxy.very.deeply.nested = {}
    proxy.very.deeply.nested.property = 'possible';
    proxy.very.deeply.nested.too = 'possible';
    console.log(JSON.stringify(proxy));
    proxy.very.deeply.nested.too = 'changeable';
    console.log(JSON.stringify(proxy));
})()
