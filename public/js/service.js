const service = (() => {
    "use strict";
    return {
        getChannels() {
            return fetch('/api/channels')
                .then(response => response.json());
        },
        getPlaylistForChannel(channelId) {
            return fetch(`/api/channel/${channelId}`)
                .then(response => response.json());
        },
        getShowList() {
            return fetch('/api/shows')
                .then(response => response.json());
        },
        getChannelCodeForShows(indexes) {
            return fetch(`/api/channel/generate/${indexes.join(',')}`)
                .then(response => response.json());
        }
    };
})();