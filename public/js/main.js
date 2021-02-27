window.onload = () => {
    const model = {};

    model2.load();
    view.init(model);

    view.setVisualisationDataSource(audioPlayer.getData);
    visualiser.init(view.getCanvas());
    window.addEventListener('resize', visualiser.onResize());
    playlist.init(model);


    function playNextFromCurrentChannel(onErrorRetryDelayMillis=0) {
        return playlist.getNext()
            .then(nextItem => {
                const {url, name, offset} = nextItem;
                model.track = {name, url};

                return audioPlayer.load(url, offset)
                    .then(() => {
                        audioPlayer.play();
                        view.updatePlayState(model);
                    })
                    .catch(() => {
                        setTimeout(() => {
                            const delay = Math.min(onErrorRetryDelayMillis * 2 || 1000, 10000);
                            playNextFromCurrentChannel(delay)
                        }, onErrorRetryDelayMillis);
                    })
            });
    }

    view.on('channelButtonClick', event => {
        "use strict";
        const channel = event.data;
        if (channel) {
            model.track = null;
            model.playlist = null;
            model2.channel = channel;
            view.updatePlayState(model);
            visualiser.activate();
            playNextFromCurrentChannel();
            audioPlayer.play();
        } else {
            deselectChannel();
        }
    });

    function deselectChannel() {
        "use strict";
        model.track = model2.channel = model.playlist = null;
        audioPlayer.stop();
        view.updatePlayState(model);
        setTimeout(() => {
            visualiser.deactivate();
        }, 2000);
    }

    sleepTimer.onSleep(() => {
        "use strict";
        model.sleeping = true;
        view.sleep();
        messageManager.updateStatus();
        const interval = setInterval(() => {
            if (model.sleeping) {
                const volume = audioPlayer.adjustVolume(0.99);
                if (volume < 0.01) {
                    deselectChannel();
                    clearInterval(interval);
                }
            } else {
                clearInterval(interval);
            }
        }, 100);
    });
    sleepTimer.onTick(secondsRemaining => {
        "use strict";
        view.updateSleepTimer(secondsRemaining);
    });

    const scheduleRefreshIntervalSeconds = 5,
        clock = (() => {
        "use strict";
        let channelScheduleUpdaterInterval;

        return {
            startChannelScheduleUpdater(callback) {
                if (!channelScheduleUpdaterInterval) {
                    channelScheduleUpdaterInterval = setInterval(callback, scheduleRefreshIntervalSeconds * 1000);
                }
            },
            stopChannelScheduleUpdater() {
                if (channelScheduleUpdaterInterval) {
                    clearInterval(channelScheduleUpdaterInterval);
                    channelScheduleUpdaterInterval = null;
                }
            }
        };
    })();

    function refreshChannelSchedule() {
        "use strict";
        const channelId = model2.selectedScheduleChannel;
        if (channelId) {
            service.getPlaylistForChannel(channelId, 12 * 60 * 60).then(schedule => {
                model2.setChannelSchedule(channelId, schedule);
                if (channelId === model2.selectedScheduleChannel) {
                    view.displaySchedule(schedule);
                }
            });
        }
    }

    view.on('scheduleButtonClick', event => {
        "use strict";
        const channelId = event.data,
            selectedChannelWasClicked = model2.selectedScheduleChannel === channelId;

        // clicking the channel that was already selected should de-select it, leaving no channel selected
        const selectedChannel = selectedChannelWasClicked ? null : channelId;
        model2.selectedScheduleChannel = selectedChannel;
        view.updateScheduleChannelSelection(selectedChannel);

        if (selectedChannel) {
            const lastScheduleDetails = model2.getChannelSchedule(channelId);
            if (lastScheduleDetails && lastScheduleDetails.ageInSeconds < scheduleRefreshIntervalSeconds) {
                view.displaySchedule(lastScheduleDetails.schedule);
            } else {
                refreshChannelSchedule();
            }
            clock.startChannelScheduleUpdater(refreshChannelSchedule);

        } else {
            view.hideSchedule();
            clock.stopChannelScheduleUpdater();
        }
    });

    view.on('menuOpenClick', () => {
        "use strict";
        if (model2.channel) {
            model2.selectedScheduleChannel = model2.channel.id;
            view.updateScheduleChannelSelection(model2.channel.id);
            refreshChannelSchedule();
            clock.startChannelScheduleUpdater(refreshChannelSchedule);
        } else {
            view.updateScheduleChannelSelection();
            view.hideSchedule();
        }
        view.openMenu();
    });
    view.on('menuCloseClick', () => {
        "use strict";
        clock.stopChannelScheduleUpdater();
        view.closeMenu();
    });

    function afterVolumeChange() {
        "use strict";
        view.updateVolume();
        model2.save();
        audioPlayer.updateVolume();
    }
    view.on('volumeUpClick', () => {
        "use strict";
        model2.volume++;
        afterVolumeChange();
    });
    view.on('volumeDownClick', () => {
        "use strict";
        model2.volume--;
        afterVolumeChange();
    });

    view.on('setSleepTimerClick', event => {
        "use strict";
        const minutes = event.data;
        sleepTimer.start(minutes);
        view.setSleepTimerRunning(true);
    });
    view.on('cancelSleepTimerClick', () => {
        "use strict";
        sleepTimer.stop();
        view.setSleepTimerRunning(false);
    });
    view.on('wake', () => {
        "use strict";
        model.sleeping = false;
        messageManager.updateStatus();
        audioPlayer.updateVolume();
        view.wakeUp();
    });

    channelBuilder.onChannelRequested(showIndexes => {
        "use strict";
         return service.getChannelCodeForShows(showIndexes);
    });

    audioPlayer.onAudioEnded(() => {
        "use strict";
        playNextFromCurrentChannel();
    });

    const urlChannelCodes = new URLSearchParams(window.location.search).get('channels');
    if (urlChannelCodes) {
        model.channels = urlChannelCodes.split(',').map((code, i) => {
            "use strict";
            return {
                id: code,
                name: `Channel ${i+1}`,
                userChannel: true
            };
        });
        view.setChannels(model.channels);

    } else {
        service.getChannels().then(channelIds => {
            "use strict";
            model.channels = channelIds;
            view.setChannels(channelIds.map(channelId => {
                return {
                    id: channelId,
                    name: channelId,
                    userChannel: false
                };
            }));
        }).catch(err => messageManager.httpError());
    }

    service.getShowList().then(shows => {
        channelBuilder.populate(model.shows = shows);
    });
};
