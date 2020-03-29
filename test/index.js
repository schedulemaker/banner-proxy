'use-strict'

const assert = require('assert');
const rewire = require('rewire');
const index = rewire('../index');

process.env.RAM_THRESHOLD = 0.9;
process.env.CHECK_FREQUENCY = 10;
process.env.EXPIRE = 600;

describe('Banner Proxy', function(){
    describe('Handler', function(){
        

    });  

    describe('checkCache', function(){
        before(function(){
            this.function = index.__get__(this.test.parent.title);
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

    describe('checkTmpDir', function(){

    });

    describe('createCacheEntries', function(){

    });

    describe('createTmpDirEntries', function(){

    });

    describe('requestData', function(){

    });
});