module.exports.buildShowManager = () => {
    "use strict";
    const shows = [];
    return {
        addShow(name, index) {
            shows.push({name, index});
        },
        getShows() {
            return shows;
        },
        buildCodeFromIndexes(...indexes) {

        }
    };
};
