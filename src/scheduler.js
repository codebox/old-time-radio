"use strict";
const channelData = require('./channelData.js'),
    playlistData = require('./playlistData.js'),
    channelCodes = require('./channelCodes'),
    nameParser = require('./nameParser.js'),
    clock = require('./clock.js'),
    START_TIME = 1595199600, // 2020-07-20 00:00:00
    MIN_SCHEDULE_LENGTH = 60 * 60,
    MAX_SCHEDULE_LENGTH = 24 * 60 * 60;

function getShowListForChannel(channelNameOrCode) {
    const showsForPredefinedChannel = channelData.getShows().filter(show => show.channels.includes(channelNameOrCode));

    if (showsForPredefinedChannel.length) {
        return showsForPredefinedChannel;

    } else {
        const showIndexes = channelCodes.buildShowIndexesFromChannelCode(channelNameOrCode);
        return channelData.getShows().filter(show => showIndexes.includes(show.index));
    }
}

function getFullScheduleFromShowList(showListForChannel) { //TODO memoize
    const showsToFiles = {};
    let scheduleLength = 0;

    //TODO handle commercials
    showListForChannel.forEach(show => {
        showsToFiles[show.name] = [];
        show.playlists.forEach(playlistName => {
            const playlist = playlistData.getPlaylist(playlistName);
            playlist.files.forEach(fileMetadata => {
                const readableName = nameParser.parseName(playlistName, fileMetadata),
                    length = Number(fileMetadata.length);

                scheduleLength += length;
                showsToFiles[show.name].push({
                    url: `https://${playlist.server}/${playlist.dir}/${fileMetadata.name}`,
                    archivalUrl: `https://archive.org/download/${playlistName}/${fileMetadata.name}`,
                    name: readableName,
                    length
                });
            });
        });
    });

    const originalFileCounts = {};
    Object.keys(showsToFiles).forEach(showName => {
        originalFileCounts[showName] = showsToFiles[showName].length;
    });

    const schedule = [];

    while (true) {
        let largestFractionToRemain = -1, listToReduce = [];

        Object.entries(showsToFiles).forEach(entry => {
            const [showName, files] = entry,
                originalFileCount = originalFileCounts[showName],
                fractionToRemain = (files.length - 1) / originalFileCount;

            if (fractionToRemain > largestFractionToRemain) {
                largestFractionToRemain = fractionToRemain;
                listToReduce = files;
            }
        });

        if (listToReduce.length) {
            schedule.push(listToReduce.shift());
        } else {
            break;
        }
    }

    return {schedule, length: scheduleLength};
}

function getCurrentPlaylistPosition(playlist, playlistDuration) {
    const offsetSinceStartOfPlay = (clock.now() - START_TIME) % playlistDuration;
    let i = 0, playlistItemOffset = 0;

    let initialOffset;
    while (true) {
        const playlistItem = playlist[i % playlist.length],
            itemIsPlayingNow = playlistItemOffset + playlistItem.length > offsetSinceStartOfPlay;
        if (itemIsPlayingNow) {
            initialOffset = offsetSinceStartOfPlay - playlistItemOffset;
            break;
        }
        playlistItemOffset += playlistItem.length;
        i++;
    }

    return {
        index: i % playlist.length,
        offset: initialOffset
    };
}

function getCurrentSchedule(fullSchedule, playlistMinLength) {
    const episodeList = fullSchedule.schedule,
        playlistLength = fullSchedule.length,
        clientPlaylist = [];

    let {index, offset} = getCurrentPlaylistPosition(episodeList, playlistLength);

    let currentPlaylistDuration = -offset;
    while (currentPlaylistDuration < playlistMinLength) {
        const currentItem = episodeList[index % episodeList.length];
        clientPlaylist.push(currentItem);
        currentPlaylistDuration += currentItem.length;
        index++;
    }

    return {
        list: clientPlaylist,
        initialOffset: offset
    };
}

module.exports = {
    getScheduleForChannel(channelNameOrCode, lengthInSeconds) {
        const showListForChannel = getShowListForChannel(channelNameOrCode);
            const fullSchedule = getFullScheduleFromShowList(showListForChannel),
            currentSchedule = getCurrentSchedule(fullSchedule, lengthInSeconds);

        return currentSchedule;
    }
}