const express = require('express'),
    audioList = require('./audioList.js').audioList,
    app = express(),
    port = 3000;

app.use(express.static('public'))

app.get(`/api/channels`, (req, res) => {
    "use strict";
    res.status(200).json(audioList.getChannels());
});

app.get(`/api/playlist/:channel`, (req, res) => {
    try {
        const channelId = req.params.channel,
            trimToNearestBoundary = !! req.query.nearest,
            channel = audioList.getListForChannel(channelId, trimToNearestBoundary);

        if (channel) {
            res.status(200).json(channel);
        } else {
            res.status(400).send('Unknown channel');
        }

    } catch (error) {
        console.error(error)
        res.status(500).json({error : error.message});
    }
});

audioList.init()
    .then(_ => {
        app.listen(port, () => console.log(`Initialisation complete, listening on port ${port}...`));
    })
    .catch(err => {
        console.error('Failed to start application', err)
    });


