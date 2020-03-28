'use-strict'

if (typeof(Banner) === 'undefined'){
    var Banner = require('banner');
}

if (typeof(fs) === 'undefined'){
    var fs = require('fs');
}

module.exports = {
    Banner: Banner,
    bannerObjs: {},
    bannerCache: {},
    fs: fs,
    dir: '/tmp',
    useTmp: false,
    counter: 1
}