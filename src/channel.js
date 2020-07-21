const
    START_TIME = 1595199600, // 2020-07-20 00:00:00
    DEFAULT_CLOCK = {
        now() {
            "use strict";
            return Date.now() / 1000
        }
    },
    PLAYLIST_MIN_LENGTH = 60 * 60;

module.exports.buildChannelManager = (clock = DEFAULT_CLOCK, playlistMinLengthInSeconds = PLAYLIST_MIN_LENGTH) => {
    const channels = {};

    return {
        addChannel(channelId, shows) {
            "use strict";

            const episodeCount = shows.flatMap(show => show.files).length,
                remainingForEachShow = {};

            shows.forEach(show => {
                remainingForEachShow[show.id] = {
                    startCount: show.files.length,
                    remaining: show.files.length
                };
            });
            console.log(`Build '${channelId}' channel with ${episodeCount} episodes`);

            const episodeList = [];

            for (let i = 0; i < episodeCount; i++) {
                const nextShowId = Object.entries(remainingForEachShow).map(kv => {
                    return {
                        showId: kv[0],
                        remainingFraction: (kv[1].remaining - 1) / kv[1].startCount
                    };
                }).sort((o1, o2) => o2.remainingFraction - o1.remainingFraction)[0].showId;

                const remainingForNextShow = remainingForEachShow[nextShowId],
                    nextShow = shows.find(s => s.id === nextShowId),
                    nextFile = nextShow.files[remainingForNextShow.startCount - remainingForNextShow.remaining],
                    nextEpisode = {
                        url: `${nextShow.urlPrefixes[0]}${nextFile.file}`,
                        length: nextFile.length
                    };
                remainingForNextShow.remaining--;
                episodeList.push(nextEpisode);
            }

            channels[channelId] = {
                title: channelId,
                duration: episodeList[episodeList.length - 1].offset,
                list: episodeList
            };
        },
        getPlaylist(channelId) {
            "use strict";
            const channel = channels[channelId],
                playlistLength = channel.list.reduce((lengthSoFar, currentItem) => lengthSoFar + currentItem.length, 0),
                offsetSinceStartOfPlay = (clock.now() - START_TIME) % playlistLength;
            let i = 0, clientPlaylist = [], currentOffset = 0, currentProgrammeDuration, currentItem;

            let initialOffset;
            while (true) {
                currentItem = channel.list[i % channel.list.length];
                if (currentOffset + currentItem.length > offsetSinceStartOfPlay) {
                    initialOffset = offsetSinceStartOfPlay - currentOffset;
                    break;
                }
                currentOffset += currentItem.length;
                i++;
            }

            currentProgrammeDuration = -initialOffset;
            while (currentProgrammeDuration < playlistMinLengthInSeconds) {
                const currentItem = channel.list[i % channel.list.length];
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

