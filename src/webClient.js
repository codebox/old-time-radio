"use strict";
const axios = require('axios'),
    log = require('./log.js'),
    cacheBuilder = require('./cache.js');

const cache = cacheBuilder.buildCache('web', url => {
        log.debug(`Requesting ${url}...`);
        return axios.get(url).then(response => response.data);
    });

module.exports = {
    get(url) {
        return cache.get(url);
    }
};
