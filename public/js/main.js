window.onload = () => {
    "use strict";

    const model = buildModel(),
        view = buildView(),
        service = buildService(),
        audioPlayer = buildAudioPlayer(model.maxVolume),
        visualiser = buildVisualiser(audioPlayer.getData),
        messageManager = buildMessageManager(model),
        sleepTimer = buildSleepTimer(),
        stateMachine = buildStateMachine();

    function loadNextFromPlaylist() {
        if (model.playlist && model.playlist.length) {
            stateMachine.trackRequested();

        } else {
            service.getPlaylistForChannel(model.selectedChannelId).then(playlist => {
                model.playlist = playlist.list;
                model.nextTrackOffset = playlist.initialOffset;
                stateMachine.playlistSuccess();

            }).catch(err => {
                console.error(err);
                stateMachine.playlistFailure();
            });
        }
    }

    // Message Manager event handler
    messageManager.on(EVENT_NEW_MESSAGE, event => {
        const {text} = event.data;
        view.showMessage(text);
    });

    // Audio Player event handlers
    audioPlayer.on(EVENT_AUDIO_TRACK_LOADED, () => {
        stateMachine.trackLoadSuccess();
    });

    audioPlayer.on(EVENT_AUDIO_PLAY_STARTED, () => {
        view.setChannelLoaded(model.selectedChannelId);
        messageManager.showNowPlaying(model.track.name);
    });

    audioPlayer.on(EVENT_AUDIO_TRACK_ENDED, () => {
        loadNextFromPlaylist();
    });

    audioPlayer.on(EVENT_AUDIO_ERROR, () => {
        stateMachine.trackLoadFailure();
    });

    // Sleep Timer event handlers
    sleepTimer.on(EVENT_SLEEP_TIMER_TICK, event => {
        const secondsLeft = event.data;
        view.updateSleepTimer(secondsLeft);
    });

    sleepTimer.on(EVENT_SLEEP_TIMER_DONE, () => {
        stateMachine.sleepTimerTriggers();
    });

    // View event handlers
    view.on(EVENT_CHANNEL_BUTTON_CLICK, event => {
        const channelId = event.data;

        if (channelId === model.selectedChannelId) {
            model.selectedChannelId = null;
            stateMachine.userDeselectsChannel();

        } else {
            model.selectedChannelId = channelId;
            stateMachine.userSelectsNewChannel();
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
        model.save();
    }

    view.on(EVENT_VOLUME_UP_CLICK, () => {
        model.volume++;
        applyModelVolume();
    });

    view.on(EVENT_VOLUME_DOWN_CLICK, () => {
        model.volume--;
        applyModelVolume();
    });

    const tempMessageTimer = (() => {
        let interval;

        return {
            start(){
                if (!interval) {
                    interval = setInterval(() => {
                        messageManager.showTempMessage();
                    }, config.messages.tempMessageIntervalMillis);
                }
            },
            stop() {
                if (interval) {
                    clearInterval(interval);
                }
            }
        }
    })();

    view.on(EVENT_SET_SLEEP_TIMER_CLICK, event => {
        const minutes = event.data;
        sleepTimer.start(minutes);
        view.startSleepTimer();
    });

    view.on(EVENT_CANCEL_SLEEP_TIMER_CLICK, () => {
        sleepTimer.stop();
        view.clearSleepTimer();
    });

    view.on(EVENT_WAKE_UP, () => {
        audioPlayer.setVolume(model.volume);
        view.wakeUp();
        stateMachine.wakeAction();
    });

    const scheduleRefresher = (() => {
        let interval;

        const refresher = {
            start() {
                this.refreshNow();
                if (!interval) {
                    interval = setInterval(() => {
                        refresher.refreshNow();
                    }, config.schedule.refreshIntervalMillis);
                }
            },
            refreshNow() {
                const channelId = model.selectedScheduleChannelId;
                service.getPlaylistForChannel(channelId, config.schedule.lengthInSeconds).then(schedule => {
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

    view.on(EVENT_STATION_BUILDER_SHOW_CLICK, event => {
        const clickedShow = event.data;
        model.stationBuilder.shows.filter(show => show.index === clickedShow.index).forEach(show => show.selected = !show.selected);
        view.updateStationBuilderShowSelections(model.stationBuilder);
    });

    view.on(EVENT_STATION_BUILDER_PLAY_COMMERCIALS_CLICK, () => {
        const includeCommercials = !model.stationBuilder.includeCommercials;
        model.stationBuilder.includeCommercials = includeCommercials;
        view.updateStationBuilderIncludeCommercials(model.stationBuilder);
    });

    view.on(EVENT_STATION_BUILDER_CREATE_CHANNEL_CLICK, () => {
        const selectedShowIndexes = model.stationBuilder.shows.filter(show => show.selected).map(show => show.index);
        if (model.stationBuilder.includeCommercials) {
            selectedShowIndexes.push(...model.stationBuilder.commercialShowIds);
        }

        model.stationBuilder.shows.forEach(show => show.selected = false);
        view.updateStationBuilderShowSelections(model.stationBuilder);

        service.getChannelCodeForShows(selectedShowIndexes).then(channelCode => {
            model.stationBuilder.savedChannelCodes.push(channelCode);
            view.updateStationBuilderStationDetails(model.stationBuilder);
        });
    });

    view.on(EVENT_STATION_BUILDER_GO_TO_CHANNEL_CLICK, () => {
        window.location.href = `?channels=${model.stationBuilder.savedChannelCodes.join(',')}`;
    });

    view.on(EVENT_STATION_BUILDER_ADD_CHANNEL_CLICK, () => {
        view.addAnotherStationBuilderChannel();
    });

    view.on(EVENT_STATION_BUILDER_DELETE_STATION_CLICK, () => {
        model.stationBuilder.savedChannelCodes.length = 0;
        view.updateStationBuilderStationDetails(model.stationBuilder);
    });

    function getChannels() {
        messageManager.showLoadingChannels();

        const urlChannelCodes = new URLSearchParams(window.location.search).get('channels');
        if (urlChannelCodes) {
            const channels = urlChannelCodes.split(',').map((code, i) => {
                return {
                    id: code,
                    name: `Channel ${i + 1}`,
                    userChannel: true
                };
            });
            return Promise.resolve(channels);

        } else {
            return service.getChannels().then(channelIds => {
                return channelIds.map(channelId => {
                    return {
                        id: channelId,
                        name: channelId,
                        userChannel: false
                    };
                });
            });
        }
    }

    // State Machine event handlers
    stateMachine.on(EVENT_STATE_CHANGED_TO_INITIALISING, () => {
        applyModelVolume();
        view.setVisualiser(visualiser);

        getChannels().then(channels => {
            model.channels = channels;
            view.setChannels(model.channels);

        }).then(() => {
            service.getShowList().then(shows => {
                model.stationBuilder.shows = [...shows.filter(show => !show.isCommercial).map(show => {
                    return {
                        index: show.index,
                        name: show.name,
                        selected: false,
                        channels: show.channels
                    };
                })];
                model.stationBuilder.commercialShowIds.push(...shows.filter(show => show.isCommercial).map(show => show.index));

                view.populateStationBuilderShows(model.stationBuilder);
                tempMessageTimer.start();

                stateMachine.channelListSuccess();
            });

        }).catch(err => {
            model.lastError = err;
            stateMachine.channelListFailure();
        });
    });

    stateMachine.on(EVENT_STATE_CHANGED_TO_IDLE, () => {
        model.selectedChannelId = null;
        model.playlist = null;
        model.track = null;
        model.nextTrackOffset = null;

        audioPlayer.stop();

        view.setNoChannelSelected();
        view.hideDownloadLink();
        visualiser.stop(config.visualiser.fadeOutIntervalMillis);

        messageManager.showSelectChannel();
    });

    stateMachine.on(EVENT_STATE_CHANGED_TO_TUNING_IN, () => {
        console.assert(model.selectedChannelId);
        model.playlist = null;
        model.track = null;
        model.nextTrackOffset = null;

        view.setChannelLoading(model.selectedChannelId);
        const channel = model.channels.find(channel => channel.id === model.selectedChannelId);
        messageManager.showTuningInToChannel(channel.name);

        loadNextFromPlaylist();
    });

    stateMachine.on(EVENT_STATE_CHANGED_TO_TUNED_IN_IDLE, () => {

    });

    stateMachine.on(EVENT_STATE_CHANGED_TO_LOADING_TRACK, () => {
        const nextItem = model.playlist.shift();
        model.track = nextItem;
        stateMachine.trackRequested();
        audioPlayer.load(nextItem.url);
    });

    stateMachine.on(EVENT_STATE_CHANGED_TO_PLAYING, () => {
        visualiser.start();
        audioPlayer.play(model.nextTrackOffset);
        model.nextTrackOffset = 0;
        view.showDownloadLink(model.track.url);
    });

    stateMachine.on(EVENT_STATE_CHANGED_TO_GOING_TO_SLEEP, () => {
        view.sleep();
        tempMessageTimer.stop();

        const interval = setInterval(() => {
            if (stateMachine.isSleeping()) {
                const newVolume = audioPlayer.getVolume() - config.sleepTimer.fadeOutDelta;
                if (newVolume > 0) {
                    audioPlayer.setVolume(newVolume);
                } else {
                    clearInterval(interval);
                    stateMachine.goingToSleepComplete();
                }
            } else {
                clearInterval(interval);
                // wake event received before timer completes
                audioPlayer.setVolume(model.volume);
            }
        }, config.sleepTimer.fadeOutIntervalMillis);
    });

    stateMachine.on(EVENT_STATE_CHANGED_TO_SLEEPING, () => {
        view.sleep();
        audioPlayer.stop();
        model.selectedChannelId = model.track = model.playlist = null;
        tempMessageTimer.stop();
        messageManager.showSleeping();
        visualiser.stop();
        scheduleRefresher.stop();
    });

    stateMachine.on(EVENT_STATE_CHANGED_TO_ERROR, () => {
        model.selectedChannelId = model.playlist = model.track = null;
        audioPlayer.stop();
        visualiser.stop();
        tempMessageTimer.stop();
        scheduleRefresher.stop();
        view.showError(model.lastError);
        messageManager.httpError();
    });

    stateMachine.on(EVENT_STATE_CHANGED_TO_INITIALISING, () => {
        console.assert(!model.channels);
    });

    stateMachine.initialise();
};
