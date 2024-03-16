"use strict";
const {configHelper} = require('./configHelper.js'),
    channelCodes = require('./channelCodes'),
    scheduler = require('./scheduler.js'),
    playlistData = require('./playlistData.js'),
    sitemap = require('./sitemap.js'),
    ONE_HOUR = 60 * 60;

module.exports = {
    init() {
        return playlistData.init();
    },
    async getShows() {
        return (await configHelper.getShows()).map(show => {
            const channelCode = channelCodes.buildChannelCodeFromShowIndexes([show.index]);
            return {
                channels: show.channels,
                index: show.index,
                isCommercial: show.isCommercial,
                name: show.name,
                shortName: show.shortName,
                descriptiveId: show.name.toLowerCase().replace(/ /g, '-').replace(/-+/g, '-').replace(/[^a-zA-Z0-9-]/g, ''),
                channelCode
            };
        });
    },
    async getChannels() {
        return await configHelper.getChannels();
    },
    async getScheduleForChannel(channelId, length = ONE_HOUR) {
        return await scheduler.getScheduleForChannel(channelId, length);
    },
    async getSitemapXml() {
        return this.getShows().then(shows => sitemap.getSitemapXml(shows));
    },
    getCodeForShowIndexes(showIndexes = []) {
        return channelCodes.buildChannelCodeFromShowIndexes(showIndexes);
    },
    async getPlayingNowAndNext(channels) {
        const channelIds = channels.length ? channels : await configHelper.getChannels();
        return Promise.all(channelIds.map(channelId => scheduler.getPlayingNowAndNext(channelId)));
    }
};