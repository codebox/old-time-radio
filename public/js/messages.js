const messageManager = (() => {
    "use strict";
    const PRINT_INTERVAL = 50,
        TEMP_MESSAGE_INTERVAL = 3 * 60 * 1000,
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
            console.log('end of print')
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
        const MESSAGES = [
            'You are listening to audio from The Internet Archive. Find more at http://archive.org',
            'Please support The Internet Archive by donating at http://archive.org/donate',
            'All audio on this site is hosted by The Internet Archive. Visit them at http://archive.org',
            () => {
                if (model.playlist && model.playlist[0]){
                    return `Up next: ${model.playlist[0].name}`;
                }
            }
        ];
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
        if (!interval && (nextMessage = cannedMessages.next())) {
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
            if (!model.channels) {
                setMessage('Loading channels...');

            } else if (!model.channel) {
                setMessage('Select a channel');

            } else if (!model.track) {
                setMessage(`Loading ${model.channel}...`);

            } else {
                setMessage(`Playing ${model.track}`);
            }
        }
    };
})();