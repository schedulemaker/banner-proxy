'use-strict'

if (typeof(cache) === 'undefined'){
    var cache = require('./cache');
}

exports.handler = async ({school, term, method, params={}}, context) => {
    if (!(school && term && method)){
        throw new Error('Must provide school, term, and method');
    }
    cache.counter++;
    let data = checkCache(school, term, method) || await checkTmpDir(school, term, method);
    if (data) return data;
    else {
        if (cache.counter % process.env.CHECK_FREQUENCY === 0){
            checkRAM(context);
        }
        return await requestData(school, term, method, params);
    }
}

/**
 * 
 * @param {*} obj The cache entry to check
 * @returns {boolean} TRUE if the object is expired, FALSE if the object is not expired
 */
function checkExpiration(obj){
    return (Date.now() / 1000) - obj.timestamp > process.env.EXPIRE;
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
    return checkExpiration(obj) ? false : obj.data;
}

function createCacheEntries(school, term){
    //Check that there is a cache entry for the school
    if (typeof(cache.bannerCache[school]) === 'undefined'){
        cache.bannerCache[school] = {};
    }

    //Check there is a term entry for the school
    if (typeof(cache.bannerCache[school][term]) === 'undefined'){
        cache.bannerCache[school][term] = {};
    }
}

async function checkTmpDir(school, term, method){
    try {
        let obj = JSON.parse(await cache.fs.readFile(`${cache.dir}/${school}/${term}/${method}.json`, 'utf8'));
        return checkExpiration(obj) ? false : obj.data;
    } catch (error) {
        return false;
    }
}

async function createTmpDirEntries(school, term){
    await cache.fs.mkdir(`${cache.dir}/${school}/${term}`, {recursive: true});
}

async function requestData(school, term, method, params){
    if(typeof(cache.bannerObjs[school] === 'undefined')){
        cache.bannerObjs[school] = new cache.Banner(school);
    }
    cache.useTmp ? await createTmpDirEntries(school, term) : createCacheEntries(school, term);

    //perform the request to Banner for the data
    let request = cache.bannerObjs[school][method](params);

    //put the data into the cache
    let obj = {
        //Timestamp is stored as SECONDS
        timestamp: Date.now() / 1000,
        data: await request
    }
    cache.useTmp ? await cache.fs.writeFile(`${cache.dir}/${school}/${term}/${method}.json`, JSON.stringify(obj), 'utf8') 
        : cache.bannerCache[school][term][method] = obj;
    //return the data
    return obj.data;
}

/**
 * Determines whether future cached entries should be written to the /tmp directory instead of stored in RAM
 * @param {AWS.Lambda.Context} context 
 */
function checkRAM(context){
    cache.useTmp = process.memoryUsage().rss / (context.memoryLimitInMB * 1024 * 1024) >= process.env.RAM_THRESHOLD;
}