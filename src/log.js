"use strict";
const winston = require('winston'),
    config = require('../config.json');

const transports = [],
    format = winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(info => {
            return `${info.timestamp} ${info.level.toUpperCase().padStart(5, ' ')}: ${info.message}`;
        })
    );
try {
    transports.push(new (winston.transports.File)({
        level: config.log.level,
        filename: config.log.file,
        format
    }))
} catch (e) {
    transports.push(new (winston.transports.Console)({
        level: config.log.level,
        format
    }))
}

winston.configure({
    transports
});

module.exports = {
    debug(...params) {
        winston.log('debug', ...params);
    },
    info(...params) {
        winston.log('info', ...params);
    },
    warn(...params) {
        winston.log('warning', ...params);
    },
    error(...params) {
        winston.log('error', ...params);
    }
};