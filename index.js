const express = require('express'),
    axios = require('axios'),
    app = express(),
    port = 3000;

app.use(express.static('public'))

const playlist = [];

function getMetadataForItem(itemId, callback) {
    "use strict";
    axios.get(`https://archive.org/metadata/${itemId}`).then(rsp => {
        const data = rsp.data,
            servers = data['workable_servers'],
            dir = data.dir;

        callback(data.files.map(f => {
            return {
                urls : servers.map(server => `https://${server}${dir}/${f.name}`),
                length: Number(f.length),
                size: Number(f.size)
            };
        }));
    }).catch(err => {
        console.error(err)
    });
}

getMetadataForItem('Dragnet_OTR', files => {
    "use strict";
    playlist.push(...files);
});

app.get(`/api/playlist`, (req, res) => {
    try {
        res.status(200).json(playlist)
    } catch (error) {
        res.status(500).json({error : error.message});
    }
});

app.listen(port, () => console.log(`HomeData listening on port ${port}!`))