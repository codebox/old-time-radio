window.onload = () => {
    "use strict";

    const model = buildModel(),
        view = buildView(),
        service = buildService(),
        audioPlayer = buildAudioPlayer(model.maxVolume);

    function loadNextFromPlaylist() {
        if (model.playlist && model.playlist.list.length) {
            const nextItem = model.playlist.shift();
            audioPlayer.load(nextItem.url);

        } else {
            service.getPlaylistForChannel(model.selectedChannelId).then(playlist => {
                model.playlist = playlist.list;
                model.nextTrackOffset = playlist.initialOffset;

                const nextItem = model.playlist.shift();
                audioPlayer.load(nextItem.url);
            });
        }
    }

    service.getChannels().then(channelIds => {
        model.channels = channelIds.map(channelId => {
            return {
                id: channelId,
                name: channelId,
                userChannel: false
            };
        });
        view.setChannels(model.channels);
    });

    audioPlayer.on(EVENT_AUDIO_TRACK_LOADED, () => {
        audioPlayer.play(model.nextTrackOffset);
        model.nextTrackOffset = 0;
        view.setChannelLoaded(model.selectedChannelId);
    });

    audioPlayer.on(EVENT_AUDIO_TRACK_ENDED, () => {
        loadNextFromPlaylist();
    });

    view.on(EVENT_CHANNEL_BUTTON_CLICK, event => {
        const channelId = event.data;

        if (channelId === model.selectedChannelId) {
            model.selectedChannelId = null;
            model.playlist = null;

            audioPlayer.stop();

            view.setNoChannelSelected();

        } else {
            model.playlist = null;
            model.selectedChannelId = channelId;

            view.setChannelLoading(channelId);

            loadNextFromPlaylist();
        }
    });

    view.on(EVENT_MENU_OPEN_CLICK, () => {
        view.openMenu();
    });

    view.on(EVENT_MENU_CLOSE_CLICK, () => {
        view.closeMenu();
    });

    function applyModelVolume() {
        view.updateVolume(model.volume, model.minVolume, model.maxVolume);
        audioPlayer.setVolume(model.volume, model.maxVolume);
    }

    view.on(EVENT_VOLUME_UP_CLICK, () => {
        model.volume++;
        applyModelVolume();
    });
    view.on(EVENT_VOLUME_DOWN_CLICK, () => {
        model.volume--;
        applyModelVolume();
    });

    applyModelVolume();

};
