"use strict";
const config = require('../config.json'),
    clock = require('./clock.js'),
    log = require('./log.js'),
    fs = require('fs').promises,
    path = require('path'),
    ENCODING = 'utf-8',
    MILLISECONDS_PER_SECOND = 1000;

module.exports = {
    testSource() {
        return {
            get(id) {
                return Promise.resolve("hello " + id);
            }
        };
    },
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
                            log.debug(`Cache MISS (memory) - item [${id}] has expired`);
                            delete data[id];
                            return Promise.reject();
                        }
                        log.debug(`Cache HIT (memory) - item [${id}] found`);
                        return Promise.resolve(entry.value);
                    }
                    log.debug(`Cache MISS (memory) - item [${id}] does not exist`);
                    return Promise.reject();
                },
                put(id, value) {
                    const ts = clock.now();
                    data[id] = {ts, value};
                    log.debug(`Cache WRITE (memory) - item [${id}] stored`);
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
                                log.debug(`Cache MISS (disk) - item [${id}] has expired`);
                                return fs.unlink(filePath)
                                    .then(() => Promise.reject());
                            }
                        })
                        .catch(() => {
                            log.debug(`Cache MISS (disk) - item [${id}] does not exist`);
                            return Promise.reject();
                        })
                        .then(buffer => {
                            log.debug(`Cache HIT (disk) - item [${id}] found`);
                            return JSON.parse(buffer.toString())
                        });
                },
                put(id, value) {
                    const filePath = getCacheFilePath(id),
                        valueAsJson = JSON.stringify(value, null, 4);

                    return fs.writeFile(filePath, valueAsJson, {encoding: ENCODING}).then(() => {
                        log.debug(`Cache WRITE (disk) - item [${id}] stored`);
                        return value;
                    });
                }
            };
        })();

        return {
            get(id) {
                return memory.get(id)
                    .catch(() => disk.get(id)
                        .then(value => memory.put(id, value))
                        .catch(() => source.get(id)
                            .then(value => disk.put(id, value))
                            .then(value => memory.put(id, value))));
            },
            preLoad(...ids) {
                return Promise.all(ids.map(this.get));
            }
        }
    },

}