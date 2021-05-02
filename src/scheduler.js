"use strict";
const channelData = require('./channelData.js'),
    channelCodes = require('./channelCodes');

function getShowListForChannel(channelNameOrCode) {
    const showsForPredefinedChannel = channelData.getShows().filter(show => show.channels.includes(channelNameOrCode));

    if (showsForPredefinedChannel.length) {
        return showsForPredefinedChannel;

    } else {
        const showIndexes = channelCodes.buildShowIndexesFromChannelCode(channelNameOrCode);
        return channelData.getShows().filter(show => showIndexes.includes(show.index));
    }
}

function getFullScheduleFromShowList(showListForChannel) {

}

function getCurrentSchedule(fullSchedule, lengthInSeconds) {

}

module.exports = {
    getScheduleForChannel(channelNameOrCode, lengthInSeconds) {
        const showListForChannel = getShowListForChannel(channelNameOrCode),
            fullSchedule = getFullScheduleFromShowList(showListForChannel),
            currentSchedule = getCurrentSchedule(fullSchedule, lengthInSeconds);
        console.log(showListForChannel)
        return currentSchedule;
    }
}