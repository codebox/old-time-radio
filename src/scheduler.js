"use strict";
const channelData = require('./channelData.js'),
    playlistData = require('./playlistData.js'),
    channelCodes = require('./channelCodes'),
    nameParser = require('./nameParser.js'),
    clock = require('./clock.js'),
    START_TIME = 1595199600, // 2020-07-20 00:00:00
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
    const showsToFiles = {}, commercials = [];

    showListForChannel.forEach(show => {
        const files = [];
        show.playlists.forEach(playlistName => {
            const playlist = playlistData.getPlaylist(playlistName);
            playlist.files.forEach(fileMetadata => {
                const readableName = nameParser.parseName(playlistName, fileMetadata),
                    length = Number(fileMetadata.length);

                files.push({
                    url: `https://${playlist.server}/${playlist.dir}/${fileMetadata.name}`,
                    archivalUrl: `https://archive.org/download/${playlistName}/${fileMetadata.name}`,
                    name: readableName,
                    length
                });
            });
        });

        if (show.isCommercial) {
            commercials.push(...files);
        } else {
            showsToFiles[show.name] = files;
        }
    });

    const originalFileCounts = {};
    Object.keys(showsToFiles).forEach(showName => {
        originalFileCounts[showName] = showsToFiles[showName].length;
    });

    const schedule = [],
        hasCommercials = !! commercials.length,
        nextCommercial = (() => {
            let nextIndex = 0;
            return () => {
                const commercial = commercials[nextIndex];
                nextIndex = (nextIndex + 1) % commercials.length;
                return commercial;
            };
        })();

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
            if (hasCommercials) {
                schedule.push(nextCommercial());
            }

        } else {
            break;
        }
    }

    const scheduleLength = schedule.reduce((total, item) => item.length + total, 0);

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
        const showListForChannel = getShowListForChannel(channelNameOrCode),
            fullSchedule = getFullScheduleFromShowList(showListForChannel),
            currentSchedule = getCurrentSchedule(fullSchedule, Math.min(lengthInSeconds, MAX_SCHEDULE_LENGTH));

        return currentSchedule;
    }
}