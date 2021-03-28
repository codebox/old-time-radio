function buildMessageManager(model) {
    "use strict";
    const eventTarget = new EventTarget(),
        TEMP_MESSAGE_DURATION = 5 * 1000;

    let persistentMessage, temporaryMessage;

    function trigger(eventName, eventData) {
        console.log('EVENT msg' + eventName);
        const event = new Event(eventName);
        event.data = eventData;
        eventTarget.dispatchEvent(event);
    }

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
        trigger(EVENT_NEW_MESSAGE, {text, isTemp});
    }

    const cannedMessages = (() => {
        function showNext() {
            if (model.playlist && model.playlist[0]){
                return `Up next: ${model.playlist.filter(item => !item.commercial)[0].name}`;
            }
        }

        const MESSAGES = [
            'All audio hosted by The Internet Archive. Find more at http://archive.org',
            'To check the channel schedules, click the menu ↗',
            'Streaming shows from the Golden Age of Radio, 24 hours a day',
            'Volume too loud? You can turn it down, click the menu ↗',
            'Please support The Internet Archive by donating at http://archive.org/donate',
            'Build your own channel with your favourite shows, click the menu ↗'
        ].map(textMessage => [showNext, textMessage]).flatMap(m => m);

        let nextIndex = 0;
        return {
            next() {
                const nextMsg = MESSAGES[nextIndex = (nextIndex + 1) % MESSAGES.length];
                return (typeof nextMsg === 'function') ? nextMsg() : nextMsg;
            }
        };
    })();

    return {
        on(eventName, handler) {
            eventTarget.addEventListener(eventName, handler);
        },
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
        }
    };
}