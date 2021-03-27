window.onload = () => {
    "use strict";

    const model = buildModel(),
        view = buildView(),
        service = buildService(),
        audioPlayer = buildAudioPlayer(model.maxVolume),
        messageManager = buildMessageManager(model);

    function loadNextFromPlaylist() {
        if (model.playlist && model.playlist.length) {
            const nextItem = model.playlist.shift();
            model.track = nextItem;
            audioPlayer.load(nextItem.url);

        } else {
            service.getPlaylistForChannel(model.selectedChannelId).then(playlist => {
                model.playlist = playlist.list;
                model.nextTrackOffset = playlist.initialOffset;

                const nextItem = model.playlist.shift();
                model.track = nextItem;
                audioPlayer.load(nextItem.url);
            });
        }
    }

    audioPlayer.on(EVENT_AUDIO_TRACK_LOADED, () => {
        audioPlayer.play(model.nextTrackOffset);
        model.nextTrackOffset = 0;
        view.setChannelLoaded(model.selectedChannelId);
        messageManager.showNowPlaying(model.track.name);
    });

    audioPlayer.on(EVENT_AUDIO_TRACK_ENDED, () => {
        loadNextFromPlaylist();
    });

    view.on(EVENT_CHANNEL_BUTTON_CLICK, event => {
        const channelId = event.data;

        if (channelId === model.selectedChannelId) {
            model.selectedChannelId = null;
            model.playlist = null;
            model.track = null;

            audioPlayer.stop();

            view.setNoChannelSelected();
            messageManager.showSelectChannel();

        } else {
            model.track = null;
            model.playlist = null;
            model.selectedChannelId = channelId;

            view.setChannelLoading(channelId);
            const channel = model.getChannelFromId(channelId);
            messageManager.showTuningInToChannel(channel.name);

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

    messageManager.on(EVENT_NEW_MESSAGE, event => {
        const {text, isTemp} = event.data;
        view.showMessage(text, isTemp);
    });

    messageManager.showLoadingChannels();
    service.getChannels().then(channelIds => {
        model.channels = channelIds.map(channelId => {
            return {
                id: channelId,
                name: channelId,
                userChannel: false
            };
        });
        view.setChannels(model.channels);
        messageManager.showSelectChannel();
    });

    setInterval(() => {
        messageManager.showTempMessage();
    }, 10000)

};
