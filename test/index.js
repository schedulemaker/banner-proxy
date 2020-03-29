'use-strict'

const assert = require('assert');
const rewire = require('rewire');
const index = rewire('../index');
const fs = require('fs');
const {promisify} = require('util');
const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);

process.env.RAM_THRESHOLD = 0.9;
process.env.CHECK_FREQUENCY = 10;
process.env.EXPIRE = 600;

describe('Banner Proxy', function(){
    describe('Handler', function(){
        

    });  

    describe('#checkCache', function(){
        before(function(){
            this.function = index.__get__('checkCache');
            this.school = 'foo';
            this.term = Math.floor(Math.random() * Math.floor(999999));
            this.method = 'bar';
            this.emptyCache = {};
            this.notExpiredCache = {
                bannerCache: {
                    [this.school]:{
                        [this.term]: {
                            [this.method]: {
                                data: 'data',
                                timestamp: Date.now() / 1000 //Should always be less than EXPIRE since test runs immediately after
                            }
                        }
                    }
                }
            },
            this.expiredCache = {
                bannerCache: {
                    [this.school]:{
                        [this.term]: {
                            [this.method]: {
                                data: 'data',
                                timestamp: 0 //Should always be greater than EXPIRE since 0
                            }
                        }
                    }
                }
            }
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
            this.term = Math.floor(Math.random() * Math.floor(999999));
            this.method = 'bar';
            this.function = index.__get__('checkTmpDir');
            this.cache = {
                dir: '/tmp',
                fs: {
                    mkdir: mkdir,
                    readFile: promisify(fs.readFile),
                    writeFile: writeFile
                }
            },
            this.goodData = {
                data: {foo:'bar'},
                timestamp: Date.now()
            },
            this.expiredData = {
                data: {foo:'bar'},
                timestamp: 0
            },
            this.path = `/tmp/${this.school}/${this.term}`;
            await mkdir(this.path, {recursive: true});
            await writeFile(this.path + '/good.json', JSON.stringify(this.goodData), 'utf8');
            await writeFile(this.path + '/bad.json', JSON.stringify(this.expiredData), 'utf8');
        });

        it('Should not throw an error', function(){
            index.__set__({cache: this.cache});
            assert.doesNotReject(async () => await this.function(this.school, this.term, this.method));
        });

        it('Should return FALSE if the file is not in the /tmp directory', async function(){
            index.__set__({cache: this.cache});
            assert.strict(await this.function(this.school, this.term, this.method) === false);
        });

        it('Should return the data if the file is in the /tmp directory and not expired', async function(){
            index.__set__({cache: this.cache});
            assert.strict(await this.function(this.school, this.term, 'good'));
        });

        it('Should return FALSE if the file is in the /tmp directory but is expired', async function(){
            index.__set__({cache: this.cache});
            assert.strict(await this.function(this.school, this.term, 'bad') === false);
        });

        after(function(){
            fs.rmdirSync(`/tmp/${this.school}`, {recursive: true});
        });
    });

    describe('#createCacheEntries', function(){

    });

    describe('#createTmpDirEntries', function(){

    });

    describe('#requestData', function(){

    });
});