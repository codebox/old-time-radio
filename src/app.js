const express = require('express'),
    service = require('./service.js').service,
    winston = require('winston'),
    app = express(),
    port = 3000;

const transports = [];
try{
    transports.push(new (winston.transports.File)({ filename: '/var/log/oldtimeradio/access.log', json : false }))
} catch (e) {
    transports.push(new (winston.transports.Console)({json : false }))
}

winston.configure({
    transports
});

app.use(express.static('public'))

app.get(`/api/shows`, (req, res) => {
    "use strict";
    res.status(200).json(service.getShows());
});

app.get(`/api/channels`, (req, res) => {
    "use strict";
    res.status(200).json(service.getChannels());
});

app.get(`/api/playlist/:channel`, (req, res) => {
    const channelId = req.params.channel,
        trimToNearestBoundary = req.query.nearest !== undefined,
        channel = service.getListForChannel(channelId, trimToNearestBoundary);

    if (channel) {
        res.status(200).json(channel);
    } else {
        res.status(400).send('Unknown channel');
    }
});

app.get(`/api/playlist/generate/:indexes`, (req, res) => {
    const indexes = req.params.indexes.split(',');

    res.status(200).json(service.getPlaylistId(indexes));
});

service.init()
    .then(_ => {
        app.listen(port, () => winston.log('info', `Initialisation complete, listening on port ${port}...`));
    })
    .catch(err => {
        // winston.log('error', 'Failed to start application - ' + err)
        throw err
    });


