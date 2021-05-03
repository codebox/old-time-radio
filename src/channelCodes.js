"use strict";
const channelData = require('./channelData.js'),
    shows = channelData.getShows(),
    SHOWS_PER_CHAR = 6,
    CHAR_MAP = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_';

function numToString(n) {
    console.assert(n<64);
    return CHAR_MAP.charAt(n);
}

function stringToNum(s) {
    "use strict";
    console.assert(s.length === 1);
    const n = CHAR_MAP.indexOf(s);
    console.assert(n >= 0);
    return n;
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
    },

    buildShowIndexesFromChannelCode(channelCode) {
        const indexes = [];
        channelCode.split('').forEach((c, charIndex) => {
            const num = stringToNum(c);
            indexes.push(...[num & 1, num & 2, num & 4, num & 8, num & 16, num & 32].map((n,i) => n ? i + charIndex * SHOWS_PER_CHAR : null).filter(n => n !== null));
        });
        return indexes;
    }
}