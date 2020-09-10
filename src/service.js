const fs = require('fs'),
    winston = require('winston'),
    metaDataDownloader = require('./metaDataDownloader.js'),
    buildChannelManager = require('./channel.js').buildChannelManager,
    buildShowManager = require('./shows.js').buildShowManager;

const DATA_FILE = 'data.json';

const channelManager = buildChannelManager(),
    showManager = buildShowManager();

module.exports.service = {
    init() {
        "use strict";
        return fs.promises.readFile(DATA_FILE)
            .then(data => {
                const json = JSON.parse(data),
                    showList = json.shows,
                    channelList = json.channels;
                winston.log('info', `Read ${showList.length} shows and ${channelList.length} channels from ${DATA_FILE}`);

                showList.forEach(showManager.addShow);

                const playlists = showManager.getShows().flatMap(show => show.playlists);

                return Promise.all(playlists.map(metaDataDownloader.download))
                    .then(metaDataForPlaylists => {
                        metaDataForPlaylists.forEach(metaData => {
                            const playlistId = metaData.id,
                                show = showManager.getShowForPlaylist(playlistId);
                            metaData.files.forEach(file => {
                                show.files.push({
                                    urlPrefixes: metaData.urlPrefixes,
                                    file: file.file,
                                    name: file.name,
                                    length: file.length
                                });
                            });
                            if (!show.title) {
                                show.title = metaData.title;
                            }
                        });

                        channelList.forEach(channel => {
                            const showsForChannel = channel.shows.map(id => showManager.getShowByIndex(id));
                            channelManager.addChannel(channel.name, showsForChannel);
                        });
                    });
            });
    },
    getChannels() {
        "use strict";
        return channelManager.getChannels();
    },
    getShows() {
        "use strict";
        return showManager.getShowNamesAndIndexes();
    },
    getPlaylistId(indexes) {
        "use strict";
        return showManager.buildCodeFromIndexes(indexes);
    },
    getListForChannel(channelId, trimToNearestBoundary){
        "use strict";
        return channelManager.getPlaylist(channelId, trimToNearestBoundary);
    }
};
