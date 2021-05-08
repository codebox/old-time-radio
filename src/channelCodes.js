"use strict";
const TOO_BIG_INDEX = 200,
    SHOWS_PER_CHAR = 6,
    CHAR_MAP = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_';

function numToString(n) {
    console.assert(n<64, n);
    return CHAR_MAP.charAt(n);
}

function stringToNum(s) {
    "use strict";
    console.assert(s.length === 1, s);
    const n = CHAR_MAP.indexOf(s);
    if (n < 0) {
        throw new Error(`Invalid character in channel code: '${s}'`);
    }
    return n;
}

module.exports = {
    buildChannelCodeFromShowIndexes(indexes) {
        const numericIndexes = indexes.map(Number).filter(n=>!isNaN(n)),
            uniqueNumericIndexes = new Set(numericIndexes);

        const maxIndex = numericIndexes.length ? Math.max(...numericIndexes) : 0;
        if (maxIndex > TOO_BIG_INDEX) {
            throw new Error('Index is too large: ' + maxIndex);
        }
        const groupTotals = new Array(Math.ceil((maxIndex+1) / SHOWS_PER_CHAR)).fill(0);

        for (let i=0; i <= maxIndex; i++) {
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