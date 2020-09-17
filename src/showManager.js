module.exports.buildShowManager = () => {
    "use strict";
    const shows = [];

    /*
     {
        "name": "Flash Gordon",
        "playlists": [
            "Flash_Gordon1935"
        ],
        "index": 5
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
            console.log(index)
            return shows.find(show => show.index === index);
        }
    };
};
