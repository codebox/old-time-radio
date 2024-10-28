"use strict";

const archiveOrg = require('./archiveOrg.js'),
    log = require('./log.js'),
    {buildNameParser} = require('./nameParser.js'),
    {configHelper} = require('./configHelper.js'),
    LOG_ID = 'playlistData';

const playlistsById = {},
    skippedShows = new Set();

function isPartOfSkipListForShow(fileName, playlistId){
    return (configHelper.getShowForPlaylistId(playlistId).skip || []).some(skipPattern => fileName.includes(skipPattern));
}
/*
    Shows have one or more 'playlists' associated with them (see config file) - each playlist comprises a list episodes
    including mp3 file urls.
*/
function extractUsefulPlaylistData(playlistId, playlist, nameParser) {
    return playlist.files
        .filter(f => f.name.toLowerCase().endsWith('.mp3'))
        .filter(f => {
            const isOnSkipList = isPartOfSkipListForShow(f.name, playlistId);
            if (isOnSkipList) {
                skippedShows.add(`${playlistId} ${f.name}`);
                log.debug(`${LOG_ID}: skipping ${f.name} for ${playlistId}`);
            }
            return ! isOnSkipList;
        })
        .filter(f => f.length)
        .map(fileMetadata => {
        const readableName = nameParser.parse(playlistId, fileMetadata);

        let length;
        if (fileMetadata.length.match(/^[0-9]+:[0-9]+$/)) {
            const [min, sec] = fileMetadata.length.split(':')
            length = Number(min) * 60 + Number(sec);
        } else {
            length = Number(fileMetadata.length);
        }

        /* Sometimes archive.org returns an mp3 without adding the 'Access-Control-Allow-Origin: *' header in to the response
        * so we provide a list of possible urls to the client and it will try them one at a time until one of them works */
        const encodedFileName = encodeURIComponent(fileMetadata.name),
            archivalUrl = `https://archive.org/download/${playlistId}/${encodedFileName}`,
            urls = [
                archivalUrl,
                `https://${playlist.server}${playlist.dir}/${encodedFileName}`,
                `https://${playlist.d1}${playlist.dir}/${encodedFileName}`,
                `https://${playlist.d2}${playlist.dir}/${encodedFileName}`,
            ];

        return {
            name: readableName,
            urls,
            archivalUrl,
            length
        };
    });
}

module.exports = {
    init() {
        const allPlaylistIds = configHelper.getAllPlaylistIds(),
            allPlaylistDataPromises = allPlaylistIds.map(playlistId => archiveOrg.getPlaylist(playlistId)),
            nameParser = buildNameParser();

        return Promise.all(allPlaylistDataPromises).then(allPlaylistData => {
            allPlaylistData
                .filter(playlistData => !playlistData.is_dark)
                .filter(playlistData => playlistData.metadata)
                .forEach(playlistData => {
                    const id = playlistData.metadata.identifier,
                        usefulPlaylistData = extractUsefulPlaylistData(id, playlistData, nameParser);
                    playlistsById[id] = usefulPlaylistData;
                });
            nameParser.logStats();
        }).then(() => {
            log.info(`${LOG_ID}: Skipped ${skippedShows.size} files`);
        });
    },
    // [{archivalUrl: "http://...", length: 1234.56, name: "X Minus One - Episode 079", url: "http://...", commercial: false}, ...]
    getPlaylist(id) {
        return playlistsById[id] || [];
    }
};
