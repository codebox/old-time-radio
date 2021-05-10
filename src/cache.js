"use strict";
const config = require('../config.json'),
    clock = require('./clock.js'),
    log = require('./log.js'),
    fs = require('fs'),
    path = require('path'),
    readdir = require("fs").promises.readdir,
    JSON_EXT = '.json',
    ENCODING = 'utf-8',
    MILLISECONDS_PER_SECOND = 1000,
    expiryIntervalSeconds = config.webCache.expiryIntervalSeconds,
    location = config.webCache.location;

const store = {};

module.exports = {
    loadFromDisk() {
        return readdir(location).then(files => {
            files.filter(file => path.extname(file) === JSON_EXT).forEach(file => {
                const fileAndPath = path.join(location, file),
                    id = path.basename(file, JSON_EXT),
                    ts = fs.statSync(fileAndPath).mtimeMs / MILLISECONDS_PER_SECOND,
                    dataString = fs.readFileSync(fileAndPath),
                    data = JSON.parse(dataString);

                store[id] = {ts, data};
            });
        }).catch(err => {
            log.error(`Failed to load cache from ${location} - error was ${err}`);
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
        fs.writeFile(path.join(location, fileName), JSON.stringify(data, null, 4), ENCODING, err => {
            if (err) {
                log.error(`Failed to write file ${fileName} to cache dir ${location} - error was ${err}`);
            } else {
                log.debug(`Wrote file ${fileName} to cache dir ${location}`);
            }
        });
    }
}