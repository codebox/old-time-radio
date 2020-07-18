const express = require('express'),
    audioList = require('./audioList.js').audioList,
    app = express(),
    port = 3000;

audioList.init().then(_ => audioList.getShows()).then(_=> console.log('init complete'))

app.use(express.static('public'))

app.get(`/api/playlist`, (req, res) => {
    try {
        res.status(200).json(playlist)
    } catch (error) {
        res.status(500).json({error : error.message});
    }
});

app.listen(port, () => console.log(`Listening on port ${port}!`))