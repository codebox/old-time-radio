const service = (() => {
    "use strict";
    return {
        getChannels() {
            return fetch('/api/channels')
                .then(response => response.json());
        },
        getPlaylistForChannel(channelId, trimToNearest = false) {
            return fetch(`/api/playlist/${channelId}${trimToNearest ? '?nearest' : ''}`)
                .then(response => response.json());
        }
    };
})();