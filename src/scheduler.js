"use strict";
const channelData = require('./channelData.js'),
    playlistData = require('./playlistData.js'),
    channelCodes = require('./channelCodes'),
    clock = require('./clock.js'),
    log = require('./log.js'),
    memoize = require('./cache.js').memoize,
    START_TIME = 1595199600, // 2020-07-20 00:00:00
    MAX_SCHEDULE_LENGTH = 24 * 60 * 60;

const getFullScheduleForChannel = memoize(async channelNameOrCode => { //TODO limit how many we store in memory
    async function getShowListForChannel(channelNameOrCode) {
        const allShows = await channelData.getShows(),
            showsForPredefinedChannel = allShows.filter(show => show.channels.includes(channelNameOrCode));

        if (showsForPredefinedChannel.length) {
            return showsForPredefinedChannel;

        } else {
            const showIndexes = channelCodes.buildShowIndexesFromChannelCode(channelNameOrCode);
            return allShows.filter(show => showIndexes.includes(show.index));
        }
    }

    function balanceFileCounts(showsToFiles) {
        const fileCounts = {};
        Object.keys(showsToFiles).forEach(showName => {
            fileCounts[showName] = showsToFiles[showName].length;
        });

        const maxFileCount = Math.max(...Object.values(fileCounts));
        Object.keys(showsToFiles).forEach(showName => {
            const fileCount = fileCounts[showName],
                copyCount = 1;
            fileCounts[showName] = showsToFiles[showName].length;
        });

    }

    function getFullScheduleFromShowList(showListForChannel) {
        const showsToFiles = {}, commercials = [];

        showListForChannel.forEach(show => {
            const files = show.playlists.flatMap(playlistName => playlistData.getPlaylist(playlistName)).flatMap(file => {
                if (show.isCommercial) {
                    file.commercial = true;
                }
                return file;
            });

            if (show.isCommercial) {
                commercials.push(...files);
            } else {
                showsToFiles[show.name] = files;
            }
        });

        balanceFileCounts(showsToFiles);

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

    log.info(`Calculating schedule for channel [${channelNameOrCode}]`);
    const showListForChannel = await getShowListForChannel(channelNameOrCode);

    return getFullScheduleFromShowList(showListForChannel);
}, "channelFullSchedule");

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
        //TODO safety value here
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
    async getScheduleForChannel(channelNameOrCode, lengthInSeconds) {
        const fullSchedule = await getFullScheduleForChannel(channelNameOrCode),
            currentSchedule = getCurrentSchedule(fullSchedule, Math.min(lengthInSeconds, MAX_SCHEDULE_LENGTH));

        return currentSchedule;
    }
}
