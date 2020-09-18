const fs = require('fs'),
    winston = require('winston'),
    metaDataDownloader = require('./metaDataDownloader.js'),
    buildChannelManager = require('./channelManager.js').buildChannelManager,
    buildShowManager = require('./showManager.js').buildShowManager,
    buildPlaylistManager = require('./playlistManager.js').buildPlaylistManager,
    buildScheduleBuilder = require('./scheduleBuilder.js').buildScheduleBuilder;

const DATA_FILE = 'data.json';

const
    playlistManager = buildPlaylistManager(),
    showManager = buildShowManager(),
    channelManager = buildChannelManager(showManager, playlistManager),
    scheduleBuilder = buildScheduleBuilder();

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
                channelList.forEach(channelManager.addPredefinedChannel);

                const playlists = showManager.getShows().flatMap(show => show.playlists);

                return Promise.all(playlists.map(metaDataDownloader.download))
                    .then(metaDataForPlaylists => {
                        metaDataForPlaylists.forEach(playlistManager.addPlaylist);
                    });
            });
    },
    getShows() {
        "use strict";
        return showManager.getShows();
    },
    getPredefinedChannels() {
        "use strict";
        return channelManager.getPredefinedChannels();
    },
    getScheduleForChannel(channelId) {
        "use strict";
        const episodeListForChannel = channelManager.getEpisodeList(channelId, true);
        if (episodeListForChannel) {
            return scheduleBuilder.buildScheduleForEpisodeList(episodeListForChannel);
        }
    },
    generateCodeForShowIndexes(showIndexes) {
        "use strict";
        return channelManager.generateCodeForShowIndexes(showIndexes);
    }
};
