'use-strict'

if (!cache){
    var cache = require('./cache');
}

exports.handler = async (event, context) => {
    return checkCache(event) || await requestData(event);
}

function checkCache(event){
    return null; //TODO - check cache
}

function createResources(){

}

async function requestData(event){
    //Check that a banner object has been created for the school and there is a cache entry for the school
    if (!cache.bannerCache[event.school]){
        cache.bannerObjs[event.school] = new cache.Banner(event.school);
        cache.bannerCache[event.school] = {};
    }

    //Check there is a term entry for the school
    if (!cache.bannerCache[event.school][event.term]){
        cache.bannerCache[event.school][event.term] = {};
    }

    //perform the request to Banner for the data
    let data = await cache.bannerObjs[event.school][event.method](event.params);
    //put the data into the cache
    cache.bannerCache[event.school][event.term][event.method] = {
        timestamp: Date.now() / 1000,
        data: data
    }
    //return the data
    return data;
}