const START_TIME = 1595199600, // 2020-07-20 00:00:00
    clock = {
        now() {
            "use strict";
            return Date.now() / 1000
        }
    },
    MIN_SCHEDULE_LENGTH = 60 * 60,
    MAX_SCHEDULE_LENGTH = 24 * 60 * 60;

module.exports.buildScheduleBuilder = () => {
    return {
        buildScheduleForEpisodeList(episodeList, requestedPlaylistMinLength = MIN_SCHEDULE_LENGTH) {
            const playlistMinLength = Math.min(Math.max(requestedPlaylistMinLength, MIN_SCHEDULE_LENGTH), MAX_SCHEDULE_LENGTH),
                playlistLength = episodeList.reduce((lengthSoFar, currentItem) => lengthSoFar + currentItem.length, 0),
                offsetSinceStartOfPlay = (clock.now() - START_TIME) % playlistLength;
            let i = 0, clientPlaylist = [], currentOffset = 0, currentProgrammeDuration, currentItem;

            let initialOffset;
            while (true) {
                currentItem = episodeList[i % episodeList.length];
                if (currentOffset + currentItem.length > offsetSinceStartOfPlay) {
                    initialOffset = offsetSinceStartOfPlay - currentOffset;
                    break;
                }
                currentOffset += currentItem.length;
                i++;
            }

            currentProgrammeDuration = -initialOffset;
            while (currentProgrammeDuration < playlistMinLength) {
                const currentItem = episodeList[i % episodeList.length];
                clientPlaylist.push(currentItem);
                currentProgrammeDuration += currentItem.length;
                i++;
            }

            return {
                list: clientPlaylist,
                initialOffset
            };
        }
    };
};


