window.onload = () => {
    const model = {},

        playlistManager = (() => {
            "use strict";
            let currentChannelId, playlistForCurrentChannel;

            function shiftPlaylist(includeOffset = false) {
                const nextItem = playlistForCurrentChannel.list.shift();

                return {
                    url: nextItem.url,
                    name: nextItem.name,
                    offset: includeOffset ? playlistForCurrentChannel.initialOffset : 0
                };
            }

            return {
                setChannel(channelId) {
                    currentChannelId = channelId;
                },
                getNext(channelId) {
                    if (channelId === currentChannelId) {
                        if (playlistForCurrentChannel.list.length === 0) {
                            return service.getPlaylistForChannel(channelId, true).then(playlist => {
                                playlistForCurrentChannel = playlist;

                                return shiftPlaylist();
                            });

                        } else {
                            return Promise.resolve(shiftPlaylist());
                        }

                    } else {
                        currentChannelId = channelId;
                        return service.getPlaylistForChannel(channelId).then(playlist => {
                            playlistForCurrentChannel = playlist;

                            return shiftPlaylist(true);
                        });
                    }
                }
            };
        })();

    view.init(model);
    audioPlayer.init();
    view.setVisualisationDataSource(audioPlayer.getData);
    visualiser.init(view.getCanvas());
    window.resize = visualiser.onResize;

    function playNextFromCurrentChannel() {
        "use strict";
        return playlistManager.getNext(model.channel)
            .then(nextItem => {
                const {url, offset} = nextItem;
                return audioPlayer.load(url, offset)
                    .then(() => {
                        audioPlayer.play();
                        return nextItem;
                    })
                    .catch(err => alert(err));
            });
    }


    view.onChannelSelected(channelId => {
        "use strict";
        model.track = null;
        model.channel = channelId;
        view.updatePlayState(model);
        playNextFromCurrentChannel().then(nowPlaying => {
            model.track = nowPlaying.name;
            view.updatePlayState(model);
        });
        audioPlayer.play();
    });

    view.onChannelDeselected(() => {
        "use strict";
        model.channel = model.track = null;
        audioPlayer.stop();
        playlistManager.setChannel();
        view.updatePlayState(model);
    });

    audioPlayer.onAudioEnded(() => {
        "use strict";
        playNextFromCurrentChannel().then(() => {
            view.updatePlayState(model);
        });
    });

    service.getChannels().then(channels => {
        "use strict";
        view.setChannels(model.channels = channels);
    });

};
