"use strict";
const config = require('../config.json'),
    clock = require('./clock.js'),
    log = require('./log.js'),
    fs = require('fs'),
    path = require('path'),
    util = require('util'),
    JSON_EXT = '.json',
    ENCODING = 'utf-8',
    MILLISECONDS_PER_SECOND = 1000,
    expiryIntervalSeconds = config.webCache.expiryIntervalSeconds,
    location = config.webCache.location;

const store = {};

module.exports = {
    loadFromDisk() {
        fs.readdir(location, (err, files) => {
            if (err) {
                log.error(`Failed to load cache from ${location} - error was ${err}`);
            } else {
                files.filter(file => path.extname(file) === JSON_EXT).forEach(file => {
                    log.debug(`Loaded file ${file} from cache ${location}`);
                    const fileAndPath = path.join(location, file),
                        id = path.basename(file, JSON_EXT),
                        ts = fs.statSync(fileAndPath).mtimeMs / MILLISECONDS_PER_SECOND,
                        dataString = fs.readFileSync(fileAndPath),
                        data = JSON.parse(dataString);

                    store[id] = {ts, data};
                });
            }
        });
    },

    get(id) {
        const cacheEntry = store[id];
        if (cacheEntry) {
            const {ts, data} = cacheEntry;
            if (clock.now() - ts < expiryIntervalSeconds) {
                return data;
            } else {
                log.debug(`Cache item ${id} has expired`);
                delete store[id];
            }
        }
    },

    put(id, data) {
        store[id] = {ts: clock.now(), data};
        const fileName = `${id}.json`;
        fs.writeFile(path.join(location, fileName), data, ENCODING, err => {
            if (err) {
                log.error(`Failed to write file ${fileName} to cache dir ${location} - error was ${err}`);
            } else {
                log.debug(`Wrote file ${fileName} to cache dir ${location}`);
            }
        });
    }
}