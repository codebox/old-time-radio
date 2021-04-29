function buildView(eventSource) {
    "use strict";
    const FEW_CHANNELS_LIMIT = 4,
        channelButtons = {},
        visualiserButtons = {},

        CLASS_LOADING = 'channelLoading',
        CLASS_PLAYING = 'channelPlaying',
        CLASS_ERROR = 'channelError',
        CLASS_SELECTED = 'selected',

        elMenuOpenButton = document.getElementById('menuOpenButton'),
        elMenuCloseButton = document.getElementById('menuCloseButton'),
        elMenuBox = document.getElementById('menu'),
        elVolumeUp = document.getElementById('volumeUp'),
        elVolumeDown = document.getElementById('volumeDown'),
        elMessage = document.getElementById('message'),
        elDownloadLink = document.getElementById('downloadLink'),
        elButtonContainer = document.getElementById('buttons'),
        elVolumeLeds = Array.from(Array(10).keys()).map(i => document.getElementById(`vol${i+1}`)),
        elVisualiserCanvas = document.getElementById('canvas'),
        elVisualiserButtons = document.getElementById('visualiserList'),

        sleepTimerView = buildSleepTimerView(eventSource),
        scheduleView = buildScheduleView(eventSource),
        stationBuilderView = buildStationBuilderView(eventSource);

    let visualiser;

    function forEachChannelButton(fn) {
        Object.keys(channelButtons).forEach(channelId => {
            fn(channelId, channelButtons[channelId]);
        });
    }

    function buildChannelButton(channel) {
        const channelId = channel.id,
            channelName = channel.name,
            elButtonBox = document.createElement('div');
        elButtonBox.classList.add('buttonBox');

        const elButtonIndicator = document.createElement('div'),
            elButton = document.createElement('div'),
            elButtonLabel = document.createElement('div');

        elButtonIndicator.classList.add('buttonIndicator');

        elButton.classList.add('button');
        elButtonLabel.classList.add('buttonLabel');
        elButtonLabel.innerText = channelName;

        elButton.onclick = () => {
            eventSource.trigger(EVENT_CHANNEL_BUTTON_CLICK, channelId);
        };
        elButtonBox.appendChild(elButtonIndicator);
        elButtonBox.appendChild(elButton);
        elButtonBox.appendChild(elButtonLabel);

        elButtonContainer.appendChild(elButtonBox);
        channelButtons[channelId] = elButtonBox;
    }

    function buildVisualiserButton(id) {
        const li = document.createElement('li');
        li.innerHTML = id;
        li.classList.add('showButton');
        li.onclick = () => {
            eventSource.trigger(EVENT_VISUALISER_BUTTON_CLICK, id);
        };
        elVisualiserButtons.appendChild(li);
        visualiserButtons[id] = li;
    }

    const messagePrinter = (() => {
        const PRINT_INTERVAL = config.messages.charPrintIntervalMillis;
        let interval;

        function stopPrinting() {
            clearInterval(interval);
            interval = 0;
        }

        return {
            print(msg) {
                if (interval) {
                    stopPrinting();
                }
                const msgLen = msg.length;
                let i = 1;
                interval = setInterval(() => {
                    elMessage.innerText = (msg.substr(0,i) + (i < msgLen ? '█' : '')).padEnd(msgLen, ' ');
                    const messageComplete = i === msgLen;
                    if (messageComplete) {
                        stopPrinting();
                        eventSource.trigger(EVENT_MESSAGE_PRINTING_COMPLETE);
                    } else {
                        i += 1;
                    }

                }, PRINT_INTERVAL);
            }
        };
    })();

    function triggerWake() {
        eventSource.trigger(EVENT_WAKE_UP);
    }

    elMenuOpenButton.onclick = () => {
        eventSource.trigger(EVENT_MENU_OPEN_CLICK);
    };
    elMenuCloseButton.onclick = () => {
        eventSource.trigger(EVENT_MENU_CLOSE_CLICK);
    };

    elVolumeUp.onclick = () => {
        eventSource.trigger(EVENT_VOLUME_UP_CLICK);
    };
    elVolumeDown.onclick = () => {
        eventSource.trigger(EVENT_VOLUME_DOWN_CLICK);
    };

    sleepTimerView.init();

    return {
        on: eventSource.on,

        setChannels(channels) {
            channels.forEach(channel => {
                buildChannelButton(channel);
                scheduleView.addChannel(channel);
            });

            if (channels.length <= FEW_CHANNELS_LIMIT) {
                elButtonContainer.classList.add('fewerChannels');
            }

            elButtonContainer.scroll({left: 1000});
            elButtonContainer.scroll({behavior:'smooth', left: 0});
        },

        setNoChannelSelected() {
            forEachChannelButton((id, el) => {
                el.classList.remove(CLASS_LOADING, CLASS_PLAYING, CLASS_ERROR);
            });
        },

        setChannelLoading(channelId) {
            forEachChannelButton((id, el) => {
                el.classList.remove(CLASS_PLAYING, CLASS_ERROR);
                el.classList.toggle(CLASS_LOADING, id === channelId);
            });
        },

        setChannelLoaded(channelId) {
            forEachChannelButton((id, el) => {
                el.classList.remove(CLASS_LOADING, CLASS_ERROR);
                el.classList.toggle(CLASS_PLAYING, id === channelId);
            });
        },

        openMenu() {
            elMenuBox.classList.add('visible');
            elMenuOpenButton.style.display = 'none';
            elMenuCloseButton.style.display = 'inline';
        },
        closeMenu() {
            elMenuBox.classList.remove('visible');
            elMenuOpenButton.style.display = 'inline';
            elMenuCloseButton.style.display = 'none';
        },

        updateVolume(volume, minVolume, maxVolume) {
            elVolumeLeds.forEach((el, i) => el.classList.toggle('on', (i + 1) <= volume));
            elVolumeDown.classList.toggle('disabled', volume === minVolume);
            elVolumeUp.classList.toggle('disabled', volume === maxVolume);
        },

        showMessage(message) {
            messagePrinter.print(message);
        },

        startSleepTimer() {
            sleepTimerView.setRunState(true);
        },
        updateSleepTimer(seconds) {
            sleepTimerView.render(seconds);
        },
        clearSleepTimer() {
            sleepTimerView.setRunState(false);
        },
        sleep() {
            this.closeMenu();
            sleepTimerView.setRunState(false);
            document.body.classList.add('sleeping');
            document.body.addEventListener('mousemove', triggerWake);
            document.body.addEventListener('touchstart', triggerWake);
            document.body.addEventListener('keydown', triggerWake);
        },
        wakeUp() {
            document.body.classList.remove('sleeping');
            document.body.removeEventListener('mousemove', triggerWake);
            document.body.removeEventListener('touchstart', triggerWake);
            document.body.removeEventListener('keydown', triggerWake);
        },

        updateScheduleChannelSelection(channelId) {
            scheduleView.setSelectedChannel(channelId);
        },
        displaySchedule(schedule) {
            scheduleView.displaySchedule(schedule);
        },
        hideSchedule() {
            scheduleView.hideSchedule();
        },

        populateStationBuilderShows(stationBuilderModel) {
            stationBuilderView.populate(stationBuilderModel);
        },
        updateStationBuilderShowSelections(stationBuilderModel) {
            stationBuilderView.updateShowSelections(stationBuilderModel);
        },
        updateStationBuilderIncludeCommercials(stationBuilderModel) {
            stationBuilderView.updateIncludeCommercials(stationBuilderModel);
        },
        updateStationBuilderStationDetails(stationBuilderModel) {
            stationBuilderView.updateStationDetails(stationBuilderModel);
        },
        addAnotherStationBuilderChannel() {
            stationBuilderView.addAnotherChannel();
        },
        setVisualiser(audioVisualiser) {
            audioVisualiser.init(elVisualiserCanvas);
        },
        showDownloadLink(mp3Url) {
            elDownloadLink.innerHTML = `<a href="${mp3Url}" target="_blank">Download this show as an MP3 file</a>`;
        },
        hideDownloadLink() {
            elDownloadLink.innerHTML = '';
        },
        showError(errorMsg) {
            forEachChannelButton((id, el) => {
                el.classList.remove(CLASS_PLAYING, CLASS_ERROR);
                el.classList.toggle(CLASS_LOADING, true);
            });
        },
        setVisualiserIds(visualiserIds) {
            visualiserIds.forEach(visualiserId => {
                buildVisualiserButton(visualiserId);
            });
        },
        updateVisualiserId(selectedVisualiserId) {
            Object.keys(visualiserButtons).forEach(visualiserId => {
                const el = visualiserButtons[visualiserId];
                el.classList.toggle(CLASS_SELECTED, selectedVisualiserId === visualiserId);
            });
        }
    };
}