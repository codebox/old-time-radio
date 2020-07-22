window.onload = () => {
    const model = {},
        audioPlayer = (() => {
            "use strict";
            const audio = new Audio(),
                VOLUME_NORMAL = 1,
                VOLUME_MUTED = 0;

            let onAudioEndedHandler = () => {};

            return {
                load(url, offset = 0) {
                    return new Promise((onLoaded, onError) => {
                        function removeHandlers() {
                            audio.removeEventListener('canplay', onAudioLoaded);
                            audio.removeEventListener('err', onAudioLoaded);
                        }

                        function onAudioLoaded() {
                            removeHandlers();
                            onLoaded();
                        }
                        function onAudioError() {
                            removeHandlers();
                            onError();
                        }

                        audio.addEventListener('canplay', onAudioLoaded);
                        audio.addEventListener('error', onAudioError);

                        audio.src = url;
                        audio.currentTime = offset;
                    });
                },
                onAudioEnded(handler) {
                    audio.removeEventListener('ended', onAudioEndedHandler);
                    audio.addEventListener('ended', onAudioEndedHandler = handler);
                },
                play() {
                    audio.volume = VOLUME_NORMAL;
                    audio.play();
                },
                mute() {
                    audio.volume = VOLUME_MUTED;
                },
                unmute() {
                    audio.volume = VOLUME_NORMAL;
                }
            };
        })(),
        playlistManager = (() => {
            "use strict";
            let currentChannelId, playlistForCurrentChannel;

            return {
                getNext(channelId) {
                    if (channelId === currentChannelId) {
                        if (playlistForCurrentChannel.list.length === 0) {
                            return service.getPlaylistForChannel(channelId, true).then(playlist => {
                                playlistForCurrentChannel = playlist;

                                return {
                                    url: playlist.list.shift().url,
                                    offset: 0
                                };
                            });
                        } else {
                            return {
                                url: playlist.list.shift().url,
                                offset: 0
                            };
                        }
                    } else {
                        currentChannelId = channelId;
                        return service.getPlaylistForChannel(channelId).then(playlist => {
                            playlistForCurrentChannel = playlist;

                            return {
                                url: playlist.list.shift().url,
                                offset: playlist.initialOffset
                            };
                        });
                    }
                }
            };
        })();

    view.init();

    function playNextFromCurrentChannel() {
        "use strict";
        playlistManager.getNext(model.channel)
            .then(nextItem => {
                const {url, offset} = nextItem;
                audioPlayer.load(url, offset)
                    .then(audioPlayer.play())
                    .catch(err => console.error(err));
            });
    }


    view.onChannelSelected(channelId => {
        "use strict";
        view.setChannelLoading(model.channel = channelId);
        playNextFromCurrentChannel();
    });

    audioPlayer.onAudioEnded(() => {
        "use strict";
        playNextFromCurrentChannel();
    });

    service.getChannels().then(channels => {
        "use strict";
        view.setChannels(model.channels = channels);
    });


};
