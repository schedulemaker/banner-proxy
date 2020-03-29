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
    counter: 1
}