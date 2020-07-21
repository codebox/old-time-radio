const fs = require('fs'),
    metaDataDownloader = require('./metaDataDownloader.js'),
    buildChannelManager = require('./channel.js').buildChannelManager;

const DATA_FILE = 'data.json';

let channelManager = buildChannelManager();

module.exports.audioList = {
    init() {
        "use strict";
        return fs.promises.readFile(DATA_FILE)
            .then(data => {
                const json = JSON.parse(data),
                    showList = json.shows;
                console.log(`Read ${showList.length} shows from ${DATA_FILE}`);
                const shows = {},
                    tags = {};

                showList.forEach(show => {
                    shows[show.id] = {
                        id: show.id
                    };
                    show.tags.forEach(tag => {
                        if (!(tag in tags)) {
                            tags[tag] = [];
                        }
                        tags[tag].push(show.id);
                    });
                });

                return Promise.all(Object.keys(shows).map(metaDataDownloader.download))
                    .then(metaDataForShows => {
                        metaDataForShows.forEach(metaData => {
                            const {id} = metaData;
                            shows[id].urlPrefixes = metaData.urlPrefixes;
                            shows[id].files = metaData.files;
                            shows[id].title = metaData.title;
                        });

                        Object.keys(tags).forEach(tag => {
                            const channelName = tag;
                            channelManager.addChannel(channelName, tags[tag].flatMap(showId => shows[showId]));
                        });
                    });
            });
    },
    getChannels() {
        "use strict";
        return channelManager.getChannels();
    },
    getListForChannel(channelId, trimToNearestBoundary){
        "use strict";
        return channelManager.getPlaylist(channelId, trimToNearestBoundary);
    }
};
