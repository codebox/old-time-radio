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

        elButtonContainer = document.getElementById('buttons'),
        elDownloadLink = document.getElementById('downloadLink'),
        elMenuOpenButton = document.getElementById('menuOpenButton'),
        elMenuCloseButton = document.getElementById('menuCloseButton'),
        elMenuBox = document.getElementById('menu'),
        elVolumeUp = document.getElementById('volumeUp'),
        elVolumeDown = document.getElementById('volumeDown'),
        volumeLeds = Array.from(Array(10).keys()).map(i => document.getElementById(`vol${i+1}`)),

        channelButtons = {};

    const scheduleManager = (() => {
        const elChannelLinks = document.getElementById('channelScheduleLinks'),
            elScheduleList = document.getElementById('scheduleList'),
            scheduleModel = [],
            CSS_CLASS_SELECTED = 'selected';

        function render() {
            scheduleModel.forEach(channelDetails => {
                channelDetails.el.classList.toggle(CSS_CLASS_SELECTED, channelDetails.selected);
            });
            const selectedChannelDetails = scheduleModel.find(channelDetails => channelDetails.selected);
            elScheduleList.innerHTML = '';
            if (selectedChannelDetails) {
                selectedChannelDetails.schedule.forEach(scheduleItem => {
                    const el = document.createElement('li');
                    el.innerHTML = `${scheduleItem.time} ${scheduleItem.name}`;
                    elScheduleList.appendChild(el);
                });
            }
        }

        function setSelectedChannel(selectedChannel) {
            scheduleModel.forEach(channelDetails => {
                channelDetails.selected = (channelDetails.channel.id === selectedChannel.id);
            });
            render();
            onScheduleRequestedHandler(selectedChannel.id);
        }

        return {
            addChannel(channel) {
                const li = document.createElement('li');
                li.innerHTML = channel.name;
                li.onclick = () => {
                    setSelectedChannel(channel);
                };
                elChannelLinks.appendChild(li);
                scheduleModel.push({channel, el:li, selected: false, schedule: []});
            },
            updateSchedule(channelId, schedule) {
                const channelDetailsToUpdate = scheduleModel.find(channelDetails => channelDetails.channel.id === channelId);
                const playingNow = schedule.list.shift(),
                    timeNow = Date.now() / 1000;
                let nextShowStartOffsetFromNow = playingNow.length - schedule.initialOffset;

                channelDetailsToUpdate.schedule = [{time: 'NOW', name: playingNow.name}];
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
        onChannelSelectedHandler = () => {},
        onChannelDeselectedHandler = () => {},
        onVolumeChangedHandler = () => {},
        onScheduleRequestedHandler = () => {};

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

    setMenuState(false);

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
        }
    };
})();