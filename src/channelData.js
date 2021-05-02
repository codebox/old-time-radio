const config = require('../config.json');

function getChannelNamesForShowIndex(showIndex) {
    "use strict";
    return config.channels.filter(channel => channel.shows.includes(showIndex)).map(channel => channel.name);
}

module.exports = {
    getShows() { //TODO memoize
        "use strict";
        return config.shows.map(show => {
            return {
                channels: getChannelNamesForShowIndex(show.index),
                index: show.index,
                isCommercial: !! show.isCommercial,
                name: show.name
            };
        });
    },
    getChannels() { //TODO memoize
        "use strict";
        return config.channels.map(channel => channel.name);
    }
};