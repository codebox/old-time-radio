const winston = require('winston'),
    config = require('../config.json');

const transports = [];
try {
    transports.push(new (winston.transports.File)({
        level: config.log.level,
        filename: config.log.file,
        format: winston.format.simple()
    }))
} catch (e) {
    transports.push(new (winston.transports.Console)({
        level: config.log.level,
        format: winston.format.simple()
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