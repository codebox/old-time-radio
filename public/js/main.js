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
                stop() {
                    audio.pause();
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

    view.init();

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
                    .catch(err => console.error(err));
            });
    }


    view.onChannelSelected(channelId => {
        "use strict";
        if (channelId === model.channel) {
            model.channel = null;
            audioPlayer.stop();
            playlistManager.setChannel();
            view.setNoChannelPlaying();

        } else {
            view.setChannelLoading(model.channel = channelId);
            playNextFromCurrentChannel().then(nowPlaying => {
                console.log(nowPlaying.name)
                view.setChannelPlaying(channelId, nowPlaying.name);
            });
        }
    });

    audioPlayer.onAudioEnded(() => {
        "use strict";
        playNextFromCurrentChannel().then(nowPlaying => {
            view.setChannelPlaying(channelId, nowPlaying.name);
        });
    });

    service.getChannels().then(channels => {
        "use strict";
        view.setChannels(model.channels = channels);
    });


};
