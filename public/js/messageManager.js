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

        const MESSAGES = config.messages.canned.map(textMessage => [showNext, textMessage]).flatMap(m => m);

        let nextIndex = 0;
        return {
            next() {
                const nextMsg = MESSAGES[nextIndex = (nextIndex + 1) % MESSAGES.length];
                return (typeof nextMsg === 'function') ? nextMsg() : nextMsg;
            }
        };
    })();

    return {
        on: eventSource.on,
        showLoadingChannels() {
            triggerNewMessage('Loading Channels...');
        },
        showSelectChannel() {
            triggerNewMessage('Select a channel');
        },
        showTuningInToChannel(channelName) {
            triggerNewMessage(`Tuning in to the ${channelName} channel...`);
        },
        showTuningInToUserChannel(channelName) {
            triggerNewMessage(`Tuning in to ${channelName}...`);
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