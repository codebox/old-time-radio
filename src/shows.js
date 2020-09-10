module.exports.buildShowManager = () => {
    "use strict";
    const QUARTET_SIZE = 4, shows = [];

    return {
        addShow(showObj) {
            const show = {...showObj};
            show.files = [];
            shows.push(show);
        },
        getShows() {
            return shows;
        },
        getShowForPlaylist(playlistId) {
            return shows.find(show => show.playlists.includes(playlistId));
        },
        getShowByIndex(index) {
            return shows.find(show => show.index === index);
        },
        buildCodeFromIndexes(indexes) {
            const uniqueNumericIndexes = new Set(indexes.map(Number));

            const quartetTotals = new Array(Math.ceil(shows.length / QUARTET_SIZE)).fill(0);
            for (let i=0; i<shows.length; i++) {
                const quartetIndex = Math.floor(i / QUARTET_SIZE);
                if (uniqueNumericIndexes.has(i)) {
                    quartetTotals[quartetIndex] += Math.pow(2, i - quartetIndex * QUARTET_SIZE);
                }
            }
            return quartetTotals.map(t => Number(t).toString(16).toUpperCase()).join('');
        },
        parseCodeToIndexes(code) {
            const indexes = [];
            code.split('').forEach((c, charIndex) => {
                const num = Number.parseInt(c, Math.pow(2, QUARTET_SIZE));
                indexes.push(...[num & 1, num & 2, num & 4, num & 8].map((n,i) => n ? i + 1 + charIndex * QUARTET_SIZE : 0).filter(n=>n));
            });
            return indexes;
        }
    };
};
