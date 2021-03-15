const view = (() => {
    "use strict";
    const STATE_INIT = 'initialising',
        STATE_NO_CHANNEL = 'nochannel',
        STATE_CHANNEL_LOADING = 'channelLoading',
        STATE_CHANNEL_PLAYING = 'channelPlaying',
        STATE_CONNECTION_ERROR = 'connectionError',

        CLASS_LOADING = 'channelLoading',
        CLASS_PLAYING = 'channelPlaying',
        CLASS_ERROR = 'channelError',

        SCHEDULE_UPDATE_INTERVAL_MILLIS = 60 * 1000,
        FEW_CHANNELS_LIMIT = 4,
        eventTarget = new EventTarget(),

        elButtonContainer = document.getElementById('buttons'),
        elDownloadLink = document.getElementById('downloadLink'),
        elMenuOpenButton = document.getElementById('menuOpenButton'),
        elMenuCloseButton = document.getElementById('menuCloseButton'),
        elMenuBox = document.getElementById('menu'),
        elVolumeUp = document.getElementById('volumeUp'),
        elVolumeDown = document.getElementById('volumeDown'),

        volumeLeds = Array.from(Array(10).keys()).map(i => document.getElementById(`vol${i+1}`)),

        channelButtons = {};

    const sleepTimerView = (() => {
        const elSleepTimerTime = document.getElementById('sleepTimerTime'),
            elSleepTimerRunningDisplay = document.getElementById('sleepTimerRunningDisplay'),
            elSleepTimerButtons = document.getElementById('sleepTimerButtons'),
            elCancelSleepTimerButton = document.getElementById('cancelSleepTimerButton'),

            HIDDEN_CSS_CLASS = 'hidden',
            BUTTONS = [
                [90, '90 Minutes'],
                [60, '60 Minutes'],
                [45, '45 minutes'],
                [30, '30 minutes'],
                [15, '15 minutes']
            ];

        function formatTimePart(value) {
            return (value < 10 ? '0' : '') + value;
        }

        return {
            init() {
                elSleepTimerButtons.innerHTML = '';
                BUTTONS.forEach(details => {
                    const [minutes, text] = details;
                    const button = document.createElement('li');
                    button.classList.add('showButton');
                    button.innerHTML = text;

                    button.onclick = () => {
                        trigger('setSleepTimerClick', minutes);
                    };

                    elSleepTimerButtons.appendChild(button);
                });
                elCancelSleepTimerButton.onclick = () => {
                    trigger('cancelSleepTimerClick');
                };
            },
            render(totalSeconds) {
                const hours = Math.floor(totalSeconds / 3600),
                    minutes = Math.floor((totalSeconds % 3600) / 60),
                    seconds = totalSeconds % 60;
                elSleepTimerTime.innerHTML = `${formatTimePart(hours)}:${formatTimePart(minutes)}:${formatTimePart(seconds)}`;
            },
            setRunState(isRunning) {
                elSleepTimerRunningDisplay.classList.toggle(HIDDEN_CSS_CLASS, !isRunning);
            }
        };
    })();

    function trigger(eventName, eventData) {
        console.log('EVENT ' + eventName);
        const event = new Event(eventName);
        event.data = eventData;
        eventTarget.dispatchEvent(event);
    }

    elMenuOpenButton.onclick = () => {
        trigger('menuOpenClick');
    };
    elMenuCloseButton.onclick = () => {
        trigger('menuCloseClick');
    };

    elVolumeUp.onclick = () => {
        trigger('volumeUpClick');
    };
    elVolumeDown.onclick = () => {
        trigger('volumeDownClick');
    };

    let model;

    function forEachChannelButton(fn) {
        Object.keys(channelButtons).forEach(channelId => {
            fn(channelId, channelButtons[channelId]);
        });
    }

    function updateDownloadLink() {
        if (model.track) {
            elDownloadLink.innerHTML = `<a href="${model.track.url}" target="_blank">Download this show as an MP3 file</a>`;
        } else {
            elDownloadLink.innerHTML = '';
        }
    }

    function setMenuState(isOpen) {
        // elMenuBox.classList.toggle('visible', isOpen);
        // elMenuOpenButton.style.display = isOpen ? 'none' : 'inline';
        // elMenuCloseButton.style.display = !isOpen ? 'none' : 'inline';
        //scheduleManager.setSelectedChannel(isOpen ? model2.channel : undefined); //TODO move this out of here
        if (isOpen) {
            // scheduleUpdateInterval = setInterval(() => {
            //     scheduleManager.updateSelectedChannel();
            // }, SCHEDULE_UPDATE_INTERVAL_MILLIS);
        } else {
            // clearInterval(scheduleUpdateInterval);
        }
    }

    function setViewState(state) {
        if (state === STATE_NO_CHANNEL) {
            forEachChannelButton((id, el) => {
                el.classList.remove(CLASS_LOADING, CLASS_PLAYING, CLASS_ERROR);
            });

        } else if (state === STATE_CHANNEL_LOADING) {
            forEachChannelButton((id, el) => {
                el.classList.remove(CLASS_PLAYING, CLASS_ERROR);
                el.classList.toggle(CLASS_LOADING, id === model2.channel.id);
            });

        } else if (state === STATE_CHANNEL_PLAYING) {
            forEachChannelButton((id, el) => {
                el.classList.remove(CLASS_LOADING, CLASS_ERROR);
                el.classList.toggle(CLASS_PLAYING, id === model2.channel.id);
            });

        } else if (state === STATE_CONNECTION_ERROR) {
            forEachChannelButton((id, el) => {
                el.classList.remove(CLASS_LOADING, CLASS_PLAYING);
                el.classList.add(CLASS_ERROR);
            });
        }
        updateDownloadLink();
        messageManager.updateStatus();
    }

    setMenuState(false);

    function triggerWake(){
        trigger('wake');
    }

    return {
        init(_model) {
            model = _model;
            messageManager.init(document.getElementById('message'), model);
            sleepTimerView.init();
            setViewState(STATE_INIT);
            this.updateVolume();
            viewSchedule.init(trigger);
        },
        setChannels(channels) {
            setViewState(STATE_NO_CHANNEL);
            channels.forEach(channel => {
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
                    if (model2.channel && (channelId === model2.channel.id)) {
                        trigger('channelButtonClick');
                    } else {
                        trigger('channelButtonClick', channel);
                    }
                };
                elButtonBox.appendChild(elButtonIndicator);
                elButtonBox.appendChild(elButton);
                elButtonBox.appendChild(elButtonLabel);
                elButtonContainer.appendChild(elButtonBox);
                channelButtons[channelId] = elButtonBox;

                viewSchedule.addChannel(channel);
            });
            if (channels.length <= FEW_CHANNELS_LIMIT) {
                elButtonContainer.classList.add('fewerChannels');
            }
            elButtonContainer.scroll({left: 1000});
            elButtonContainer.scroll({behavior:'smooth', left: 0});
        },
        updatePlayState() {
            if (!model2.channel) {
                setViewState(STATE_NO_CHANNEL);
            } else if (!model.track) {
                setViewState(STATE_CHANNEL_LOADING);
            } else {
                setViewState(STATE_CHANNEL_PLAYING);
            }
        },
        connectionError() {
            setViewState(STATE_CONNECTION_ERROR);
            messageManager.httpError();
        },
        setVisualisationDataSource(source) {
            visualiser.setDataSource(source);
        },
        getCanvas() {
            return document.getElementById('canvas');
        },

        updateSleepTimer(seconds) {
            sleepTimerView.render(seconds);
        },
        setSleepTimerRunning(isRunning) {
            sleepTimerView.setRunState(isRunning);
        },

        on(eventName, handler) {
            eventTarget.addEventListener(eventName, handler);
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
        updateVolume() {
            volumeLeds.forEach((el, i) => el.classList.toggle('on', (i + 1) <= model2.volume));
            elVolumeUp.classList.toggle('disabled', model2.volume === model2.maxVolume);
            elVolumeDown.classList.toggle('disabled', model2.volume === model2.minVolume);
        },
        sleep() {
            setMenuState(false);
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
            viewSchedule.setSelectedChannel(channelId);
        },
        displaySchedule(schedule) {
            viewSchedule.displaySchedule(schedule);
        },
        hideSchedule() {
            viewSchedule.hideSchedule();
        }
    };
})();