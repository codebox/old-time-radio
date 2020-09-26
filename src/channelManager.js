const winston = require('winston');

module.exports.buildChannelManager = (showManager, playlistManager) => {
    /*
     {
         name: 'future',
         shows: [1, 2, 3, 4, 5, 6, 7, 8, 9]
     }
     */
    const predefinedChannels = {},
        SHOWS_PER_CHAR = 6,
        ADVERTS_CHANNEL = 'adverts',
        CHANNEL_CODE_REGEX = /^[0-9a-zA-Z_-]+$/i;

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
                    const episodeListForAdverts = buildEpisodeListForShowIds(advertShowIds, false);
                    episodeListForAdverts.forEach(episode => episode.commercial = true);
                    adverts.push(...episodeListForAdverts);
                }
                const index = (Math.abs(hash(randomisationKey)) + offset) % adverts.length;
                return adverts[index];
            }
        };
    })();

    const CHAR_MAP = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_';
    function numToString(n) {
        "use strict";
        console.assert(n<64);
        return CHAR_MAP.charAt(n);
    }

    function stringToNum(s) {
        "use strict";
        console.assert(s.length === 1);
        const n = CHAR_MAP.indexOf(s);
        console.assert(n >= 0);
        return n;
    }

    function buildCodeFromIndexes(indexes) {
        const uniqueNumericIndexes = new Set(indexes.map(Number)),
            shows = showManager.getShows();

        const groupTotals = new Array(Math.ceil(shows.length / SHOWS_PER_CHAR)).fill(0);
        for (let i=0; i<shows.length; i++) {
            const groupIndex = Math.floor(i / SHOWS_PER_CHAR);
            if (uniqueNumericIndexes.has(i)) {
                groupTotals[groupIndex] += Math.pow(2, i - groupIndex * SHOWS_PER_CHAR);
            }
        }
        return groupTotals.map(numToString).join('');
    }

    function parseCodeToIndexes(code) {
        const indexes = [];
        code.split('').forEach((c, charIndex) => {
            const num = stringToNum(c);
            indexes.push(...[num & 1, num & 2, num & 4, num & 8, num & 16, num & 32].map((n,i) => n ? i + charIndex * SHOWS_PER_CHAR : 0).filter(n=>n));
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
        getChannelsForShowId(showIndex) {
            "use strict";
            const channelsForShow = [];
            Object.keys(predefinedChannels).forEach(channelId => {
                if (predefinedChannels[channelId].shows.includes(showIndex)) {
                    channelsForShow.push(channelId);
                }
            });
            return channelsForShow;
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
        },
        generateCodeForShowIndexes(showIndexes) {
            "use strict";
            return buildCodeFromIndexes(showIndexes);
        }
    };
};

