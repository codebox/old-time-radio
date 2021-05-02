"use strict";

const channelData = require('./channelData.js'),
    channelCodes = require('./channelCodes'),
    scheduler = require('./scheduler.js'),
    ONE_HOUR = 60 * 60;

module.exports = {
    getShows() {
        return channelData.getShows();
    },
    getChannels() {
        return channelData.getChannels();
    },
    getScheduleForChannel(channelId, length = ONE_HOUR) {
        return scheduler.getScheduleForChannel(channelId, length);
    },
    getCodeForShowIndexes(showIndexes = []) {
        return channelCodes.buildChannelCodeFromShowIndexes(showIndexes);
    }
};