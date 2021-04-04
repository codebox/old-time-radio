const winston = require('winston');

module.exports.buildChannelManager = (showManager, playlistManager) => {
    /*
     {
         name: 'future',
         shows: [1, 2, 3, 4, 5, 6, 7, 8, 9]
     }
     */
    const predefinedChannels = {},
        episodeListCache = {},
        commercialShowIds = [],
        SHOWS_PER_CHAR = 6,
        CHANNEL_CODE_REGEX = /^[0-9a-zA-Z_-]+$/i;

    function buildAdvertManager(advertShows, randomisationKey) {
        "use strict";
        const adverts = [];

        function hash(s) {
            return s.split('').reduce((a,b) => {
                a = ((a<<5) - a) + b.charCodeAt(0);
                return a&a
            }, 0);
        }

        function buildEpisodeList() {
            return advertShows.flatMap(getFilesForShow).map(buildFileDetails);
        }

        return {
            get(offset) {
                if (!adverts.length) {
                    const episodeListForAdverts = buildEpisodeList();
                    episodeListForAdverts.forEach(episode => episode.commercial = true);
                    adverts.push(...episodeListForAdverts);
                }
                const index = (Math.abs(hash(randomisationKey)) + offset) % adverts.length;
                return adverts[index];
            }
        };
    };

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

    function buildFileDetails(file) {
        "use strict";
        return {
            url: `https://archive.org/download/${file.itemId}/${file.file}`,
            name: file.name,
            length: file.length
        };
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
            indexes.push(...[num & 1, num & 2, num & 4, num & 8, num & 16, num & 32].map((n,i) => n ? i + charIndex * SHOWS_PER_CHAR : null).filter(n => n !== null));
        });
        return indexes;
    }

    function getFilesForShow(show) {
        "use strict";
        return show.playlists.flatMap(playlistId => playlistManager.getPlaylist(playlistId).files);
    }

    function formatDuration(durationSeconds) {
        "use strict";
        const hours = Math.floor(durationSeconds / (60 * 60)),
            minutes = Math.floor((durationSeconds - hours * 60 * 60) / 60),
            seconds = Math.round(durationSeconds - hours * 60 * 60 - minutes * 60);
        return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    function buildEpisodeListForShowIds(showIndexes) {
        "use strict";
        const allShows = showIndexes.map(showManager.getShowByIndex).filter(s => s),
            nonCommercialShows = allShows.filter(show => ! show.isCommercial),
            commercialShows = allShows.filter(show => show.isCommercial),
            episodeCount = nonCommercialShows.reduce((count, show) => getFilesForShow(show).length + count, 0),
            remainingForEachShow = {},
            advertRandomisationKey = nonCommercialShows.map(show => show.index).join('.'),
            mergeAdverts = !! commercialShows.length,
            advertManager = mergeAdverts && buildAdvertManager(commercialShows, advertRandomisationKey);

        nonCommercialShows.forEach(show => {
            const files = getFilesForShow(show);
            remainingForEachShow[show.name] = {
                startCount: files.length,
                remaining: files.length
            };
        });

        const episodeList = [];

        let durationSeconds = 0;

        for (let i = 0; i < episodeCount; i++) {
            const nextShowId = Object.entries(remainingForEachShow).map(kv => {
                return {
                    showId: kv[0],
                    remainingFraction: (kv[1].remaining - 1) / kv[1].startCount
                };
            }).sort((o1, o2) => o2.remainingFraction - o1.remainingFraction)[0].showId;

            const remainingForNextShow = remainingForEachShow[nextShowId],
                nextShow = nonCommercialShows.find(s => s.name === nextShowId),
                nextFile = getFilesForShow(nextShow)[remainingForNextShow.startCount - remainingForNextShow.remaining],
                nextEpisode = buildFileDetails(nextFile);

            durationSeconds += nextEpisode.length;
            remainingForNextShow.remaining--;
            episodeList.push(nextEpisode);
            if (mergeAdverts) {
                episodeList.push(advertManager.get(i));
            }
        }

        winston.log('info', `Channel ${showIndexes.join()}: ${episodeCount} / ${formatDuration(durationSeconds)}`)

        return episodeList;
    }

    return {
        addPredefinedChannel(predefinedChannel) {
            "use strict";
            predefinedChannels[predefinedChannel.name] = predefinedChannel;
        },
        addCommercialShows(showIds) {
            "use strict";
            commercialShowIds.push(...showIds);
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
        getEpisodeList(channelId) {
            "use strict";
            if (!episodeListCache[channelId]) {
                let showIndexes = [];

                if (channelId in predefinedChannels) {
                    showIndexes.push(...predefinedChannels[channelId].shows);

                } else if (channelId.match(CHANNEL_CODE_REGEX)) {
                    showIndexes.push(...parseCodeToIndexes(channelId))
                }

                episodeListCache[channelId] = buildEpisodeListForShowIds(showIndexes);
            }
            return episodeListCache[channelId];
        },
        generateCodeForShowIndexes(showIndexes) {
            "use strict";
            return buildCodeFromIndexes(showIndexes);
        }
    };
};

