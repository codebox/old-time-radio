"use strict";

const config = require('../config.json'),
    log = require('./log.js'),
    service = require('./service.js'),
    express = require('express'),
    app = express();

const port = config.web.port;

app.use((req, res, next) => {
    log.debug(`Request: ${req.method} ${req.path}`);
    next();
});

app.use(express.static(config.web.paths.static));

// [{channels:["future"], index: 1, isCommercial: false, name: "X Minus One"}, ...]
app.get(config.web.paths.api.shows, (req, res) => {
    res.status(200).json(service.getShows());
});

// ["future", "action", ...]
app.get(config.web.paths.api.channels, (req, res) => {
    res.status(200).json(service.getChannels());
});

// {initialOffset: 123.456, list: [{archivalUrl: "http://...", length: 1234.56, name: "X Minus One - Episode 079", url: "http://...", commercial: false}, ...]}
app.get(config.web.paths.api.channel + ':channel', (req, res) => {
    const channelId = req.params.channel,
        length = req.query.length,
        schedule = service.getScheduleForChannel(channelId, length);

    if (schedule) {
        res.status(200).json(schedule);
    } else {
        res.status(400).send('Unknown channel');
    }
});

// "1g0000g000000"
app.get(config.web.paths.api.generate + ":indexes", (req, res) => {
    const indexes = req.params.indexes.split(',').map(s => Number(s));
    res.status(200).json(service.getCodeForShowIndexes(indexes));
});

app.use((error, req, res, next) => {
    log.error(error.stack);
    res.status(500).json({'error':''})
});

service.init().then(() => {
    app.listen(port, () => {
        log.info(`Initialisation complete, listening on port ${port}...`);
    });
});

