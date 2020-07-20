const axios = require('axios'),
    fs = require("fs");

function processResponse(itemId, data) {
    "use strict";
    const servers = data['workable_servers'],
        title = data.metadata.title || itemId,
        dir = data.dir;

    const files = data.files.filter(f => f.name.toLowerCase().endsWith('.mp3')).map(f => {
        return {
            file : f.name,
            length: Number(f.length),
            size: Number(f.size)
        };
    });

    return {
        id: itemId,
        title,
        urlPrefixes: servers.map(server => `https://${server}${dir}/`),
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
                console.log(`reading metadata from cache for ${itemId}`);
                return processResponse(itemId, JSON.parse(json));
            }, _ => {
                console.log(`downloading metadata for ${itemId}`);
                return axios.get(downloadUrl).then(response => {
                    if (!response.data.files) {
                        // archive.org returns 200 even if it doesn't recognise the id
                        return Promise.reject(`No file list returned for id '${itemId}'`);
                    }
                    return fs.promises.writeFile(cachedFileName, JSON.stringify(response.data, 4), {encoding: ENCODING})
                        .then(() => processResponse(itemId, response.data));
                });
            });
    }
}