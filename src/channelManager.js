const winston = require('winston');

module.exports.buildChannelManager = (showManager, playlistManager) => {
    /*
     {
         name: 'future',
         shows: [1, 2, 3, 4, 5, 6, 7, 8, 9]
     }
     */
    const predefinedChannels = {},
        QUARTET_SIZE = 4,
        ADVERTS_CHANNEL = 'adverts',
        CHANNEL_CODE_REGEX = /^[0-9a-f]+$/i;

    const advertManager = (() => {
        "use strict";
        const adverts = [], advertShowIds = [];

        function hash(s){
            return s.split('').reduce((a,b) => {
                a = ((a<<5) - a) + b.charCodeAt(0);
                return a&a
            }, 0);
        }

        return {
            setShowIds(showIds) {
                advertShowIds.push(...showIds);
            },
            get(randomisationKey, offset) {
                if (!adverts.length) {
                    adverts.push(...buildEpisodeListForShowIds(advertShowIds, false));
                }
                const index = (Math.abs(hash(randomisationKey)) + offset) % adverts.length;
                return adverts[index];
            }
        };
    })();

    function parseCodeToIndexes(code) {
        const indexes = [];
        code.split('').forEach((c, charIndex) => {
            const num = Number.parseInt(c, Math.pow(2, QUARTET_SIZE));
            indexes.push(...[num & 1, num & 2, num & 4, num & 8].map((n,i) => n ? i + charIndex * QUARTET_SIZE : 0).filter(n=>n));
        });
        return indexes;
    }

    function getFilesForShow(show) {
        "use strict";
        return show.playlists.flatMap(playlistId => playlistManager.getPlaylist(playlistId).files);
    }

    function buildEpisodeListForShowIds(showIndexes, mergeAdverts) {
        "use strict";
        const shows = showIndexes.map(showManager.getShowByIndex).filter(s => s),
            episodeCount = shows.reduce((count, show) => getFilesForShow(show).length + count, 0),
            remainingForEachShow = {};

        shows.forEach(show => {
            const files = getFilesForShow(show);
            remainingForEachShow[show.name] = {
                startCount: files.length,
                remaining: files.length
            };
        });

        const episodeList = [], advertRandomisationKey = showIndexes.join('.');

        for (let i = 0; i < episodeCount; i++) {
            const nextShowId = Object.entries(remainingForEachShow).map(kv => {
                return {
                    showId: kv[0],
                    remainingFraction: (kv[1].remaining - 1) / kv[1].startCount
                };
            }).sort((o1, o2) => o2.remainingFraction - o1.remainingFraction)[0].showId;

            const remainingForNextShow = remainingForEachShow[nextShowId],
                nextShow = shows.find(s => s.name === nextShowId),
                nextFile = getFilesForShow(nextShow)[remainingForNextShow.startCount - remainingForNextShow.remaining],
                nextEpisode = {
                    url: `${nextFile.urlPrefixes[0]}${nextFile.file}`,
                    name: nextFile.name,
                    length: nextFile.length
                };
            remainingForNextShow.remaining--;
            episodeList.push(nextEpisode);
            if (mergeAdverts) {
                episodeList.push(advertManager.get(advertRandomisationKey, i));
            }
        }

        return episodeList;
    }

    return {
        addPredefinedChannel(predefinedChannel) {
            "use strict";
            if (predefinedChannel.name === ADVERTS_CHANNEL) {
                advertManager.setShowIds(predefinedChannel.shows);
            } else {
                predefinedChannels[predefinedChannel.name] = predefinedChannel;
            }
        },
        getPredefinedChannels() {
            "use strict";
            return Object.keys(predefinedChannels);
        },
        getEpisodeList(channelId, mergeAdverts) {
            "use strict";
            const showIndexes = [];

            if (channelId in predefinedChannels) {
                showIndexes.push(...predefinedChannels[channelId].shows);

            } else if (channelId.match(CHANNEL_CODE_REGEX)) {
                showIndexes.push(...parseCodeToIndexes(channelId))
            }

            return buildEpisodeListForShowIds(showIndexes, mergeAdverts);
        }
    };
};

