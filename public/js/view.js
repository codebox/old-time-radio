const view = (() => {
    "use strict";
    const STATE_INIT = 'initialising',
        STATE_NO_CHANNEL = 'nochannel',
        STATE_CHANNEL_LOADING = 'channelLoading',
        STATE_CHANNEL_PLAYING = 'channelPlaying',

        elChannelsList = document.getElementById('channels');

    let state, onChannelSelected = () => {};


    function setState(newState) {
        if (newState === state) {
            return;
        }

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
            });
        },
        setChannelLoading(channel) {
            setState(STATE_CHANNEL_LOADING);
        },
        setChannelPlaying(channel) {
            setState(STATE_CHANNEL_PLAYING);
        }
    };
})();