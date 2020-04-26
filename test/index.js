'use-strict'
process.env.RAM_THRESHOLD = 0.9;
process.env.CHECK_FREQUENCY = 10;
process.env.EXPIRE = 600;
process.env.EXCLUDED_METHODS = 'excludedMethod';

const assert = require('assert');
const fs = require('fs');
const rewire = require('rewire');
const index = (function(){
    //manually rewire Banner module to a blank file
    const code = 'module.exports = {};';
    fs.mkdirSync('./index/node_modules/banner', {recursive: true});
    fs.writeFileSync('./index/node_modules/banner/index.js', code);
    return rewire('../index');
})();

const {promisify} = require('util');

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const rmdir = promisify(fs.rmdir);

const BannerMock = class {
    constructor(school){
        if (school !== 'foo'){
            throw new Error('Bad school');
        }
    }

    successfulRequest(){
        return  'data';
    }

    badRequest(){
        throw new Error('Request error');
    }

    excludedMethod(){
        return 'data that should not be cached';
    }
}

function randInt(){
    return Math.floor(Math.random() * Math.floor(999999));
}

describe('Banner Proxy', function(){
    describe('#checkExpiration', function(){
        before(function(){
            this.function = index.__get__('checkExpiration');
            this.expiredObj = {
                data: 'data',
                timestamp: 0 //Should always be greater than EXPIRE since 0
            };
            this.okObj = {
                data: 'data',
                timestamp: Date.now() / 1000 //Should always be less than EXPIRE since test runs immediately after
            }
        });

        it('Should return TRUE if time is GREATER than EXPIRE', function(){
            assert.strict(this.function(this.expiredObj));
        });

        it('Should return FALSE if time is LESS than EXPIRE', function(){
            assert.strict(this.function(this.okObj) === false);
        });
    });

    describe('#checkRAM', function(){
        before(function(){
            this.function = index.__get__('checkRAM');
            this.cache = {
                useTmp: false
            }
            this.fullContext = {
                memoryLimitInMB: (process.memoryUsage().rss / (1024 * 1024)) * 1 + ((1 - process.env.RAM_THRESHOLD) / 2) //Add a little bit of overhead to current RAM usage
            },
            this.notFullContext = {
                memoryLimitInMB: 128 //Smallest RAM amount allowed by Lambda. Should be more than sufficient for testing.
            }
            index.__set__({cache: this.cache});
        });

        it('Should return TRUE if the amount of available RAM is LESS than RAM_THRESHOLD', function(){
            this.function(this.fullContext);
            assert.strict(index.__get__('cache').useTmp);
        });

        it('Should return FALSE if the amount of available RAM is GREATER than RAM_THRESHOLD', function(){
            this.function(this.notFullContext);
            assert.strict(index.__get__('cache').useTmp === false);
        });
    });

    describe('#checkCache', function(){
        before(function(){
            this.function = index.__get__('checkCache');
            this.school = 'foo';
            this.term = randInt();
            this.method = 'bar';
            this.emptyCache = {};
            this.notExpiredCache = {
                bannerCache: {
                    [this.school]:{
                        [this.term]: {
                            [this.method]: {
                                data: 'data',
                                timestamp: Date.now() / 1000
                            }
                        }
                    }
                }
            };
            this.expiredCache = {
                bannerCache: {
                    [this.school]:{
                        [this.term]: {
                            [this.method]: {
                                data: 'data',
                                timestamp: 0 
                            }
                        }
                    }
                }
            };
        });
        
        it('Should return TRUE when object is in the cache and not expired', function(){
            index.__set__({cache: this.notExpiredCache});
            assert.strict(this.function(this.school, this.term, this.method));
        });

        it('Should return FALSE when object is not in the cache', function(){
            index.__set__({cache: this.emptyCache});
            assert.strict(this.function(this.school, this.term, this.method) === false);
        });

        it('Should return FALSE if the object is in the cache, but expired', function(){
            index.__set__({cache: this.expiredCache});
            assert.strict(this.function(this.school, this.term, this.method) === false);
        });
    });

    describe('#checkTmpDir', function(){
        before(async function(){
            this.school = 'foo';
            this.term = randInt();
            this.method = 'bar';
            this.function = index.__get__('checkTmpDir');
            this.cache = {
                dir: '/tmp',
                fs: {
                    mkdir: mkdir,
                    readFile: promisify(fs.readFile),
                    writeFile: writeFile
                }
            };
            this.goodData = {
                data: 'data',
                timestamp: Date.now()
            };
            this.expiredData = {
                data: {foo:'bar'},
                timestamp: 0
            };
            this.path = `/tmp/${this.school}/${this.term}`;
            await mkdir(this.path, {recursive: true});
            await writeFile(this.path + '/good.json', JSON.stringify(this.goodData), 'utf8');
            await writeFile(this.path + '/bad.json', JSON.stringify(this.expiredData), 'utf8');
            index.__set__({cache: this.cache});
        });

        it('Should not throw an error', async function(){
            await assert.doesNotReject(this.function(this.school, this.term, this.method));
        });

        it('Should return FALSE if the file is not in the /tmp directory', async function(){
            assert.strict(await this.function(this.school, this.term, this.method) === false);
        });

        it('Should return the data if the file is in the /tmp directory and not expired', async function(){
            assert.strict(await this.function(this.school, this.term, 'good'));
        });

        it('Should return FALSE if the file is in the /tmp directory but is expired', async function(){
            assert.strict(await this.function(this.school, this.term, 'bad') === false);
        });

        after(async function(){
            await rmdir(`/tmp/${this.school}`, {recursive: true});
        });
    });

    describe('#createCacheEntries', function(){
        before(function(){
            this.school = 'foo',
            this.term = randInt();
            this.cache = {
                bannerCache: {},
                bannerObjs: {}
            };
            this.function = index.__get__('createCacheEntries');
            index.__set__({cache: this.cache});
            this.function(this.school, this.term);
        });

        // it('Should create a new Banner object for the school', function(){
        //     assert.strict(index.__get__('cache').bannerObjs[this.school]);
        // });

        it('Should create an entry for the school and term', function(){
            assert.strict(index.__get__('cache').bannerCache[this.school][this.term]);
        });
    });

    describe('#createTmpDirEntries', function(){
        before(async function(){
            this.school = 'foo';
            this.term = randInt();
            this.cache = {
                dir: '/tmp',
                fs: {
                    mkdir: mkdir
                }
            };
            this.path = `/tmp/${this.school}/${this.term}`;
            this.function = index.__get__('createTmpDirEntries');
            index.__set__({cache: this.cache});
            await this.function(this.school, this.term);
        });

        it('Should create folders for the school and term', function(){
            assert.strict(fs.existsSync(this.path));
        });

        after(async function(){
            await rmdir(`/tmp/${this.school}`, {recursive: true});
        });
    });

    describe('#requestData', function(){
        before(function(){
            this.function = index.__get__('requestData');
            this.term = 1;
            this.goodSchool = 'foo';
            this.badSchool = 'fakeSchool';
            this.goodMethod = 'successfulRequest';
            this.badMethod = 'badRequest';
            this.fakeMethod = 'methodThatDoesntExist';
            this.excludedMethod = 'excludedMethod';
            this.cache = {
                bannerCache: {},
                bannerObjs: {},
                Banner: BannerMock,
                dir: '/tmp',
                fs: {
                    mkdir: mkdir,
                    writeFile: writeFile
                },
                excluded_methods: [
                    this.excludedMethod
                ]
            };
            index.__set__({cache: this.cache});
        });

        it('Should pass through errors from Banner', async function(){
            await assert.rejects(this.function(this.badSchool, this.term, this.goodMethod), Error, 'Bad school');
            await assert.rejects(this.function(this.goodSchool, this.term, this.badMethod), Error, 'Request error');
            await assert.rejects(this.function(this.badSchool, this.term, this.fakeMethod), Error);
        });

        it('Should put data in the cache if there is enough RAM', async function(){
            this.cache.useTmp = false;
            index.__set__({cache: this.cache});
            await this.function(this.goodSchool, this.term, this.goodMethod);
            assert.strict(index.__get__('cache').bannerCache[this.goodSchool][this.term][this.goodMethod]);
        });

        it('Should put data in the /tmp directory if there is not enough RAM', async function(){
            this.cache.useTmp = true;
            index.__set__({cache: this.cache});
            await this.function(this.goodSchool, this.term, this.goodMethod);
            assert.strict(fs.existsSync(`/tmp/${this.goodSchool}/${this.term}/${this.goodMethod}.json`));
        });

        it('Should NOT put data from excluded methods into the cache or tmp dir', async function(){
            index.__set__({cache: this.cache});
            await this.function(this.goodSchool, this.term, this.excludedMethod);
            assert.strictEqual(index.__get__('cache').bannerCache[this.goodSchool][this.term][this.excludedMethod], undefined);
            assert.strictEqual(fs.existsSync(`${this.cache.dir}/${this.goodSchool}/${this.term}/${this.excludedMethod}`), false);
        });

        after(async function(){
            await rmdir(`/tmp/${this.school}`, {recursive: true});
        });
    });

    describe('#handler', function(){
        before(async function(){
            this.function = index.handler;
            this.goodArgs = {
                school: 'foo',
                term: 1,
                method: 'successfulRequest'
            };
            this.badArgs = {
                school: 'fakeSchool',
                term: 0
            };
            this.context = {
                memoryLimitInMB: 0
            };
            this.excludedMethod = 'excludedMethod';
            this.cache = {
                counter: process.env.CHECK_FREQUENCY - 1,
                useTmp: false,
                bannerObjs: {},
                bannerCache: {},
                fs: {
                    mkdir: mkdir,
                    writeFile: writeFile
                },
                Banner: BannerMock,
                dir: '/tmp',
                excluded_methods: [
                    this.excludedMethod
                ]
            }
            index.__set__({cache: this.cache});
            await index.handler(this.goodArgs, this.context);
        });

        it('Should handle incorrect arguments', async function(){
            await assert.rejects(index.handler(this.badArgs), Error, 'Must provide school, term, and method');
        });

        it('Should increment the counter', function(){
            assert.strict(index.__get__('cache').counter == process.env.CHECK_FREQUENCY);
        });

        it(`Should call checkRAM every ${process.env.CHECK_FREQUENCY} times`, function(){
            assert.strict(index.__get__('cache').useTmp);
        });   

        after(async function(){
            await rmdir(`/tmp/${this.goodArgs.school}`, {recursive: true});
        });
    }); 

    after(function(){
        fs.rmdirSync('./index/node_modules', {recursive: true});
    });
});