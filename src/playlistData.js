"use strict";
const archiveOrg = require('./archiveOrg.js'),
    nameParser = require('./nameParser.js'),
    config = require('../config.json');

const playlistsById = {};

/*
    Shows have one or more 'playlists' associated with them (see config file) - each playlist comprises a list episodes
    including mp3 file urls.
*/
function extractUsefulPlaylistData(playlistId, playlist, query) {
    return playlist.files.filter(f => f.name.toLowerCase().endsWith('.mp3')).filter(f => f.length).filter((f,i) => !query || i===0).map(fileMetadata => {
        const readableName = nameParser.parseName(playlistId, {...fileMetadata, customParser: query ? 'music' : ''});

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

function getPlaylistQuery(query) {
    return archiveOrg.search(query.collection, 100, 1, `${query.startYear}-01-01`, `${query.endYear}-12-31`);
}

function queryPlaylistIds() {
    const showsWithPlaylistQueries = config.shows.filter(show => show.query),
        playListPromises = showsWithPlaylistQueries.map(show => getPlaylistQuery(show.query));

    return Promise.all(playListPromises).then(results => {
        results.forEach((result, i) => {
            const show = showsWithPlaylistQueries[i];
            show.playlists = result.response.docs.map(doc => doc.identifier);
        });
    });
}

module.exports = {
    init() {
        return queryPlaylistIds().then(() => {
            const configuredPlaylists = config.shows.filter(show => !show.query).flatMap(show => show.playlists).map(id => {
                    return {id, query: false};
                }),
                queriedPlaylists = config.shows.filter(show => show.query).flatMap(show => show.playlists).map(id => {
                    return {id, query: true};
                });

            const allPlaylistDataPromises = [...configuredPlaylists, ...queriedPlaylists]
                .map(playlistData => archiveOrg.getPlaylist(playlistData.id).then(data => {
                    return {...playlistData, data};
                }));

            return Promise.all(allPlaylistDataPromises).then(allPlaylistData => {
                allPlaylistData.forEach(playlistData => {
                    const {id, query, data} = playlistData;
                    const usefulPlaylistData = extractUsefulPlaylistData(id, data, query);
                    playlistsById[id] = usefulPlaylistData;
                });
            });
        });
    },
    // [{archivalUrl: "http://...", length: 1234.56, name: "X Minus One - Episode 079", url: "http://...", commercial: false}, ...]
    getPlaylist(id) {
        return playlistsById[id];
    }
};
