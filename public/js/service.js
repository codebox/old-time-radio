function buildService() {
    "use strict";
    return {
        getChannels() {
            return fetch('/api/channels')
                .then(response => response.json());
        },
        getPlaylistForChannel(channelId) {
            return fetch(`/api/channel/${channelId}${length ? '?length=' + length : ''}`)
                .then(response => response.json());
        }
    };
}