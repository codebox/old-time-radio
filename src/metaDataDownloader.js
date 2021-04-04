const axios = require('axios'),
    winston = require('winston'),
    extractName = require('./nameParser').parseName,
    fs = require("fs");

function processResponse(itemId, data) {
    "use strict";
    const title = data.metadata.title || itemId;

    const files = data.files.filter(f => f.name.toLowerCase().endsWith('.mp3')).filter(f => f.length).map(f => {
        if (f.length.match(/^[0-9]+:[0-9]+$/)) {
            const [min, sec] = f.length.split(':')
            f.length = Number(min) * 60 + Number(sec);
        }
        const name = extractName(itemId, f);

        return {
            file : f.name,
            name,
            itemId,
            length: Number(f.length)
        };
    });

    return {
        id: itemId,
        title,
        files
    }
}

module.exports = {
    download(itemId) {
        "use strict";
        const ENCODING = 'utf8',
            cachedFileName = `cache/${itemId}.json`,
            downloadUrl = `https://archive.org/metadata/${itemId}`;

        return fs.promises.readFile(cachedFileName, {encoding: ENCODING})
            .then(json => {
                winston.log('info', `Reading metadata from cache for ${itemId}`);
                return processResponse(itemId, JSON.parse(json));
            }, _ => {
                winston.log('info', `Downloading metadata for ${itemId}`);
                return axios.get(downloadUrl).then(response => {
                    if (!response.data.files) {
                        // archive.org returns 200 even if it doesn't recognise the id
                        return Promise.reject(`No file list returned for id '${itemId}'`);
                    }
                    return fs.promises.writeFile(cachedFileName, JSON.stringify(response.data, null, 4), {encoding: ENCODING})
                        .then(() => processResponse(itemId, response.data));
                });
            });
    }
}