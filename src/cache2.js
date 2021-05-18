"use strict";
const config = require('../config.json'),
    clock = require('./clock.js'),
    log = require('./log.js'),
    fs = require('fs').promises,
    path = require('path'),
    ENCODING = 'utf-8',
    MILLISECONDS_PER_SECOND = 1000;

module.exports = {
    buildCache(name, expiryIntervalSeconds, source) {
        function hasTsExpired(ts) {
            return clock.now() - ts > expiryIntervalSeconds;
        }

        const memory = (() => {
            const data = {};

            return {
                get(id) {
                    const entry = data[id];
                    if (entry) {
                        if (hasTsExpired(entry.ts)) {
                            delete data[id];
                            return Promise.reject();
                        }
                        return Promise.resolve(entry.value);
                    }
                    return Promise.reject();
                },
                put(id, value) {
                    const ts = clock.now();
                    data[id] = {ts, value};
                    return Promise.resolve(value);
                }
            }
        })();

        const disk = (() => {
            const cacheDir = path.join(config.webCache.location, name);

            function getCacheFilePath(id) {
                return path.join(cacheDir, `${id}.json`);
            }

            return {
                get(id) {
                    const filePath = getCacheFilePath(id);

                    return fs.stat(filePath)
                        .then(stat => {
                            const modificationTime = stat.mtimeMs / MILLISECONDS_PER_SECOND;
                            if (hasTsExpired(modificationTime)) {
                                return fs.unlink(filePath)
                                    .then(() => Promise.reject());
                            }
                        })
                        .then(buffer => JSON.parse(buffer.toString()));
                },
                put(id, value) {
                    const filePath = getCacheFilePath(id),
                        valueAsJson = JSON.stringify(value, null, 4);

                    return fs.writeFile(filePath, valueAsJson, {encoding: ENCODING}).then(() => value);
                }
            };
        })();

        return {
            get(id) {
                return memory.get(id)
                    .catch(() => disk.get(id)
                        .then(value => memory.put(id, value)))
                    .catch(() => source.get(id)
                        .then(value => disk.put(id, value))
                        .then(value => memory.put(id, value)));
            },
            preLoad(...ids) {
                return Promise.all(ids.map(this.get));
            }
        }
    },

}