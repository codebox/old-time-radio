function buildView(eventSource, model) {
    "use strict";
    const FEW_CHANNELS_LIMIT = 4,
        channelButtons = {},
        visualiserButtons = {},

        CLASS_LOADING = 'channelLoading',
        CLASS_PLAYING = 'channelPlaying',
        CLASS_ERROR = 'channelError',
        CLASS_SELECTED = 'selected',

        elMenuOpenIcon = document.getElementById('menuOpenIcon'),
        elMenuCloseIcon = document.getElementById('menuCloseIcon'),
        elMenuButton = document.getElementById('menuButton'),
        elMenuBox = document.getElementById('menu'),
        elVolumeUp = document.getElementById('volumeUp'),
        elVolumeDown = document.getElementById('volumeDown'),
        elPrefInfoMessages = document.getElementById('prefInfoMessages'),
        elPrefNowPlayingMessages = document.getElementById('prefNowPlayingMessages'),
        elMessage = document.getElementById('message'),
        elDownloadLink = document.getElementById('downloadLink'),
        elButtonContainer = document.getElementById('buttons'),
        elVolumeLeds = Array.from(Array(10).keys()).map(i => document.getElementById(`vol${i+1}`)),
        elVisualiserCanvas = document.getElementById('visualiserCanvas'),
        elPlayingNowCanvas = document.getElementById('playingNowCanvas'),
        elVisualiserButtons = document.getElementById('visualiserList'),
        elTitle = document.getElementsByTagName('title')[0],

        sleepTimerView = buildSleepTimerView(eventSource),
        scheduleView = buildScheduleView(eventSource),
        stationBuilderView = buildStationBuilderView(eventSource);

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
            elButton = document.createElement('button'),
            elButtonLabel = document.createElement('label');

        elButtonIndicator.classList.add('buttonIndicator');

        elButton.classList.add('raisedButton');
        elButton.setAttribute('role', 'radio');
        elButton.id = (channelName + '_channel').toLowerCase().replaceAll(' ', '_');
        elButtonLabel.classList.add('buttonLabel');
        elButtonLabel.innerText = channelName;
        elButtonLabel.setAttribute('for', elButton.id);

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
        const button = document.createElement('button');
        button.innerHTML = id;
        button.classList.add('menuButton');
        button.setAttribute('data-umami-event', `visualiser-${id.toLowerCase()}`);
        button.setAttribute('role', 'radio');
        button.onclick = () => {
            eventSource.trigger(EVENT_VISUALISER_BUTTON_CLICK, id);
        };
        elVisualiserButtons.appendChild(button);
        visualiserButtons[id] = button;
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

    const playingNowPrinter = buildPlayingNowManager(model, elPlayingNowCanvas);

    function triggerWake() {
        eventSource.trigger(EVENT_WAKE_UP);
    }

    let menuOpen = false;
    elMenuButton.onclick = () => {
        eventSource.trigger(menuOpen ? EVENT_MENU_CLOSE_CLICK : EVENT_MENU_OPEN_CLICK);
    };

    elMenuBox.ontransitionend = () => {
        if (!menuOpen) {
            elMenuBox.style.visibility = 'hidden';
        }
    };
    elMenuBox.style.visibility = 'hidden';

    elVolumeUp.onclick = () => {
        eventSource.trigger(EVENT_VOLUME_UP_CLICK);
    };
    elVolumeDown.onclick = () => {
        eventSource.trigger(EVENT_VOLUME_DOWN_CLICK);
    };

    elPrefInfoMessages.onclick = () => {
        eventSource.trigger(EVENT_PREF_INFO_MESSAGES_CLICK);
    }

    elPrefNowPlayingMessages.onclick = () => {
        eventSource.trigger(EVENT_PREF_NOW_PLAYING_CLICK);
    }

    sleepTimerView.init();

    const snowMachine = buildSnowMachine(elVisualiserCanvas);

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
                el.ariaChecked = false;
            });
        },

        setChannelLoading(channelId) {
            forEachChannelButton((id, el) => {
                el.classList.remove(CLASS_PLAYING, CLASS_ERROR);
                el.classList.toggle(CLASS_LOADING, id === channelId);
                el.ariaChecked = false;
            });
        },

        setChannelLoaded(channelId) {
            forEachChannelButton((id, el) => {
                el.classList.remove(CLASS_LOADING, CLASS_ERROR);
                el.classList.toggle(CLASS_PLAYING, id === channelId);
                el.ariaChecked = id === channelId;
            });
        },

        openMenu() {
            menuOpen = true;
            elMenuBox.style.visibility = 'visible';
            elMenuBox.classList.add('visible');
            elMenuOpenIcon.style.display = 'none';
            elMenuCloseIcon.style.display = 'inline';
            elMenuButton.ariaExpanded = "true";
        },
        closeMenu() {
            menuOpen = false;
            elMenuBox.classList.remove('visible');
            elMenuOpenIcon.style.display = 'inline';
            elMenuCloseIcon.style.display = 'none';
            elMenuButton.ariaExpanded = "false";
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
        showPlayingNowDetails(playingNowDetails) {
            elPlayingNowCanvas.style.display = 'block';
            playingNowPrinter.start(playingNowDetails);
        },
        updatePlayingNowDetails(playingNowDetails) {
            playingNowPrinter.update(playingNowDetails);
        },
        hidePlayingNowDetails() {
            elPlayingNowCanvas.style.display = 'none';
            playingNowPrinter.stop();
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
                el.ariaChecked = selectedVisualiserId === visualiserId;
                el.setAttribute('aria-controls', 'canvas');
            });
        },
        updatePrefInfoMessages(showInfoMessages) {
            elPrefInfoMessages.classList.toggle(CLASS_SELECTED, showInfoMessages);
            elPrefInfoMessages.innerHTML = showInfoMessages ? 'On' : 'Off';
        },
        updatePrefNowPlayingMessages(showNowPlayingMessages) {
            elPrefNowPlayingMessages.classList.toggle(CLASS_SELECTED, showNowPlayingMessages);
            elPrefNowPlayingMessages.innerHTML = showNowPlayingMessages ? 'On' : 'Off';
        },
        addShowTitleToPage(title) {
            elTitle.innerHTML += (' - ' + title);
        },
        startSnowMachine(intensity) {
            snowMachine.start(intensity);
        },
        stopSnowMachine() {
            snowMachine.stop();
        }
    };
}