window.onload = () => {
    "use strict";

    const model = buildModel(),
        stateMachine = buildStateMachine(),
        view = buildView(eventSource('view'), model),
        service = buildService(),
        audioPlayer = buildAudioPlayer(model.maxVolume, eventSource('audio')),
        visualiserDataFactory = buildVisualiserDataFactory(audioPlayer.getData),
        visualiser = buildVisualiser(visualiserDataFactory),
        messageManager = buildMessageManager(model, eventSource('msg')),
        sleepTimer = buildSleepTimer(eventSource('sleep'));

    function eventSource(name) {
        return buildEventSource(name, stateMachine);
    }

    function onError(error) {
        console.error(error);
        stateMachine.error();
        model.selectedChannelId = model.playlist = model.track = null;
        audioPlayer.stop();
        visualiser.stop();
        tempMessageTimer.stop();
        scheduleRefresher.stop();
        playingNowTimer.stop();
        view.setNoChannelSelected();
        view.hideDownloadLink();
        view.showError(error);
        startSnowMachineIfAppropriate();
        messageManager.showError();
    }

    function startSnowMachineIfAppropriate() {
        function getSnowIntensityForToday(day, month) {
            if (month === 11) {
                if (day <= 25) {
                    return 1 - (25 - day) / 25;
                } else {
                    return (32 - day) / 7;
                }
            }
        }
        const today = new Date(),
            snowIntensity = getSnowIntensityForToday(today.getDate(), today.getMonth());
        if (snowIntensity) {
            view.startSnowMachine(snowIntensity);
        }
    }

    function loadNextFromPlaylist() {
        function playNextFromPlaylist() {
            const nextItem = model.playlist.shift();
            model.track = nextItem;
            audioPlayer.load(nextItem.urls);
            stateMachine.loadingTrack();
        }

        if (model.playlist && model.playlist.length) {
            playNextFromPlaylist();

        } else {
            playingNowTimer.stop();
            stateMachine.tuningIn();
            service.getPlaylistForChannel(model.selectedChannelId).then(playlist => {
                model.playlist = playlist.list;
                model.nextTrackOffset = playlist.initialOffset;
                playNextFromPlaylist();

            }).catch(onError);
        }
    }

    // Message Manager event handler
    messageManager.on(EVENT_NEW_MESSAGE).then(event => {
        const {text} = event.data;
        view.showMessage(text);
    });

    // Audio Player event handlers
    audioPlayer.on(EVENT_AUDIO_TRACK_LOADED).ifState(STATE_LOADING_TRACK).then(() => {
        view.stopSnowMachine();
        visualiser.start();
        audioPlayer.play(model.nextTrackOffset);
        model.nextTrackOffset = 0;
        view.showDownloadLink(model.track.archivalUrl);
    });

    audioPlayer.on(EVENT_AUDIO_PLAY_STARTED).ifState(STATE_LOADING_TRACK).then(() => {
        stateMachine.playing();
        view.setChannelLoaded(model.selectedChannelId);
        messageManager.showNowPlaying(model.track.name);
    });

    audioPlayer.on(EVENT_AUDIO_TRACK_ENDED).ifState(STATE_PLAYING).then(() => {
        loadNextFromPlaylist();
    });

    audioPlayer.on(EVENT_AUDIO_ERROR).ifState(STATE_LOADING_TRACK).then(event => {
        onError(event.data);
    });

    // Sleep Timer event handlers
    sleepTimer.on(EVENT_SLEEP_TIMER_TICK).then(event => {
        const secondsLeft = event.data;
        view.updateSleepTimer(secondsLeft);
    });

    sleepTimer.on(EVENT_SLEEP_TIMER_DONE).ifState(STATE_PLAYING).then(() => {
        view.sleep();
        tempMessageTimer.stop();
        messageManager.showSleeping();
        scheduleRefresher.stop();

        const interval = setInterval(() => {
            if (stateMachine.state === STATE_GOING_TO_SLEEP) {
                const newVolume = audioPlayer.getVolume() - config.sleepTimer.fadeOutDelta;
                if (newVolume > 0) {
                    audioPlayer.setVolume(newVolume);
                } else {
                    model.selectedChannelId = model.track = model.playlist = null;
                    audioPlayer.stop();
                    visualiser.stop();
                    view.hideDownloadLink();
                    view.setNoChannelSelected();
                    stateMachine.sleeping();
                }
            } else {
                clearInterval(interval);
            }
        }, config.sleepTimer.fadeOutIntervalMillis);

        stateMachine.goingToSleep();
    });

    sleepTimer.on(EVENT_SLEEP_TIMER_DONE).ifState(STATE_IDLE, STATE_TUNING_IN, STATE_LOADING_TRACK, STATE_ERROR).then(() => {
        view.sleep();
        view.stopSnowMachine();
        model.selectedChannelId = model.track = model.playlist = null;
        view.setNoChannelSelected();
        view.hideDownloadLink();
        tempMessageTimer.stop();
        messageManager.showSleeping();
        visualiser.stop();
        playingNowTimer.stop();
        scheduleRefresher.stop();

        stateMachine.sleeping();
    });

    // View event handlers
    view.on(EVENT_CHANNEL_BUTTON_CLICK).then(event => {
        const channelId = event.data;

        if (channelId === model.selectedChannelId) {
            model.selectedChannelId = model.playlist = model.track = model.nextTrackOffset = null;

            audioPlayer.stop();

            view.setNoChannelSelected();
            view.hideDownloadLink();
            visualiser.stop(config.visualiser.fadeOutIntervalMillis);
            startSnowMachineIfAppropriate();
            playingNowTimer.startIfApplicable();

            messageManager.showSelectChannel();

            stateMachine.idle();

        } else {
            model.selectedChannelId = channelId;
            model.playlist = model.track = model.nextTrackOffset = null;

            view.setChannelLoading(model.selectedChannelId);
            const channel = model.channels.find(channel => channel.id === model.selectedChannelId);
            messageManager.showTuningInToChannel(channel.name);
            view.hideDownloadLink();

            /* Hack to make iOS web audio work, starting around iOS 15.5 browsers refuse to play media loaded from
            within an AJAX event handler (such as loadNextFromPlaylist -> service.getPlaylistForChannel) but if we load
            something (anything) outside the callback without playing it, then subsequent load/plays from within the
            callback all work - Godammit Safari */
            audioPlayer.load('silence.mp3');

            loadNextFromPlaylist();
        }
    });

    view.on(EVENT_MENU_OPEN_CLICK).then(() => {
        view.openMenu();
        if (model.selectedChannelId) {
            model.selectedScheduleChannelId = model.selectedChannelId;
            view.updateScheduleChannelSelection(model.selectedScheduleChannelId);
            scheduleRefresher.start();
        }
    });

    view.on(EVENT_MENU_CLOSE_CLICK).then(() => {
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

    function applyModelPrefs() {
        view.updatePrefInfoMessages(model.showInfoMessages);
        view.updatePrefNowPlayingMessages(model.showNowPlayingMessages);
        model.save();
    }

    function applyModelVisualiser() {
        view.updateVisualiserId(model.visualiserId);
        visualiser.setVisualiserId(model.visualiserId);
        model.save();
    }

    view.on(EVENT_VOLUME_UP_CLICK).then(() => {
        model.volume++;
        applyModelVolume();
    });

    view.on(EVENT_VOLUME_DOWN_CLICK).then(() => {
        model.volume--;
        applyModelVolume();
    });

    view.on(EVENT_PREF_INFO_MESSAGES_CLICK).then(() => {
        if (model.showInfoMessages = !model.showInfoMessages) {
            tempMessageTimer.startIfApplicable();
        } else {
            tempMessageTimer.stop();
        }

        applyModelPrefs();
    });

    view.on(EVENT_PREF_NOW_PLAYING_CLICK).then(() => {
        if (model.showNowPlayingMessages = !model.showNowPlayingMessages) {
            playingNowTimer.startIfApplicable();
        } else {
            playingNowTimer.stop();
        }

        applyModelPrefs();
    });

    const tempMessageTimer = (() => {
        let interval;

        return {
            startIfApplicable(){
                if (!interval && model.showInfoMessages) {
                    interval = setInterval(() => {
                        messageManager.showTempMessage();
                    }, config.messages.tempMessageIntervalMillis);
                }
            },
            stop() {
                if (interval) {
                    clearInterval(interval);
                    interval = null;
                }
            }
        }
    })();

    const playingNowTimer = (() => {
        let timerId, channelIds;

        function updatePlayingNowDetails() {
            service.getPlayingNow(channelIds).then(playingNow => {
                if (playingNow) {
                    view.updatePlayingNowDetails(playingNow);
                }
            });
        }

        return {
            startIfApplicable(){
                if (!timerId && model.showNowPlayingMessages) {
                    channelIds = shuffle(model.channels.map(c => c.id));
                    if (channelIds.length > 1) {
                        // Only show 'playing now' details if there are multiple channels
                        service.getPlayingNow(channelIds).then(playingNow => {
                            view.showPlayingNowDetails(playingNow);
                            timerId = setInterval(updatePlayingNowDetails, config.playingNow.apiCallIntervalMillis);
                        });
                    }
                }
            },
            stop() {
                if (timerId) {
                    clearInterval(timerId);
                    timerId = null;
                    view.hidePlayingNowDetails();
                }
            }
        }
    })();

    view.on(EVENT_SLEEP_TIMER_CLICK).then(event => {
        const minutes = event.data;
        if (minutes === sleepTimer.getMinutesRequested()) {
            // the already-selected button has been clicked a second time, so turn it off
            sleepTimer.stop();
            view.clearSleepTimer();
        } else {
            sleepTimer.start(minutes);
            view.startSleepTimer();
        }
    });

    view.on(EVENT_WAKE_UP).ifState(STATE_GOING_TO_SLEEP).then(() => {
        view.wakeUp();
        audioPlayer.setVolume(model.volume);
        tempMessageTimer.startIfApplicable();

        messageManager.showNowPlaying(model.track.name);
        stateMachine.playing();
    });

    view.on(EVENT_WAKE_UP).ifState(STATE_SLEEPING).then(() => {
        view.wakeUp();
        startSnowMachineIfAppropriate();
        audioPlayer.setVolume(model.volume);
        tempMessageTimer.startIfApplicable();
        playingNowTimer.startIfApplicable();

        messageManager.showSelectChannel();
        stateMachine.idle();
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

    view.on(EVENT_SCHEDULE_BUTTON_CLICK).then(event => {
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

    view.on(EVENT_STATION_BUILDER_SHOW_CLICK).then(event => {
        const clickedShow = event.data;
        model.stationBuilder.shows.filter(show => show.index === clickedShow.index).forEach(show => show.selected = !show.selected);
        view.updateStationBuilderShowSelections(model.stationBuilder);
    });

    view.on(EVENT_STATION_BUILDER_PLAY_COMMERCIALS_CLICK).then(() => {
        const includeCommercials = !model.stationBuilder.includeCommercials;
        model.stationBuilder.includeCommercials = includeCommercials;
        view.updateStationBuilderIncludeCommercials(model.stationBuilder);
    });

    view.on(EVENT_STATION_BUILDER_CREATE_CHANNEL_CLICK).then(() => {
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

    view.on(EVENT_STATION_BUILDER_GO_TO_CHANNEL_CLICK).then(() => {
        window.location.href = `/?channels=${model.stationBuilder.savedChannelCodes.join(',')}`;
    });

    view.on(EVENT_STATION_BUILDER_ADD_CHANNEL_CLICK).then(() => {
        view.addAnotherStationBuilderChannel();
    });

    view.on(EVENT_STATION_BUILDER_DELETE_STATION_CLICK).then(() => {
        model.stationBuilder.savedChannelCodes.length = 0;
        view.updateStationBuilderStationDetails(model.stationBuilder);
    });

    view.on(EVENT_VISUALISER_BUTTON_CLICK).then(event => {
        const visualiserId = event.data;
        model.visualiserId = visualiserId;
        applyModelVisualiser();
    });

    function getChannels() {
        messageManager.showLoadingChannels();

        const urlChannelCodes = new URLSearchParams(window.location.search).get('channels');
        if (urlChannelCodes) {
            model.setModelUserChannels();

            const channels = urlChannelCodes.split(',').map((code, i) => {
                return {
                    id: code,
                    name: `Channel ${i + 1}`,
                    userChannel: true
                };
            });
            return Promise.resolve(channels);

        } else {
            const pathParts = window.location.pathname.split('/');
            if (pathParts[1] === 'listen-to') {
                model.setModeSingleShow();

                const descriptiveShowId = pathParts[2].toLowerCase(),
                    showObject = model.shows.find(show => show.descriptiveId === descriptiveShowId);

                view.addShowTitleToPage(showObject.name);

                return Promise.resolve([{
                    id: showObject.channelCode,
                    name: showObject.shortName,
                    userChannel: true
                }]);

            } else {
                model.setModeNormal();

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
    }

    // State Machine event handlers
    function startUp(){
        stateMachine.initialising();
        model.channels = model.selectedChannelId = model.playlist = model.track = null;

        applyModelVolume();

        view.setVisualiser(visualiser);
        view.setVisualiserIds(visualiser.getVisualiserIds());
        applyModelVisualiser();
        applyModelPrefs();

        startSnowMachineIfAppropriate();

        service.getShowList()
            .then(shows => {
                model.shows = [...shows.map(show => {
                    return {
                        index: show.index,
                        name: show.name,
                        shortName: show.shortName,
                        descriptiveId: show.descriptiveId,
                        channelCode: show.channelCode
                    };
                })];

                model.stationBuilder.shows = [...shows.filter(show => !show.isCommercial).map(show => {
                    return {
                        index: show.index,
                        name: show.name,
                        selected: false,
                        channels: show.channels
                    };
                })];

                view.populateStationBuilderShows(model.stationBuilder);

                return getChannels();
            })
            .then(channels => {
                model.channels = channels;
                view.setChannels(model.channels);
                tempMessageTimer.startIfApplicable();
                messageManager.init();
                messageManager.showSelectChannel();
                playingNowTimer.startIfApplicable();

                stateMachine.idle();
            })
            .catch(onError);
    }
    startUp();

};
