const playlist = (() => {
    "use strict";
    let model;

    function shiftPlaylist(offset = 0) {
        const nextItem = model.playlist.shift();

        return {
            url: nextItem.url,
            name: nextItem.name,
            offset
        };
    }

    return {
        init(_model) {
            model = _model;
        },
        getPlaylistForChannel() {
            return service.getPlaylistForChannel(model.channel);
        },
        getNext() {
            if (!model.playlist) {
                // we just changed channel, start playing at the initial offset
                return service.getPlaylistForChannel(model.channel).then(playlist => {
                    model.playlist = playlist.list;
                    return shiftPlaylist(playlist.initialOffset);
                });

            } else if (!model.playlist.length) {
                // channel has not changed but we've run out of tracks, start playing without an offset
                return service.getPlaylistForChannel(model.channel).then(playlist => {
                    model.playlist.push(...playlist.list);
                    return shiftPlaylist();
                });

            } else {
                return Promise.resolve(shiftPlaylist());
            }
        }
    };
})();