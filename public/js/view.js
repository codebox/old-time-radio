const view = (() => {
    "use strict";
    const STATE_INIT = 'initialising',
        STATE_NO_CHANNEL = 'nochannel',
        STATE_CHANNEL_LOADING = 'channelLoading',
        STATE_CHANNEL_PLAYING = 'channelPlaying',

        CLASS_LOADING = 'channelLoading',
        CLASS_PLAYING = 'channelPlaying',

        elButtonContainer = document.getElementById('buttons'),
        elMessage = document.getElementById('message'),

        channelButtons = {};

    let model, onChannelSelectedHandler = () => {}, onChannelDeselectedHandler = () => {};

    function forEachChannelButton(fn) {
        Object.keys(channelButtons).forEach(channelId => {
            fn(channelId, channelButtons[channelId]);
        });
    }

    function setViewState(state) {
        if (state === STATE_INIT) {
            elMessage.innerText = 'Loading channels...';

        } else if (state === STATE_NO_CHANNEL) {
            elMessage.innerText = 'Select a channel';
            forEachChannelButton((id, el) => {
                el.classList.remove(CLASS_LOADING, CLASS_PLAYING);
            });

        } else if (state === STATE_CHANNEL_LOADING) {
            elMessage.innerText = `Loading ${model.channel}...`;
            forEachChannelButton((id, el) => {
                el.classList.remove(CLASS_PLAYING);
                el.classList.toggle(CLASS_LOADING, id === model.channel);
            });

        } else if (state === STATE_CHANNEL_PLAYING) {
            elMessage.innerText = `Playing ${model.track}`;
            forEachChannelButton((id, el) => {
                el.classList.remove(CLASS_LOADING);
                el.classList.toggle(CLASS_PLAYING, id === model.channel);
            });
        }
    }



    return {
        init(_model) {
            model = _model;
            setViewState(STATE_INIT);
        },
        setChannels(channelIds) {
            setViewState(STATE_NO_CHANNEL);
            channelIds.forEach(channelId => {
                const elButtonBox = document.createElement('div');
                elButtonBox.classList.add('buttonBox');

                const elButtonIndicatorInner = document.createElement('div'),
                    elButtonIndicatorOuter = document.createElement('div'),
                    elButton = document.createElement('div'),
                    elButtonLabel = document.createElement('div');

                elButtonIndicatorInner.classList.add('buttonIndicatorInner');
                elButtonIndicatorOuter.classList.add('buttonIndicatorOuter');
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
                elButtonIndicatorOuter.appendChild(elButtonIndicatorInner);
                elButtonBox.appendChild(elButtonIndicatorOuter);
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