function buildView() {
    "use strict";
    const FEW_CHANNELS_LIMIT = 4,
        eventTarget = new EventTarget(),
        channelButtons = {},

        CLASS_LOADING = 'channelLoading',
        CLASS_PLAYING = 'channelPlaying',
        CLASS_ERROR = 'channelError',

        elMenuOpenButton = document.getElementById('menuOpenButton'),
        elMenuCloseButton = document.getElementById('menuCloseButton'),
        elMenuBox = document.getElementById('menu'),
        elVolumeUp = document.getElementById('volumeUp'),
        elVolumeDown = document.getElementById('volumeDown'),
        elMessage = document.getElementById('message'),
        volumeLeds = Array.from(Array(10).keys()).map(i => document.getElementById(`vol${i+1}`)),

        elButtonContainer = document.getElementById('buttons');

    function trigger(eventName, eventData) {
        console.log('EVENT view' + eventName);
        const event = new Event(eventName);
        event.data = eventData;
        eventTarget.dispatchEvent(event);
    }

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
            trigger(EVENT_CHANNEL_BUTTON_CLICK, channelId);
        };
        elButtonBox.appendChild(elButtonIndicator);
        elButtonBox.appendChild(elButton);
        elButtonBox.appendChild(elButtonLabel);

        elButtonContainer.appendChild(elButtonBox);
        channelButtons[channelId] = elButtonBox;
    }

    const messagePrinter = (() => {
        const PRINT_INTERVAL = 40;
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
                        trigger(EVENT_MESSAGE_PRINTING_COMPLETE);
                    } else {
                        i += 1;
                    }

                }, PRINT_INTERVAL);
            }
        };
    })();

    elMenuOpenButton.onclick = () => {
        trigger(EVENT_MENU_OPEN_CLICK);
    };
    elMenuCloseButton.onclick = () => {
        trigger(EVENT_MENU_CLOSE_CLICK);
    };

    elVolumeUp.onclick = () => {
        trigger(EVENT_VOLUME_UP_CLICK);
    };
    elVolumeDown.onclick = () => {
        trigger(EVENT_VOLUME_DOWN_CLICK);
    };

    return {
        on(eventName, handler) {
            eventTarget.addEventListener(eventName, handler);
        },

        setChannels(channels) {
            channels.forEach(buildChannelButton);

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
            volumeLeds.forEach((el, i) => el.classList.toggle('on', (i + 1) <= volume));
            elVolumeDown.classList.toggle('disabled', volume === minVolume);
            elVolumeUp.classList.toggle('disabled', volume === maxVolume);
        },

        showMessage(message, isTempMessage) {
            messagePrinter.print(message);
        }

    };
}