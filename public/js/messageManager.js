function buildMessageManager(model, eventSource) {
    "use strict";
    const TEMP_MESSAGE_DURATION = config.messages.tempMessageDurationMillis;

    let persistentMessage, temporaryMessage;

    function triggerNewMessage(text, isTemp) {
        if (isTemp) {
            if (temporaryMessage) {
                return;
            }
            temporaryMessage = text;
            setTimeout(() => {
                if (temporaryMessage === text) {
                    triggerNewMessage(persistentMessage);
                }
            }, TEMP_MESSAGE_DURATION);

        } else {
            temporaryMessage = null;
            persistentMessage = text;
        }
        eventSource.trigger(EVENT_NEW_MESSAGE, {text, isTemp});
    }

    const cannedMessages = (() => {
        function showNext() {
            const nonCommercials = (model.playlist || []).filter(item => !item.commercial);
            if (nonCommercials.length){
                return `Up next: ${nonCommercials[0].name}`;
            }
        }
        function getModeSpecificCannedMessages() {
            if (model.isUserChannelMode()) {
                return config.messages.canned.userChannel;
            } else if (model.isSingleShowMode()) {
                return config.messages.canned.singleShow;
            } else {
                return config.messages.canned.normal;
            }
        }

        let messages, nextIndex = 0;
        return {
            init() {
                const modeSpecificCannedMessages = getModeSpecificCannedMessages(),
                    allCannedMessages = [...modeSpecificCannedMessages, ...config.messages.canned.all];

                messages = allCannedMessages.map(textMessage => [showNext, textMessage]).flatMap(m => m);
            },
            next() {
                const nextMsg = messages[nextIndex = (nextIndex + 1) % messages.length];
                return (typeof nextMsg === 'function') ? nextMsg() : nextMsg;
            }
        };
    })();

    return {
        on: eventSource.on,
        init() {
            cannedMessages.init();
        },
        showLoadingChannels() {
            triggerNewMessage('Loading Channels...');
        },
        showSelectChannel() {
            if (model.channels.length === 1) {
                triggerNewMessage(`Press the '${model.channels[0].name}' button to tune in`);
            } else {
                triggerNewMessage('Select a channel');
            }
        },
        showTuningInToChannel(channelName) {
            if (model.isSingleShowMode() || model.isUserChannelMode()) {
                triggerNewMessage(`Tuning in to ${channelName}...`);
            } else {
                triggerNewMessage(`Tuning in to the ${channelName} channel...`);
            }
        },
        showNowPlaying(trackName) {
            triggerNewMessage(trackName);
        },
        showTempMessage() {
            const msgText = cannedMessages.next();
            if (msgText) {
                triggerNewMessage(msgText, true);
            }
        },
        showSleeping() {
            triggerNewMessage('Sleeping');
        },
        showError() {
            triggerNewMessage(`There is a reception problem, please adjust your aerial`);
        }
    };
}