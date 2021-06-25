"use strict";
const config = require('../config.json'),
    memoize = require('./cache.js').memoize;

function getChannelNamesForShowIndex(showIndex) {
    return config.channels.filter(channel => channel.shows.includes(showIndex)).map(channel => channel.name);
}

module.exports = {
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
                channels: getChannelNamesForShowIndex(show.index),
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