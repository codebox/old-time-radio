"use strict";
const webClient = require('./webClient.js'),
    PROTOCOL = 'https',
    DOMAIN = 'archive.org';

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
        // Example url: https://archive.org/metadata/OTRR_Space_Patrol_Singles
        return webClient.get(`${PROTOCOL}://${DOMAIN}/metadata/${id}`);
    },
    /*
     Example JSON (only showing data used by the application):
     {
        "response": {
            "numFound": 6910,
            "docs": [
                {"identifier": "78_the-gipsys-warning_betsy-lane-shepherd-henry-a-coard_gbia0083657b"},
                {"identifier": "78_what-do-you-say_hughie-barrett-yellen-ager-ash_gbia0074620a"},
                ...
            ]
        }
     }
     */
    search(collection, rowCount, page, fromDate, toDate) {
        // Example url: https://archive.org/advancedsearch.php?q=collection%3A(78rpm_bostonpubliclibrary)%20AND%20mediatype%3A(audio)%20AND%20date%3A%5B1920-01-01%20TO%201929-12-31%5D&fl[]=identifier&rows=10&page=1&output=json
        const query = encodeURIComponent(`collection:(${collection}) AND mediatype:(audio) AND date:[${fromDate} TO ${toDate}]`);
        return webClient.get(`${PROTOCOL}://${DOMAIN}/advancedsearch.php?q=${query}&fl[]=identifier&rows=${rowCount}&page=${page}&output=json`);
    }
};
