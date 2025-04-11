"use strict";
const config = require('../config.json'),
    clock = require('./clock.js'),
    log = require('./log.js'),
    fs = require('fs').promises,
    mkdirSync = require('fs').mkdirSync,
    path = require('path'),
    ENCODING = 'utf-8',
    MILLISECONDS_PER_SECOND = 1000;

function memoize<T>(fn: any => T, name) {
    // TODO
}


module.exports = {
    memoize
};