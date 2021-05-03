"use strict";
const webClient = require('./webClient.js');

module.exports = {
    getPlaylist(id) {
        return webClient.get(`https://archive.org/metadata/${id}`);
    }
};
