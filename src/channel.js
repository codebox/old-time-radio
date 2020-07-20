const channels = {},
    START_TIME = 1595199600; // 2020-07-20 00:00:00

let clock = {
    now() {
        "use strict";
        return Date.now() / 1000
    }
};

module.exports = {
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

        for (let i=0; i<episodeCount; i++) {
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
        const minProgrammeDuration = 60 * 60, // how long must the playlist be that we return?
            playlist = channels[channelId],
            playlistLength = playlist.list.reduce((lengthSoFar, currentItem) => lengthSoFar + currentItem.length, 0),
            offsetSinceStartOfPlay = (clock.now() - START_TIME) % playlistLength;

        let i = 0, clientPlaylist = [], currentOffset = 0, currentProgrammeDuration = 0, currentItem;

        while (currentOffset < offsetSinceStartOfPlay) {
            currentItem = playlist.list[i % playlist.list.length];
            currentOffset += currentItem.length;
            i++;
        }
        clientPlaylist.push(currentItem);
        const initialOffset = offsetSinceStartOfPlay - currentOffset + currentItem.length;

        while (currentProgrammeDuration < minProgrammeDuration) {
            const currentItem = playlist.list[i % playlist.list.length];
            clientPlaylist.push(currentItem);
            currentProgrammeDuration += currentItem.length;
            i++;
        }

        return {
            list: clientPlaylist,
            initialOffset
        };
    },
    setClock(_clock) { // for unit tests
        "use strict";
        clock = _clock;
    }
};

