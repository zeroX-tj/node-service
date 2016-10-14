"use strict";
var clone = require("../misc/clone");

class ShardedSharedObjectBridge {
    constructor(endpoint, transport) {
        if (!(endpoint.shardKeyIndex >= 0))
            throw new Error("Sharded shared objects need a shardKeyIndex to be configured");

        this.endpoint = endpoint;
        this.transport = transport;
    }

    put(key, value){
        var shard_id = this.transport.sharding.get(key[this.endpoint.shardKeyIndex]);
        //console.log('putting', key.join('.'), 'on shard id', shard_id, 'for path', key[0])
        key.unshift(this.endpoint.name); // Add endpoint to path
        this.transport.shards[shard_id].send({cmd: 'put', data:{key, value}})
    }

    remove(key){
        var shard_id = this.transport.sharding.get(key[this.endpoint.shardKeyIndex]);
        //console.log('delete', key.join('.'), 'on shard id', shard_id, 'for path', key[0])
        key.unshift(this.endpoint.name); // Add endpoint to path
        this.transport.shards[shard_id].send({cmd: 'remove', data:{key}})
    }
}

module.exports = ShardedSharedObjectBridge;