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

    let state, currentChannelId, currentItemName, onChannelSelectedHandler = () => {};

    function forEachChannelButton(fn) {
        Object.keys(channelButtons).forEach(channelId => {
            fn(channelId, channelButtons[channelId]);
        });
    }

    function setState(newState) {
        if (newState === STATE_INIT) {
            elMessage.innerText = 'Loading channels...';

        } else if (newState === STATE_NO_CHANNEL) {
            elMessage.innerText = 'Select a channel';
            forEachChannelButton((id, el) => {
                el.classList.remove(CLASS_LOADING, CLASS_PLAYING);
            });

        } else if (newState === STATE_CHANNEL_LOADING) {
            elMessage.innerText = `Loading ${currentChannelId}...`;
            forEachChannelButton((id, el) => {
                el.classList.remove(CLASS_PLAYING);
                el.classList.toggle(CLASS_LOADING, id === currentChannelId);
            });

        } else if (newState === STATE_CHANNEL_PLAYING) {
            elMessage.innerText = `Playing ${currentItemName}`;
            forEachChannelButton((id, el) => {
                el.classList.remove(CLASS_LOADING);
                el.classList.toggle(CLASS_PLAYING, id === currentChannelId);
            });
        }
        state = newState;
    }

    return {
        init() {
            currentChannelId = currentItemName = null;
            setState(STATE_INIT);
        },
        setChannels(channelIds) {
            setState(STATE_NO_CHANNEL);
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
                    onChannelSelectedHandler(channelId);
                };
                elButtonBox.appendChild(elButtonIndicator);
                elButtonBox.appendChild(elButton);
                elButtonBox.appendChild(elButtonLabel);
                elButtonContainer.appendChild(elButtonBox);
                channelButtons[channelId] = elButtonBox;
            });
        },
        setNoChannelPlaying() {
            setState(STATE_NO_CHANNEL);
        },
        setChannelLoading(channelId) {
            if (state === STATE_CHANNEL_PLAYING && channelId === currentChannelId) {
                currentChannelId = currentItemName = null;
                setState(STATE_NO_CHANNEL);
            } else {
                currentChannelId = channelId;
                currentItemName = null;
                setState(STATE_CHANNEL_LOADING);
            }
        },
        setChannelPlaying(channelId, itemName) {
            currentChannelId = channelId;
            currentItemName = itemName;
            setState(STATE_CHANNEL_PLAYING);
        },
        onChannelSelected(handler) {
            onChannelSelectedHandler = handler;
        }
    };
})();