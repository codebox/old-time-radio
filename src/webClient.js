"use strict";
const axios = require('axios'),
    log = require('./log.js'),
    config = require('../config.json'),
    cacheBuilder = require('./cache.js');

const headers = {
    headers: {
        'User-Agent': config.webClient.userAgent
    }
};

const cache = cacheBuilder.buildCache('web', url => {
        log.info(`Requesting ${url}...`);
        return axios.get(url, headers).then(response => response.data);
    });

module.exports = {
    get(url) {
        return cache.get(url);
    }
};
