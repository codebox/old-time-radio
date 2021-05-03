"use strict";
const config = require('../config.json'),
    clock = require('./clock.js'),
    log = require('./log.js'),
    fs = require('fs'),
    util = require('util'),
    ENCODING = 'utf-8',
    MILLISECONDS_PER_SECOND = 1000,
    expiryIntervalSeconds = config.webCache.expiryIntervalSeconds,
    location = config.webCache.location;

const
    diskCache = (() => {
        const readFile = util.promisify(fs.readFile),
            writeFile = util.promisify(fs.writeFile),
            statFile = util.promisify(fs.stat),
            rmFile = util.promisify(fs.unlink);

        function getPathForId(id) {
            return `${location}/${id}.json`;
        }

        return {
            get(id) {
                const path = getPathForId(id);
                return statFile(path).then(stats => {
                    const modificationTimeSeconds = stats.mtimeMs / MILLISECONDS_PER_SECOND;

                    return readFile(path, ENCODING).then(data => {
                        return {ts: modificationTimeSeconds, data};
                    })
                });
            },
            put(id, data) {
                return writeFile(getPathForId(id), data);
            },
            delete(id) {
                return rmFile(getPathForId(id));
            }
        };
    })(),

    inMemoryCache = (() => {
        const cache = {};

        return {
            get(id) {
                const cacheEntry = cache[id];
                if (cacheEntry) {
                    return Promise.resolve(cacheEntry);
                }
                return Promise.reject(id);
            },
            put(id, data) {
                return Promise.resolve(cache[id] = {ts: clock.now(), data});
            },
            delete(id) {
                delete cache[id];
                return Promise.resolve();
            }
        };
    })();

module.exports = {
    get(id) {
        return inMemoryCache.get(id)
            .then(entry => {
                if (entry.age < expiryIntervalSeconds) {
                    log.debug(`In-memory cache HIT for ${id}`);
                    return entry.data;
                }
            })
            .catch(_ => {
                return diskCache.get(id);
            });
    }
}