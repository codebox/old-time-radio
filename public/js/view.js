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

        channelButtons = {};

    elMenuOpenButton.onclick = () => {
        setMenuState(true);
    };
    elMenuCloseButton.onclick = () => {
        setMenuState(false);
    };

    let model, onChannelSelectedHandler = () => {}, onChannelDeselectedHandler = () => {};

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
                el.classList.toggle(CLASS_LOADING, id === model.channel);
            });

        } else if (state === STATE_CHANNEL_PLAYING) {
            forEachChannelButton((id, el) => {
                el.classList.remove(CLASS_LOADING, CLASS_ERROR);
                el.classList.toggle(CLASS_PLAYING, id === model.channel);
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
        },
        setChannels(channelIds) {
            setViewState(STATE_NO_CHANNEL);
            channelIds.forEach(channelId => {
                const elButtonBox = document.createElement('div');
                elButtonBox.classList.add('buttonBox');

                const elButtonIndicator = document.createElement('div'),
                    elButton = document.createElement('div'),
                    elButtonLabel = document.createElement('div');

                elButtonIndicator.classList.add('buttonIndicator');

                elButton.classList.add('button');
                elButtonLabel.classList.add('buttonLabel');
                elButtonLabel.innerText = channelId;

                elButton.onclick = () => {
                    if (channelId === model.channel) {
                        onChannelDeselectedHandler(channelId);
                    } else {
                        onChannelSelectedHandler(channelId);
                    }
                };
                elButtonBox.appendChild(elButtonIndicator);
                elButtonBox.appendChild(elButton);
                elButtonBox.appendChild(elButtonLabel);
                elButtonContainer.appendChild(elButtonBox);
                channelButtons[channelId] = elButtonBox;
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
        setVisualisationDataSource(source) {
            visualiser.setDataSource(source);
        },
        getCanvas() {
            return document.getElementById('canvas');
        }
    };
})();