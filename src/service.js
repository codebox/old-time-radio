const channelData = require('./channelData.js'),
    channelCodes = require('./channelCodes');

module.exports = {
    getShows() {
        "use strict";
        return channelData.getShows();
    },
    getChannels() {
        "use strict";
        return channelData.getChannels();
    },
    getScheduleForChannel(channelId, length) {
        "use strict";

    },
    getCodeForShowIndexes(showIndexes) {
        "use strict";
        return channelCodes.buildChannelCodeFromShowIndexes(showIndexes);
    }
};