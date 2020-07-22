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
            const channelPlaylists = {}, LOW_CHANNEL_THRESHOLD_SECONDS = 30 * 60;

            function isChannelLow(channelId) {
                const lengthRemaining = channelPlaylists[channelId].list.reduce((a,c) => a + c.length, -channelPlaylists[channelId].initialOffset);
                return lengthRemaining < LOW_CHANNEL_THRESHOLD_SECONDS;
            }

            function getItemAndOffsetForNow(playlist, nearestStart) {
                const now = Date.now();

                let playTime = playlist.loadTime, i = 0;
                while (true) {
                    const nextItem = playlist.list[i];
                    if (playTime + nextItem.length > now) {
                        if (nearestStart) {
                            if (now - playTime < nextItem.length / 2) {
                                return {
                                    url: nextItem.url,
                                    offset: 0
                                };
                            } else {
                                return {
                                    url: playlist.list[i+1].url,
                                    offset: 0
                                };
                            }
                        } else {
                            return {
                                url: nextItem.url,
                                offset: now - playTime
                            };
                        }
                    }
                }
            }

            return {
                getNext(channelId, nearestStart = false) {
                    if (! (channelId in channelPlaylists)) {
                        return service.getPlaylistForChannel(channelId).then(playlist => {
                            playlist.loadTime = Date.now();
                            channelPlaylists[channelId] = playlist;

                            return getItemAndOffsetForNow(channelId, nearestStart);
                        });

                    } else {
                        const playlist = channelPlaylists[channelId];
                        if (isChannelLow(channelId)) {
                            service.getPlaylistForChannel(channelId, true).then(newPlaylist => {
                                const urlsWeAlreadyHave = new Set(playlist.list.map(o => o.url));

                                newPlaylist.list.forEach(item => {
                                    if (!urlsWeAlreadyHave.has(item.url)) {
                                        playlist.list.push(item);
                                    }
                                });
                            });
                        }

                        Promise.resolve(getItemAndOffsetForNow(channelId, nearestStart));
                    }
                }
            };
        })();

    view.init();

    // function playNextFromCurrentChannel() {
    //     "use strict";
    //     playlistManager.getNext(model.channel)
    //         .then(nextItem => {
    //             const {url, offset} = nextItem;
    //             audioPlayer.load(url, offset)
    //                 .then(audioPlayer.play())
    //                 .catch(err => console.error(err));
    //         });
    // }

    function startPlayingCurrentChannel() {
        "use strict";

    }

    function playNextFromCurrentChannel() {
        "use strict";

    }

    view.onChannelSelected(channelId => {
        "use strict";
        view.setChannelLoading(model.channel = channelId);
        startPlayingCurrentChannel();
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
