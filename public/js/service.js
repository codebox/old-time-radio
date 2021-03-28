function buildService() {
    "use strict";
    const playlistCache = (() => {
        const cache = {};

        function now() {
            return Date.now() / 1000;
        }

        function buildKeyName(channelId, length) {
            return `${channelId}_${length}`;
        }

        return {
            get(channelId, length) {
                const key = buildKeyName(channelId, length),
                    entry = cache[key];
                if (entry) {
                    const ageInSeconds = now() - entry.ts,
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
                    ts: now(),
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
        }
    };
}