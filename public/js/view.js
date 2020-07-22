const view = (() => {
    "use strict";
    const STATE_INIT = 'initialising',
        STATE_NO_CHANNEL = 'nochannel',
        STATE_CHANNEL_LOADING = 'channelLoading',
        STATE_CHANNEL_PLAYING = 'channelPlaying',

        CLASS_LOADING = 'channelLoading',
        CLASS_PLAYING = 'channelPlaying',

        elChannelsList = document.getElementById('channels'),
        channelButtons = {};

    let state, currentChannelId, onChannelSelected = () => {};

    function forEachChannelButton(fn) {
        Object.keys(channelButtons).forEach(channelId => {
            fn(channelId, channelButtons[channelId]);
        });
    }

    function setState(newState) {
        if (newState === state) {
            return;
        }

        if (newState === STATE_INIT) {
            forEachChannelButton((id, el) => {
                el.classList.remove(CLASS_LOADING, CLASS_PLAYING);
            });

        } else if (newState === STATE_CHANNEL_LOADING) {
            forEachChannelButton((id, el) => {
                el.classList.remove(CLASS_PLAYING);
                el.classList.toggle(CLASS_LOADING, id === currentChannelId);
            });

        } else if (newState === STATE_CHANNEL_PLAYING) {
            forEachChannelButton((id, el) => {
                el.classList.remove(CLASS_LOADING);
                el.classList.toggle(CLASS_PLAYING, id === currentChannelId);
            });
        }
        state = newState;
    }

    return {
        init() {
            setState(STATE_INIT);
        },
        onChannelSelected(handler) {
            onChannelSelected = handler;
        },
        setChannels(channelIds) {
            setState(STATE_NO_CHANNEL);

            channelIds.forEach(channelId => {
                const elChannel = document.createElement('li');
                elChannel.innerText = channelId;
                elChannel.onclick = () => {
                    onChannelSelected(channelId);
                };
                elChannelsList.appendChild(elChannel);
                channelButtons[channelId] = elChannel;
            });
        },
        setChannelLoading(channelId) {
            currentChannelId = channelId;
            setState(STATE_CHANNEL_LOADING);
        },
        setChannelPlaying(channelId, itemName) {
            setState(STATE_CHANNEL_PLAYING);
        }
    };
})();