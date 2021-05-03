"use strict";
const axios = require('axios'),
    log = require('./log.js'),
    cache = require('./cache.js');

module.exports = {
    get(url) {
        return cache.get(url).catch(_ => {
            log.debug(`Requesting ${url}...`)
            return axios.get(url).then(response => {
                const data = response.data;
                cache.put(url, data);
                return data;
            });
        });
    }
};
