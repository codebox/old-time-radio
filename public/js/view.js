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

        elButtonContainer = document.getElementById('buttons'),
        elDownloadLink = document.getElementById('downloadLink'),
        elMenuOpenButton = document.getElementById('menuOpenButton'),
        elMenuCloseButton = document.getElementById('menuCloseButton'),
        elMenuBox = document.getElementById('menu'),
        elVolumeUp = document.getElementById('volumeUp'),
        elVolumeDown = document.getElementById('volumeDown'),
        elSleepTimerButtons = document.getElementById('sleepTimerButtons'),
        elCancelSleepTimer = document.getElementById('cancelSleepTimer'),
        elCancelSleepTimerButton = document.getElementById('cancelSleepTimerButton'),

        volumeLeds = Array.from(Array(10).keys()).map(i => document.getElementById(`vol${i+1}`)),

        channelButtons = {};

    const scheduleManager = (() => {
        const elChannelLinks = document.getElementById('channelScheduleLinks'),
            elScheduleList = document.getElementById('scheduleList'),
            scheduleModel = [],
            CSS_CLASS_SELECTED = 'selected';

        function render() {
            scheduleModel.forEach(channelDetails => {
                channelDetails.el.classList.toggle(CSS_CLASS_SELECTED, !! channelDetails.selected);
            });
            const selectedChannelDetails = scheduleModel.find(channelDetails => channelDetails.selected);
            elScheduleList.innerHTML = '';
            if (selectedChannelDetails) {
                selectedChannelDetails.schedule.forEach(scheduleItem => {
                    const el = document.createElement('li');
                    el.innerHTML = `<div class="scheduleItemTime">${scheduleItem.time}</div><div class="scheduleItemName">${scheduleItem.name}</div>`;
                    elScheduleList.appendChild(el);
                });
            }
        }

        function setSelectedChannel(selectedChannel) {
            scheduleModel.forEach(channelDetails => {
                channelDetails.selected = selectedChannel && (channelDetails.channel.id === selectedChannel.id);
            });
            render();
            if (selectedChannel) {
                onScheduleRequestedHandler(selectedChannel.id);
            }
        }

        function getSelectedChannel() {
            return scheduleModel.find(channelDetails => channelDetails.selected);
        }

        function isSelectedChannel(channel) {
            return scheduleModel.find(channelDetails => channelDetails.channel.id === channel.id).selected;
        }

        return {
            addChannel(channel) {
                const li = document.createElement('li');
                li.innerHTML = channel.name;
                li.classList.add('showButton');
                li.onclick = () => {
                    setSelectedChannel(isSelectedChannel(channel) ? null : channel);
                };
                elChannelLinks.appendChild(li);
                scheduleModel.push({channel, el:li, selected: false, schedule: []});
            },
            updateSchedule(channelId, schedule) {
                const channelDetailsToUpdate = scheduleModel.find(channelDetails => channelDetails.channel.id === channelId);
                const playingNow = schedule.list.shift(),
                    timeNow = Date.now() / 1000;
                let nextShowStartOffsetFromNow = playingNow.length - schedule.initialOffset;

                channelDetailsToUpdate.schedule = [{time: 'NOW &gt;', name: playingNow.name}];
                channelDetailsToUpdate.schedule.push(...schedule.list.map(item => {
                    const ts = nextShowStartOffsetFromNow + timeNow,
                        date = new Date(ts * 1000),
                        hh = date.getHours().toString().padStart(2,'0'),
                        mm = date.getMinutes().toString().padStart(2,'0');
                    const result = {
                        time: `${hh}:${mm}`,
                        name: item.name,
                        commercial: item.commercial
                    };
                    nextShowStartOffsetFromNow += item.length;
                    return result;
                }).filter(item => !item.commercial));
                if (channelDetailsToUpdate.selected) {
                    render();
                }
            },
            setSelectedChannel(channel) {
                setSelectedChannel(channel);
            },
            updateSelectedChannel() {
                const selectedChannel = getSelectedChannel();
                if (selectedChannel) {
                    onScheduleRequestedHandler(selectedChannel.channel.id);
                }
            }
        };
    })();

    const sleepTimerView = (() => {
        const elSleepTimerTime = document.getElementById('sleepTimerTime'),
            elCancelSleepTimer = document.getElementById('cancelSleepTimer');

        return {
            render(minutes) {
                elCancelSleepTimer.style.display = minutes ? 'block' : 'none';
                elSleepTimerTime.innerHTML = minutes ? `${minutes} minute${minutes === 1 ? '' : 's'}` : '';
            }
        };
    })();

    elMenuOpenButton.onclick = () => {
        setMenuState(true);
    };
    elMenuCloseButton.onclick = () => {
        setMenuState(false);
    };
    elVolumeUp.onclick = () => {
        config.volume += 1;
        onVolumeChanged();
    };
    elVolumeDown.onclick = () => {
        config.volume -= 1;
        onVolumeChanged();
    };

    let model,
        scheduleUpdateInterval,
        onChannelSelectedHandler = () => {},
        onChannelDeselectedHandler = () => {},
        onVolumeChangedHandler = () => {},
        onSetSleepTimerClickedHandler = () => {},
        onSleepTimerCancelClickedHandler = () => {},
        onScheduleRequestedHandler = () => {},
        onWakeHandler = () => {};

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

    function onVolumeChanged() {
        volumeLeds.forEach((el, i) => el.classList.toggle('on', (i + 1) <= config.volume));
        elVolumeUp.classList.toggle('disabled', config.isVolumeMax());
        elVolumeDown.classList.toggle('disabled', config.isVolumeMin());
        onVolumeChangedHandler();
    }

    function setMenuState(isOpen) {
        elMenuBox.classList.toggle('visible', isOpen);
        elMenuOpenButton.style.display = isOpen ? 'none' : 'inline';
        elMenuCloseButton.style.display = !isOpen ? 'none' : 'inline';
        scheduleManager.setSelectedChannel(isOpen ? model.channel : undefined); //TODO move this out of here
        if (isOpen) {
            scheduleUpdateInterval = setInterval(() => {
                scheduleManager.updateSelectedChannel();
            }, SCHEDULE_UPDATE_INTERVAL_MILLIS);
        } else {
            clearInterval(scheduleUpdateInterval);
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
                el.classList.toggle(CLASS_LOADING, id === model.channel.id);
            });

        } else if (state === STATE_CHANNEL_PLAYING) {
            forEachChannelButton((id, el) => {
                el.classList.remove(CLASS_LOADING, CLASS_ERROR);
                el.classList.toggle(CLASS_PLAYING, id === model.channel.id);
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

    function buildSleepTimerButtons() {
        const BUTTONS = [
            [90, '90 Minutes'],
            [60, '60 Minutes'],
            [45, '45 minutes'],
            [30, '30 minutes'],
            [15, '15 minutes']
        ];

        elSleepTimerButtons.innerHTML = '';
        BUTTONS.forEach(details => {
            const [minutes, text] = details;
            const button = document.createElement('button');
            button.classList.add('sleepTimerButton');
            button.innerHTML = text;

            button.onclick = () => {
                onSetSleepTimerClickedHandler(minutes);
            };

            elSleepTimerButtons.appendChild(button);
        });

        elCancelSleepTimerButton.onclick = () => {
            onSleepTimerCancelClickedHandler();
        };
    }

    buildSleepTimerButtons();
    setMenuState(false);

    document.body.addEventListener('mousemove', () => {
        if (model.sleeping) {
            document.body.classList.remove('sleeping');
            onWakeHandler();
        }
    });
    return {
        init(_model) {
            model = _model;
            messageManager.init(document.getElementById('message'), model);
            setViewState(STATE_INIT);
            onVolumeChanged();
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
                    if (model.channel && (channelId === model.channel.id)) {
                        onChannelDeselectedHandler(channel);
                    } else {
                        onChannelSelectedHandler(channel);
                    }
                };
                elButtonBox.appendChild(elButtonIndicator);
                elButtonBox.appendChild(elButton);
                elButtonBox.appendChild(elButtonLabel);
                elButtonContainer.appendChild(elButtonBox);
                channelButtons[channelId] = elButtonBox;

                scheduleManager.addChannel(channel);
            });
            elButtonContainer.scroll({left: 1000});
            elButtonContainer.scroll({behavior:'smooth', left: 0});
        },
        updatePlayState() {
            if (!model.channel) {
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
        onChannelSelected(handler) {
            onChannelSelectedHandler = handler;
        },
        onChannelDeselected(handler) {
            onChannelDeselectedHandler = handler;
        },
        onVolumeChanged(handler) {
            onVolumeChangedHandler = handler;
        },
        onScheduleRequested(handler) {
            onScheduleRequestedHandler = handler;
        },
        setVisualisationDataSource(source) {
            visualiser.setDataSource(source);
        },
        getCanvas() {
            return document.getElementById('canvas');
        },
        updateShowList() {
            channelBuilder.init(elShowList, model.shows);
        },
        updateSchedule(channelId, schedule) {
            scheduleManager.updateSchedule(channelId, schedule);
        },
        onSetSleepTimerClicked(handler) {
            onSetSleepTimerClickedHandler = handler;
        },
        onSleepTimerCancelClicked(handler) {
            onSleepTimerCancelClickedHandler = handler;
        },
        onWake(handler) {
            onWakeHandler = handler;
        },
        sleep() {
            setMenuState(false);
            document.body.classList.add('sleeping');
        },
        updateSleepTimer(minutes) {
            sleepTimerView.render(minutes);
        }
    };
})();