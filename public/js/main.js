window.onload = () => {
    "use strict";

    const model = buildModel(),
        view = buildView(),
        service = buildService(),
        audioPlayer = buildAudioPlayer(model.maxVolume),
        messageManager = buildMessageManager(model),
        sleepTimer = buildSleepTimer();

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

    function deselectChannel() {
        model.selectedChannelId = null;
        model.playlist = null;
        model.track = null;

        audioPlayer.stop();

        view.setNoChannelSelected();
    }

    view.on(EVENT_CHANNEL_BUTTON_CLICK, event => {
        const channelId = event.data;

        if (channelId === model.selectedChannelId) {
            deselectChannel();
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
        if (model.selectedChannelId) {
            model.selectedScheduleChannelId = model.selectedChannelId;
            view.updateScheduleChannelSelection(model.selectedScheduleChannelId);
            scheduleRefresher.start();
        }
    });

    view.on(EVENT_MENU_CLOSE_CLICK, () => {
        view.closeMenu();
        model.selectedScheduleChannelId = null;
        view.updateScheduleChannelSelection();
        view.hideSchedule();
        scheduleRefresher.stop();
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
        const {text} = event.data;
        view.showMessage(text);
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
        if (!model.sleeping) {
            messageManager.showTempMessage();
        }
    }, 10000)

    view.on(EVENT_SET_SLEEP_TIMER_CLICK, event => {
        const minutes = event.data;
        sleepTimer.start(minutes);
        view.startSleepTimer();
    });

    view.on(EVENT_CANCEL_SLEEP_TIMER_CLICK, () => {
        sleepTimer.stop();
        view.clearSleepTimer();
    });

    sleepTimer.on(EVENT_SLEEP_TIMER_TICK, event => {
        const secondsLeft = event.data;
        view.updateSleepTimer(secondsLeft);
    });

    sleepTimer.on(EVENT_SLEEP_TIMER_DONE, () => {
        model.sleeping = true;
        messageManager.showSleeping();
        view.sleep();
        const interval = setInterval(() => {
            if (model.sleeping) {
                const newVolume = audioPlayer.getVolume() - 0.02;
                if (newVolume > 0) {
                    audioPlayer.setVolume(newVolume);
                } else {
                    deselectChannel();
                    clearInterval(interval);
                }
            } else {
                clearInterval(interval);
            }
        }, 100);
    });

    view.on(EVENT_WAKE_UP, () => {
        model.sleeping = false;
        audioPlayer.setVolume(model.volume);
        view.wakeUp();
    });

    const scheduleRefresher = (() => {
        const REFRESH_INTERVAL_SECONDS = 5;

        let interval;

        const refresher = {
            start() {
                refresher.refreshNow();
                if (!interval) {
                    interval = setInterval(() => {
                        refresher.refreshNow();
                    }, REFRESH_INTERVAL_SECONDS * 1000);
                }
            },
            refreshNow() {
                const channelId = model.selectedScheduleChannelId;
                service.getPlaylistForChannel(channelId, 12 * 60 * 60).then(schedule => {
                    if (channelId === model.selectedScheduleChannelId) {
                        view.displaySchedule(schedule);
                    }
                });
            },
            stop() {
                if (interval) {
                    clearInterval(interval);
                    interval = null;
                }
            }
        };
        return refresher;
    })();

    view.on(EVENT_SCHEDULE_BUTTON_CLICK, event => {
        const channelId = event.data,
            selectedChannelWasClicked = model.selectedScheduleChannelId === channelId;

        // clicking the channel that was already selected should de-select it, leaving no channel selected
        const selectedChannel = selectedChannelWasClicked ? null : channelId;
        model.selectedScheduleChannelId = selectedChannel;
        view.updateScheduleChannelSelection(selectedChannel);

        if (selectedChannel) {
            scheduleRefresher.start();

        } else {
            view.hideSchedule();
            scheduleRefresher.stop();
        }
    });
};
