function buildService() {
    const clock = buildClock();
    "use strict";
    const playlistCache = (() => {
        const cache = {};

        function buildKeyName(channelId, length) {
            return `${channelId}_${length}`;
        }

        return {
            get(channelId, length) {
                const key = buildKeyName(channelId, length),
                    entry = cache[key];
                if (entry) {
                    const ageInSeconds = clock.nowSeconds() - entry.ts,
                        initialOffsetInSecondsNow = entry.playlist.initialOffset + ageInSeconds,
                        lengthOfCurrentPlaylistItem = entry.playlist.list[0].length;
                    if (lengthOfCurrentPlaylistItem > initialOffsetInSecondsNow) {
                        return {
                            initialOffset: initialOffsetInSecondsNow,
                            list: [...entry.playlist.list] // defensive copy, the playlist object will get mutated by other code
                        }
                    } else {
                        delete cache[key];
                    }
                }
            },
            set(channelId, length, playlist) {
                const key = buildKeyName(channelId, length);
                cache[key] = {
                    ts: clock.nowSeconds(),
                    playlist: { // defensive copy
                        initialOffset: playlist.initialOffset,
                        list: [...playlist.list]
                    }
                };
            }
        };
    })();

    return {
        getChannels() {
            return fetch('/api/channels')
                .then(response => response.json());
        },
        getShowList() {
            return fetch('/api/shows')
                .then(response => response.json());
        },
        getChannelCodeForShows(indexes) {
            return fetch(`/api/channel/generate/${indexes.join(',')}`)
                .then(response => response.json());
        },
        getPlaylistForChannel(channelId, length) {
            const cachedPlaylist = playlistCache.get(channelId, length);
            if (cachedPlaylist) {
                console.log(`Cache HIT for ${channelId}/${length}`);
                return Promise.resolve(cachedPlaylist);
            }
            console.log(`Cache MISS for ${channelId}/${length}`);
            return fetch(`/api/channel/${channelId}${length ? '?length=' + length : ''}`)
                .then(response => {
                    return response.json().then(playlist => {
                        playlistCache.set(channelId, length, playlist);
                        return playlist;
                    });
                });
        },
        getPlayingNow(channelsList) {
            const hasChannels = channelsList && channelsList.length > 0,
                channelsParameter = hasChannels ? channelsList.map(encodeURIComponent).join(',') : '';
            return fetch(`/api/playing-now${channelsParameter ? '?channels=' + channelsParameter : ''}`)
                .then(response => response.json());
        }
    };
}