"use strict";
const archiveOrg = require('./archiveOrg.js'),
    nameParser = require('./nameParser.js'),
    config = require('../config.json');

const playlistsById = {};

/*
    Shows have one or more 'playlists' associated with them (see config file) - each playlist comprises a list episodes
    including mp3 file urls.
*/
function extractUsefulPlaylistData(playlistId, playlist) {
    return playlist.files.filter(f => f.name.toLowerCase().endsWith('.mp3')).filter(f => f.length).map(fileMetadata => {
        const readableName = nameParser.parseName(playlistId, fileMetadata);

        let length;
        if (fileMetadata.length.match(/^[0-9]+:[0-9]+$/)) {
            const [min, sec] = fileMetadata.length.split(':')
            length = Number(min) * 60 + Number(sec);
        } else {
            length = Number(fileMetadata.length);
        }

        return {
            url: `https://${playlist.server}${playlist.dir}/${fileMetadata.name}`,
            archivalUrl: `https://archive.org/download/${playlistId}/${fileMetadata.name}`,
            name: readableName,
            length
        };
    });
}

module.exports = {
    init() {
        const allPlaylistIds = config.shows.flatMap(show => show.playlists),
            allPlaylistDataPromises = allPlaylistIds.map(playlistId => archiveOrg.getPlaylist(playlistId));

        return Promise.all(allPlaylistDataPromises).then(allPlaylistData => {
            allPlaylistData.forEach(playlistData => {
                const id = playlistData.metadata.identifier,
                    usefulPlaylistData = extractUsefulPlaylistData(id, playlistData);
                playlistsById[id] = usefulPlaylistData;
            });
        });
    },
    // [{archivalUrl: "http://...", length: 1234.56, name: "X Minus One - Episode 079", url: "http://...", commercial: false}, ...]
    getPlaylist(id) {
        return playlistsById[id];
    }
};
