"use strict";
const webClient = require('./webClient.js'),
    config = require('../config.json'),
    clock = require('./clock.js');


const requestQueue = (() => {
    const pendingRequests = [];
    let requestTs = 0, running = false, interval

    return {
        push(id) {
            pendingRequests.push(id);
            if (!running) {
                running = true;
                requestTs = clock.now();
                interval = setInterval(() => {
                    console.log(`Requesting ${pendingRequests.length} playlist(s)`);
                    pendingRequests.length = 0;
                    running = false;
                }, config.minRequestIntervalMillis);
        }
    };
})();
module.exports = {
    /*
    Example JSON (only showing data used by the application):
    {
        "dir": "/32/items/OTRR_Space_Patrol_Singles",
        "files": [{
            "name": "Space_Patrol_52-10-25_004_The_Hole_in_Empty_Space.mp3",
            "length": "1731.12",
            "title": "The Hole in Empty Space"
        }, {
            ...
        }],
        "metadata": {
            "identifier": "OTRR_Space_Patrol_Singles"
        }
        "server": "ia801306.us.archive.org"
    }
    */
    getPlaylist(id) {
        pendingRequests.push(id);
        // Example url: https://archive.org/metadata/OTRR_Space_Patrol_Singles
        return webClient.get(`https://archive.org/metadata/${id}`);
    }
};
