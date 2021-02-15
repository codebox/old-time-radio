const messageManager = (() => {
    "use strict";
    const PRINT_INTERVAL = 40,
        TEMP_MESSAGE_INTERVAL = 60 * 1000,
        TEMP_MESSAGE_DURATION = 5 * 1000,
        STATE_SHOWING_PERSIST = 'showingPersistentMsg',
        STATE_PRINTING_PERSIST = 'printingPersistentMsg',
        STATE_SHOWING_TEMP = 'showingTempMsg',
        STATE_PRINTING_TEMP = 'printingTempMsg';

    let el, model, interval, persistentMessage, temporaryMessage, state = STATE_SHOWING_PERSIST;

    const messagePrinter = (() => {
        let interval;

        function stopPrinting() {
            clearInterval(interval);
            interval = 0;
        }

        return {
            print(msg, onComplete) {
                if (interval) {
                    stopPrinting();
                }
                const msgLen = msg.length;
                let i = 1;
                interval = setInterval(() => {
                    setMessageText((msg.substr(0,i) + (i < msgLen ? '█' : '')).padEnd(msgLen, ' '));
                    const messageComplete = i === msgLen;
                    if (messageComplete) {
                        stopPrinting();
                        onComplete();
                    } else {
                        i += 1;
                    }

                }, PRINT_INTERVAL);
            },
            stop() {
                stopPrinting();
            }
        }
    })();

    const cannedMessages = (() => {
        function showNext() {
            if (model.playlist && model.playlist[0]){
                return `Up next: ${model.playlist.filter(item => !item.commercial)[0].name}`;
            }
        }
        const CHANNEL_MESSAGES = {
            future: [],
            action: [],
            mystery: [],
            western: [],
            comedy: []
        };
        Object.keys(CHANNEL_MESSAGES).forEach(channelId => {
            CHANNEL_MESSAGES[channelId] = {
                messages: CHANNEL_MESSAGES[channelId],
                nextIndex: 0
            };
        });
        function showChannelMessage(){
            const messagesForThisChannel = CHANNEL_MESSAGES[(model.channel.id || '').toLowerCase()];
            if (messagesForThisChannel && messagesForThisChannel.messages.length) {
                const nextIndex = messagesForThisChannel.nextIndex,
                    message = messagesForThisChannel.messages[nextIndex];
                messagesForThisChannel.nextIndex = (nextIndex + 1) % messagesForThisChannel.messages.length;
                return message;
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

    function setMessageText(msg) {
        el.innerText = msg;
    }

    function setMessage(msg, isTemp) {
        if (isTemp) {
            if (state === STATE_SHOWING_PERSIST) {
                state = STATE_PRINTING_TEMP;
                messagePrinter.print(temporaryMessage = msg, () => {
                    state = STATE_SHOWING_TEMP;
                    setTimeout(() => {
                        if (temporaryMessage === msg) {
                            setMessage(persistentMessage);
                        }
                    }, TEMP_MESSAGE_DURATION);
                });

            } else {
                // ignore
            }

        } else {
            if (state === STATE_PRINTING_PERSIST || state === STATE_PRINTING_TEMP) {
                messagePrinter.stop();

            } else if (state === STATE_SHOWING_TEMP) {
                temporaryMessage = null;
            }

            state = STATE_PRINTING_PERSIST;
            messagePrinter.print(persistentMessage = msg, () => {
                state = STATE_SHOWING_PERSIST;
            });
        }
    }

    function showCannedMessage() {
        let nextMessage;
        if (!interval && !model.sleeping && (nextMessage = cannedMessages.next())) {
            setMessage(nextMessage, true);
        }
    }

    return {
        init(_el, _model) {
            el = _el;
            model = _model;
            setInterval(showCannedMessage, TEMP_MESSAGE_INTERVAL);
        },
        updateStatus() {
            if (model.sleeping) {
                setMessage('Sleeping');

            } else if (!model.channels) {
                setMessage('Loading channels...');

            } else if (!model.channel) {
                setMessage('Select a channel');

            } else if (!model.track) {
                if (model.channel.userChannel) {
                    setMessage(`Tuning in to ${model.channel.name}...`);
                } else {
                    setMessage(`Tuning in to the ${model.channel.name} channel...`);
                }

            } else {
                setMessage(`${model.track.name}`);
            }
        },
        httpError() {
            setMessage('Unable to connect to the server');
        }
    };
})();