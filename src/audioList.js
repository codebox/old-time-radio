const fs = require('fs'),
    winston = require('winston'),
    metaDataDownloader = require('./metaDataDownloader.js'),
    buildChannelManager = require('./channel.js').buildChannelManager,
    buildShowManager = require('./shows.js').buildShowManager;

const DATA_FILE = 'data.json';

const channelManager = buildChannelManager(),
    showManager = buildShowManager();

module.exports.audioList = {
    init() {
        "use strict";
        return fs.promises.readFile(DATA_FILE)
            .then(data => {
                const json = JSON.parse(data),
                    showList = json.shows;
                winston.log('info', `Read ${showList.length} shows from ${DATA_FILE}`);
                const shows = {},
                    tags = {};

                showList.forEach(show => {
                    showManager.addShow(show.name, show.index);
                    show.items.forEach(id => {
                        shows[id] = {
                            id
                        };
                        show.tags.forEach(tag => {
                            if (!(tag in tags)) {
                                tags[tag] = [];
                            }
                            tags[tag].push(id);
                        });
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
                        channelManager.mergeAdverts();
                    });
            });
    },
    getChannels() {
        "use strict";
        return channelManager.getChannels();
    },
    getShows() {
        "use strict";
        return showManager.getShows();
    },
    getListForChannel(channelId, trimToNearestBoundary){
        "use strict";
        return channelManager.getPlaylist(channelId, trimToNearestBoundary);
    }
};
