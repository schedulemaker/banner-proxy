'use-strict'

if (!cache){
    var cache = require('./cache');
}

exports.handler = async ({school, term, method, params}, context) => {
    return checkCache(school, term) || await requestData(school, term, method, params);
}

function checkCache(school, term){
    return null; //TODO - check cache
}

function createResources(){

}

async function requestData(school, term, method, params){
    //Check that a banner object has been created for the school and there is a cache entry for the school
    if (!cache.bannerCache[school]){
        cache.bannerObjs[school] = new cache.Banner(school);
        cache.bannerCache[school] = {};
    }

    //Check there is a term entry for the school
    if (!cache.bannerCache[school][term]){
        cache.bannerCache[school][term] = {};
    }

    //perform the request to Banner for the data
    let data = await cache.bannerObjs[school][method](params);
    //put the data into the cache
    cache.bannerCache[school][term][method] = {
        timestamp: Date.now() / 1000,
        data: data
    }
    //return the data
    return data;
}