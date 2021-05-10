"use strict";
const axios = require('axios'),
    log = require('./log.js'),
    cache = require('./cache.js');

function makeKeyFromUrl(url) {
    return url.replace(/https?:\/\//, '').replace(/[^A-Za-z0-9]+/g, '_');
}

module.exports = {
    init() {
        return cache.loadFromDisk();
    },
    get(url) {
        const cachedData = cache.get(makeKeyFromUrl(url));
        if (cachedData) {
            return Promise.resolve(cachedData);
        } else {
            log.debug(`Requesting ${url}...`);
            return axios.get(url).then(response => {
                const data = response.data,
                    cacheKey = makeKeyFromUrl(url);
                cache.put(cacheKey, data);
                return data;
            });
        }
    }
};
