"use strict";
const axios = require('axios'),
    log = require('./log.js'),
    cacheBuilder = require('./cache.js'),
    config = require("../config.json"),
    clock = require("./clock");

const requestQueue = (() => {
    const pendingRequests = [];
    let lastRequestMillis = 0, running = false, interval;

    function ensureRequestProcessorIsRunning(){
        if (!running) {
            log.debug('Starting request processor');
            running = true;

            function processNext() {
                const nextRequestPermittedTs = lastRequestMillis + config.minRequestIntervalMillis,
                    timeUntilNextRequestPermitted = Math.max(0, nextRequestPermittedTs - clock.nowMillis());
                setTimeout(() => {
                    const {url, resolve, reject} = pendingRequests.shift();
                    log.debug(`Requesting ${url}...`);
                    axios.get(url)
                        .then(response => {
                            log.debug(`Request for ${url} succeeded: ${response.status} - ${response.statusText}`);
                            resolve(response.data)
                        })
                        .catch(response => {
                            log.error(`Request for ${url} failed: ${response.status} - ${response.statusText}`);
                            reject(response);
                        })
                        .finally(() => {
                            lastRequestMillis = clock.nowMillis();
                            if (pendingRequests.length === 0) {
                                log.debug('Request queue is empty, shutting down processor');
                                running = false;
                            } else {
                                processNext();
                            }
                        });
                }, timeUntilNextRequestPermitted);
            }

            processNext();
        }
    }

    return {
        push(url) {
            return new Promise((resolve, reject) => {
                pendingRequests.push({url, resolve, reject});
                ensureRequestProcessorIsRunning();
            });
        }
    };
})();

const cache = cacheBuilder.buildCache('web', url => {
    log.info(`Queueing request for ${url}`);
    return requestQueue.push(url);
});

module.exports = {
    get(url) {
        return cache.get(url);
    }
};
