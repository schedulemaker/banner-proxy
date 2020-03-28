'use-strict'

if (typeof(cache) === 'undefined'){
    var cache = require('./cache');
}

exports.handler = async ({school, term, method, params}, context) => {
    return checkCache(school, term) || await requestData(school, term, method, params);
}

function checkCache(school, term){
    let obj = cache.bannerCache[school][term][method];

    //Check if the object is in the cache
    if (typeof(obj) === 'undefined'){
        return false;
    }

    //Check if the object is in the cache, but expired
    if ((Date.now() / 1000) - obj.timestamp < process.env.EXPIRE){
        return false
    }
    else return obj;
}

function createCacheEntries(school, term){
    //Check that a banner object has been created for the school and there is a cache entry for the school
    if (typeof(cache.bannerCache[school]) === 'undefined'){
        cache.bannerObjs[school] = new cache.Banner(school);
        cache.bannerCache[school] = {};
    }

    //Check there is a term entry for the school
    if (typeof(cache.bannerCache[school][term]) === 'undefined'){
        cache.bannerCache[school][term] = {};
    }
}

async function requestData(school, term, method, params){
    //perform the request to Banner for the data
    let request = cache.bannerObjs[school][method](params);

    createCacheEntries(school, term);

    //put the data into the cache
    let data = await request;
    cache.bannerCache[school][term][method] = {
        //Timestamp is stored as SECONDS
        timestamp: Date.now() / 1000,
        data: data
    }
    //return the data
    return data;
}