"use strict";
const webClient = require('./webClient.js'),
    config = require('../config.json'),
    clock = require('./clock.js');


const requestQueue = (() => {
    const pendingRequests = [];
    let lastRequestMillis = 0, running = false, interval;

    function ensureRequestProcessorIsRunning(){
        if (!running) {
            running = true;

            function processNext() {
console.log('processNext')
                const nextRequestPermittedTs = lastRequestMillis + config.minRequestIntervalMillis,
                    timeUntilNextRequestPermitted = Math.max(0, nextRequestPermittedTs - clock.nowMillis());
console.log('waiting', timeUntilNextRequestPermitted);
                setTimeout(() => {
                    const {url, resolve, reject} = pendingRequests.shift();
console.log('requesting', url);
                    webClient.get(url)
                        .then(resolve)
                        .catch(reject)
                        .finally(() => {
                            lastRequestMillis = clock.nowMillis();
                            if (pendingRequests.length === 0) {
                                running = false;
                            } else {
                                processNext();
                            }
                        });
                }, timeUntilNextRequestPermitted);
            }

            processNext();
        }
    }

    return {
        push(url) {
            return new Promise((resolve, reject) => {
                pendingRequests.push({url, resolve, reject});
                ensureRequestProcessorIsRunning();
            });
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
        const requestUrl = `https://archive.org/metadata/${id}`;
        return requestQueue.push(requestUrl);
    }
};
