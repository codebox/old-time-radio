const channelData = require('./channelData.js'),
    shows = channelData.getShows(),
    SHOWS_PER_CHAR = 6,
    CHAR_MAP = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_';

function numToString(n) {
    "use strict";
    console.assert(n<64);
    return CHAR_MAP.charAt(n);
}

module.exports = {
    buildChannelCodeFromShowIndexes(indexes) {
        const uniqueNumericIndexes = new Set(indexes.map(Number));

        const groupTotals = new Array(Math.ceil(shows.length / SHOWS_PER_CHAR)).fill(0);
        for (let i=0; i<shows.length; i++) {
            const groupIndex = Math.floor(i / SHOWS_PER_CHAR);
            if (uniqueNumericIndexes.has(i)) {
                groupTotals[groupIndex] += Math.pow(2, i - groupIndex * SHOWS_PER_CHAR);
            }
        }
        return groupTotals.map(numToString).join('');
    }
}