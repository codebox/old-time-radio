const express = require('express'),
    audioList = require('./audioList.js').audioList,
    winston = require('winston'),
    app = express(),
    port = 3000;

winston.configure({
    transports: [
        // new (winston.transports.Console)({json : false }),
        new (winston.transports.File)({ filename: '/var/log/oldtimeradio/access.log', json : false })
    ]
});

app.use(express.static('public'))

app.get(`/api/channels`, (req, res) => {
    "use strict";
    res.status(200).json(audioList.getChannels());
});

app.get(`/api/playlist/:channel`, (req, res) => {
    try {
        const channelId = req.params.channel,
            trimToNearestBoundary = req.query.nearest !== undefined,
            channel = audioList.getListForChannel(channelId, trimToNearestBoundary);

        if (channel) {
            res.status(200).json(channel);
        } else {
            res.status(400).send('Unknown channel');
        }

    } catch (error) {
        res.status(500).json({error : error.message});
    }
});

audioList.init()
    .then(_ => {
        app.listen(port, () => winston.log('info', `Initialisation complete, listening on port ${port}...`));
    })
    .catch(err => {
        winston.log('error', 'Failed to start application', err)
    });


