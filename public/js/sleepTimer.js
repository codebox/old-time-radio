const sleepTimer = (() => {
    "use strict";

    const MILLIS_PER_SECOND = 1000;

    let endTimeMillis, interval, onSleepHandler, onTickHandler;
    const timer = {
        start(minutes) {
            endTimeMillis = Date.now() + minutes *  MILLIS_PER_SECOND;
            if (!interval) {
                interval = setInterval(() => {
                    const secondsRemaining = Math.floor((endTimeMillis - Date.now()) / MILLIS_PER_SECOND);
                    if (secondsRemaining > 0) {
                        onTickHandler(secondsRemaining);
                    } else {
                        timer.stop();
                        onSleepHandler();
                    }
                }, MILLIS_PER_SECOND);
            }
        },
        stop() {
            clearInterval(interval);
            interval = null;
        },
        isStarted() {
            return !!interval;
        },
        onTick(handler) {
            onTickHandler = handler;
        },
        onSleep(handler) {
            onSleepHandler = handler;
        }
    };
    return timer;
})();