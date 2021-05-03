"use strict";
const archiveOrg = require('./archiveOrg.js');

module.exports = {
    getPlaylist(playlistId) {
        return archiveOrg.getPlaylist(playlistId);
    }
};
