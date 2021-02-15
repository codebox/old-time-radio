const sleepTimer = (() => {
    "use strict";

    const MILLIS_PER_SECOND = 1000, SECONDS_PER_MINUTE = 60;

    let endTimeMillis, interval, onSleepHandler = () => {}, onTickHandler = () => {};

    function onTick() {
        const secondsRemaining = Math.round((endTimeMillis - Date.now()) / MILLIS_PER_SECOND);
        if (secondsRemaining > 0) {
            onTickHandler(secondsRemaining);
        } else {
            timer.stop();
            onSleepHandler();
        }
    }

    const timer = {
        start(minutes) {
            endTimeMillis = Date.now() + minutes * SECONDS_PER_MINUTE *  MILLIS_PER_SECOND;
            onTick();
            if (!interval) {
                interval = setInterval(onTick, MILLIS_PER_SECOND);
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