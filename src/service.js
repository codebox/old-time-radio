"use strict";

const channelData = require('./channelData.js'),
    channelCodes = require('./channelCodes'),
    scheduler = require('./scheduler.js'),
    playlistData = require('./playlistData.js'),
    ONE_HOUR = 60 * 60;

module.exports = {
    init() {
        return playlistData.init();
    },
    async getShows() {
        return (await channelData.getShows()).map(show => {
            return {
                channels: show.channels,
                index: show.index,
                isCommercial: show.isCommercial,
                name: show.name
            };
        });
    },
    getChannels() {
        return channelData.getChannels();
    },
    async getScheduleForChannel(channelId, length = ONE_HOUR) {
        return await scheduler.getScheduleForChannel(channelId, length);
    },
    getCodeForShowIndexes(showIndexes = []) {
        return channelCodes.buildChannelCodeFromShowIndexes(showIndexes);
    }
};