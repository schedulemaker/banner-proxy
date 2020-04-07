'use-strict'

if (typeof(Banner) === 'undefined'){
    var Banner = require('banner');
}

if (typeof(fs) === 'undefined'){
    var fs = require('fs');
    var {promisify} = require('util');
    var mkdir = promisify(fs.mkdir);
    var writeFile = promisify(fs.writeFile);
    var readFile = promisify(fs.readFile);
}

if (typeof(excluded_methods) === 'undefined'){
    var excluded_methods = process.env.EXCLUDED_METHODS.split(' ');
}

module.exports = {
    Banner: Banner,
    bannerObjs: {},
    bannerCache: {},
    fs: {
        mkdir: mkdir,
        readFile: readFile,
        writeFile: writeFile
    },
    dir: '/tmp',
    useTmp: false,
    counter: 1,
    excluded_methods: excluded_methods
}