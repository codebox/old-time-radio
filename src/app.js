"use strict";

const config = require('../config.json'),
    log = require('./log.js'),
    service = require('./service.js'),
    { checkConfig } = require('./configChecker.js'),
    express = require('express'),
    app = express();

checkConfig(config);

const port = config.web.port;

app.use((req, res, next) => {
    log.debug(`Request: ${req.method} ${req.path}`);
    next();
});

app.use(express.static(config.web.paths.static));

app.use('/listen-to', express.static(config.web.paths.static));

app.get("/listen-to/:show", (req, res) => {
    res.sendFile('public/index.html',{root:'./'});
});

// [{channels:["future"], index: 1, isCommercial: false, name: "X Minus One"}, ...]
app.get(config.web.paths.api.shows, (req, res) => {
    service.getShows().then(shows => {
        res.status(200).json(shows);
    });
});

// ["future", "action", ...]
app.get(config.web.paths.api.channels, (req, res) => {
    service.getChannels().then(channels => {
        res.status(200).json(channels);
    });
});

// {initialOffset: 123.456, list: [{archivalUrl: "http://...", length: 1234.56, name: "X Minus One - Episode 079", url: "http://...", commercial: false}, ...]}
app.get(config.web.paths.api.channel + ':channel', (req, res) => {
    const channelId = req.params.channel,
        length = req.query.length;
    service.getScheduleForChannel(channelId, length).then(schedule => {
        if (schedule) {
            res.status(200).json(schedule);
        } else {
            res.status(400).send('Unknown channel');
        }
    });
});

// "1g0000g000000"
app.get(config.web.paths.api.generate + ":indexes", (req, res) => {
    const indexes = req.params.indexes.split(',').map(s => Number(s));
    res.status(200).json(service.getCodeForShowIndexes(indexes));
});

// [{channelId: 'action', initialOffset: 123.456, list: [{archivalUrl: "http://...", length: 1234.56, name: "X Minus One - Episode 079", url: "http://...", commercial: false}, ...]}, ...]
app.get(config.web.paths.api.playingNow, (req, res) => {
    const channels = (req.query.channels || '').split(',').filter(c => c);
    service.getPlayingNowAndNext(channels).then(result => res.status(200).json(result));
});

app.get("/sitemap.xml", (req, res) => {
    service.getSitemapXml().then(xml => {
        res.set('Content-Type', 'text/xml');
        res.send(xml);
    });
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

