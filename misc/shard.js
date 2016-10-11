"use strict";
var shards = [];
var map = {};

class GenericSharder {
    constructor(nr_of_shards) {
        for (var i = 0; i < nr_of_shards; i++) {
            if (!shards[i])
                shards[i] = {id: i, ids:{}, total_usage: 0}
        }
    }

    // Get or init for id
    get(id) {
        if (map[id]) {
            return map[id].shard_id;
        } else {
            // Get weight and least used shard for event_id
            var shard_id = getLeastUsedShard();

            // Map market to shard for fast mapping later
            map[id] = {shard_id, id};

            // Init shard object for event_id if needed
            if(!shards[shard_id].ids[id])
                shards[shard_id].ids[id] = {};

            shards[shard_id].ids[id] = 1;
            shards[shard_id].total_usage += 1;
            return shard_id;
        }
    }

    // Cleanup when deleted
    delete(id) {
        shards[map[id].shard_id].total_usage -= 1;
        delete shards[id].ids[map[id].event_id][id];
        if(!Object.keys(shards[id].ids).length){
            delete shards[id].ids;
        }
        delete map[id];
    }
}

// Get shard with least usage for an id and least usage overall
function getLeastUsedShard() {
    var shard_score = [];
    shards.forEach((shard)=>{
        if(!shard_score[shard.id]){
            shard_score[shard.id] = {}
        }
        shard_score[shard.id].id = shard.id;
        shard_score[shard.id].total_usage = shard.total_usage;
    });
    shard_score.sort(function (a, b) {
        return a.total_usage - b.total_usage;
    });
    return shard_score[0].id;
}

module.exports = GenericSharder;

function shardingTest(){
    var ids = [1,2,3,4,5,6,7,8,9,1,2,3,4,5,6];
    var types = ['ASIAN_HANDICAP'];
    var s = new GenericSharder(4);
    for(var i = 0; i < ids.length; i++){
        console.log(ids[i], ':', s.get(ids[i], 'test', types[i]));
        console.log(ids[i], ':', s.get(ids[i], 'test', types[i]));
    }
}
//shardingTest()