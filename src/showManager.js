module.exports.buildShowManager = () => {
    "use strict";
    const shows = [];

    /*
     {
        "name": "Flash Gordon",
        "playlists": [
            "Flash_Gordon1935"
        ],
        "index": 5,
        "channels" : ["future"]
     }
     */
    return {
        addShow(showObj) {
            shows.push(showObj);
        },
        getShows() {
            return [...shows];
        },
        getShowByIndex(index) {
            return shows.find(show => show.index === index);
        }
    };
};
