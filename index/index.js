'use-strict'

if (typeof(cache) === 'undefined'){
    var cache = require('./cache');
}

exports.handler = async ({school, term, method, params}, context) => {
    cache.counter++;
    let data = checkCache(school, term, method) || await checkTempDir(school, term, method);
    if (data) return data;
    else {
        let request = requestData(school, term, method, params);
        if (cache.counter % process.env.CHECK_FREQUENCY === 0){
            checkRAM(context);
        }
        return await request;
    }
}

function checkCache(school, term, method){
    let obj = {};
    try {
        obj = cache.bannerCache[school][term][method];
    } catch (error) {
        return false;
    }

    //Check if the object is in the cache
    if (typeof(obj) === 'undefined'){
        return false;
    }

    //Check if the object is in the cache, but expired
    if ((Date.now() / 1000) - obj.timestamp > process.env.EXPIRE){
        return false
    }
    else return obj.data;
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

async function checkTempDir(school, term, method){
    try {
        let obj = await cache.fs.readFile(`${cache.dir}/${school}/${term}/${method}.json`, 'utf8');
        return obj.data;
    } catch (error) {
        return false;
    }
}

async function createTempDirEntries(school, term){
    await cache.fs.mkdir(`${cache.dir}/${school}/${term}`, {recursive: true});
}

async function requestData(school, term, method, params){
    //perform the request to Banner for the data
    let request = cache.bannerObjs[school][method](params);

    cache.useTmp ? createCacheEntries(school, term) : await createTempDirEntries(school, term);

    //put the data into the cache
    let data = await request;
    let obj = {
        //Timestamp is stored as SECONDS
        timestamp: Date.now() / 1000,
        data: data
    }
    cache.useTmp ? await cache.fs.writeFile(`${cache.dir}/${school}/${term}/${method}.json`, JSON.stringify(obj), 'utf8') 
        : cache.bannerCache[school][term][method] = obj;
    //return the data
    return data;
}

/**
 * Determines whether future cached entries should be written to the /tmp directory instead of stored in RAM
 * @param {AWS.Lambda.Context} context 
 */
function checkRAM(context){
    cache.useTmp = process.memoryUsage().rss / (context.memoryLimitInMB * 1024 * 1024) >= process.env.RAM_THRESHOLD;
}