const START_TIME = 1595199600, // 2020-07-20 00:00:00
    clock = {
        now() {
            "use strict";
            return Date.now() / 1000
        }
    },
    PLAYLIST_MIN_LENGTH = 60 * 60;

module.exports.buildScheduleBuilder = () => {
    return {
        buildScheduleForEpisodeList(episodeList, trimToNearestBoundary=false) {
            const playlistLength = episodeList.reduce((lengthSoFar, currentItem) => lengthSoFar + currentItem.length, 0),
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

            if (trimToNearestBoundary) {
                const isPastHalfWay = initialOffset > currentItem.length / 2;
                initialOffset = 0;
                if (isPastHalfWay) {
                    i++;
                }
            }

            currentProgrammeDuration = -initialOffset;
            while (currentProgrammeDuration < PLAYLIST_MIN_LENGTH) {
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


