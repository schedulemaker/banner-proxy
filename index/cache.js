'use-strict'

if (typeof(Banner) === 'undefined'){
    var Banner = require('banner');
}

module.exports = {
    Banner: Banner,
    bannerObjs: {},
    bannerCache: {}
}