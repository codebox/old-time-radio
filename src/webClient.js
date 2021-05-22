"use strict";
const axios = require('axios'),
    log = require('./log.js'),
    config = require('../config.json'),
    cacheBuilder = require('./cache.js');

const cache = cacheBuilder.buildCache('web', url => {
        log.debug(`Requesting ${url}...`);
        return axios.get(url).then(response => response.data);
    }, config.webCache);

module.exports = {
    get(url) {
        return cache.get(url);
    }
};
