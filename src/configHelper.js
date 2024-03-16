const config = require('../config.json'),
    memoize = require('./cache.js').memoize;

const configHelper = {
    getShowForPlaylistId(playlistId) {
        return config.shows.find(show => show.playlists.includes(playlistId));
    },
    getAllPlaylistIds() {
        return config.shows.flatMap(show => show.playlists)
    },
    getChannelNamesForShowIndex(showIndex) {
        return config.channels.filter(channel => channel.shows.includes(showIndex)).map(channel => channel.name);
    },
    /*
        [
            {
                "channels" : ["future"],
                "index": 3,
                "isCommercial": false,
                "name": "Space Patrol",
                "playlists": ["OTRR_Space_Patrol_Singles"]
            }, {
                ...
            }
        ]
     */
    getShows: memoize(() => {
        return config.shows.map(show => {
            return {
                channels: configHelper.getChannelNamesForShowIndex(show.index),
                index: show.index,
                isCommercial: !! show.isCommercial,
                name: show.name,
                shortName: show.shortName || show.name,
                playlists: show.playlists
            };
        });
    }, "shows"),

    /*
        ["future", "action", ... ]
     */
    getChannels: memoize(() => {
        return config.channels.map(channel => channel.name);
    }, "channels")
};

module.exports = {configHelper};