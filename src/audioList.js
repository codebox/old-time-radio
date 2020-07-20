const fs = require('fs'),
    metaDataDownloader = require('./metaDataDownloader.js');

const DATA_FILE = 'data.json';
const playlistsByChannel = {};

function buildPlaylistUsing(channelName, shows) {
    "use strict";
    const episodeCount = shows.flatMap(show => show.files).length,
        remainingForEachShow = {};

    shows.forEach(show => {
        remainingForEachShow[show.id] = {
            startCount: show.files.length,
            remaining: show.files.length
        };
    });
    console.log(`Build '${channelName}' channel with ${episodeCount} episodes`);

    const episodeList = [], currentPlayLength = 0;
    for (let i=0; i<episodeCount; i++) {
        const nextShowId = Object.entries(remainingForEachShow).map(kv => {
            return {
                showId: kv[0],
                remainingFraction: (kv[1].remaining - 1) / kv[1].startCount
            };
        }).sort((o1, o2) => o2.remainingFraction - o1.remainingFraction)[0].showId;

        const remainingForNextShow = remainingForEachShow[nextShowId],
            nextEpisode = {
                file: shows.find(s => s.id === nextShowId).files[remainingForNextShow.startCount - remainingForNextShow.remaining]
            };
        remainingForNextShow.remaining--;
        episodeList.push(nextEpisode);
    }
    console.log(remainingForEachShow)

    return {
        title: channelName

    };
}

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
                            playlistsByChannel[tag] = buildPlaylistUsing(channelName, tags[tag].flatMap(showId => shows[showId]));
                        });
                    });
            });
    },
    getListForChannel(channel){
        "use strict";
        return playlistsByChannel[channel];
    }
};
