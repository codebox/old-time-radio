"use strict";
const {configHelper} = require('./configHelper.js'),
    playlistData = require('./playlistData.js'),
    channelCodes = require('./channelCodes'),
    clock = require('./clock.js'),
    config = require('../config.json'),
    log = require('./log.js'),
    memoize = require('./cache.js').memoize,
    START_TIME = 1595199600, // 2020-07-20 00:00:00
    MAX_SCHEDULE_LENGTH = 24 * 60 * 60;

const getFullScheduleForChannel = memoize(async channelNameOrCode => { //TODO limit how many we store in memory
    async function getShowListForChannel(channelNameOrCode) {
        const allShows = await configHelper.getShows(),
            showsForPredefinedChannel = allShows.filter(show => show.channels.includes(channelNameOrCode));

        if (showsForPredefinedChannel.length) {
            return showsForPredefinedChannel;

        } else {
            const showIndexes = channelCodes.buildShowIndexesFromChannelCode(channelNameOrCode);
            return allShows.filter(show => showIndexes.includes(show.index));
        }
    }

    function balanceFileCounts(unbalancedShowsToFiles) {
        const fileCounts = {}, showsToFiles = {};
        Object.keys(unbalancedShowsToFiles).forEach(showName => {
            fileCounts[showName] = unbalancedShowsToFiles[showName].length;
        });

        const maxFileCount = Math.max(...Object.values(fileCounts)),
            radical = Math.max(config.scheduler.radical, 1);

        function getCopyCount(count) {
            /*
             The 'config.scheduler.radical' value is used to determine how much to boost shows with only a small number of episodes within a channel schedule. Setting the value close to 0 will cause a schedule to contain roughly equal numbers of episodes from each show, and consequently lots of repeated episodes from shows with low episode counts. Setting a higher value (eg 3 or 4) will result in far fewer repeats, but at the cost of having shows with many episodes dominate the schedule, perhaps causing multiple episodes from the same show to be played consecutively.
             */
            return Math.round(Math.pow(maxFileCount/count, 1 / radical));
        }

        Object.keys(unbalancedShowsToFiles).forEach(showName => {
            const fileCount = fileCounts[showName],
                filesForShow = unbalancedShowsToFiles[showName];
            let copyCount = getCopyCount(fileCount);
            showsToFiles[showName] = [];

            while(copyCount > 0) {
                showsToFiles[showName].push(...filesForShow);
                copyCount--;
            }
        });

        return showsToFiles;
    }

    function getFullScheduleFromShowList(showListForChannel) {
        const unbalancedShowsToFiles = {}, commercials = [],
            isOnlyCommercials = showListForChannel.every(show => show.isCommercial);

        showListForChannel.forEach(show => {
            const files = show.playlists.flatMap(playlistName => playlistData.getPlaylist(playlistName)).flatMap(file => {
                if (show.isCommercial) {
                    file.commercial = true;
                }
                return file;
            });

            if (show.isCommercial && !isOnlyCommercials) {
                commercials.push(...files);
            } else {
                unbalancedShowsToFiles[show.shortName] = files;
            }
        });

        const showsToFiles = balanceFileCounts(unbalancedShowsToFiles);
        Object.keys(showsToFiles).forEach(showName => {
            log.debug(`${channelNameOrCode}: ${showName} [${showsToFiles[showName].length/unbalancedShowsToFiles[showName].length}x] ${unbalancedShowsToFiles[showName].length}/${showsToFiles[showName].length}`)
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
            let largestFractionToRemain = -1, listToReduce = [], showNameToReduce;

            Object.entries(showsToFiles).forEach(entry => {
                const [showName, files] = entry,
                    originalFileCount = originalFileCounts[showName],
                    fractionToRemain = (files.length - 1) / originalFileCount;

                if (fractionToRemain > largestFractionToRemain) {
                    largestFractionToRemain = fractionToRemain;
                    listToReduce = files;
                    showNameToReduce = showName;
                }
            });

            if (listToReduce.length) {
                schedule.push({...listToReduce.shift(), showName: showNameToReduce});
                if (hasCommercials) {
                    schedule.push({...nextCommercial(), showName: "Commercial"});
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

function getCurrentSchedule(fullSchedule, stopCondition) {
    const episodeList = fullSchedule.schedule,
        playlistLength = fullSchedule.length,
        clientPlaylist = [];

    let {index, offset} = getCurrentPlaylistPosition(episodeList, playlistLength);

    let currentPlaylistDuration = -offset;
    while (!stopCondition(currentPlaylistDuration, clientPlaylist.length)) {
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

function playlistReachedMinDuration(minDuration) {
    return (currentPlaylistDuration) => {
        return currentPlaylistDuration >= minDuration;
    };
}

function playlistContainsRequiredNumberOfItems(numberOfItems) {
    return (_, currentPlaylistSize) => {
        return currentPlaylistSize >= numberOfItems;
    };
}

module.exports = {
    async getScheduleForChannel(channelNameOrCode, lengthInSeconds) {
        const fullSchedule = await getFullScheduleForChannel(channelNameOrCode),
            currentSchedule = getCurrentSchedule(fullSchedule, playlistReachedMinDuration(Math.min(lengthInSeconds, MAX_SCHEDULE_LENGTH)));

        return currentSchedule;
    },
    async getPlayingNowAndNext(channelNameOrCode) {
        const fullSchedule = await getFullScheduleForChannel(channelNameOrCode),
            // min length of '3' guarantees we get the current show and the next show even if there are commercials playing between them
            currentSchedule = getCurrentSchedule(fullSchedule, playlistContainsRequiredNumberOfItems(3));

        return {
            channelId: channelNameOrCode,
            list: currentSchedule.list.filter(item => !item.commercial).slice(0, 2),
            initialOffset: currentSchedule.initialOffset
        };
    }
}
