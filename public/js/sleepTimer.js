function buildSleepTimer(eventSource) {
    "use strict";

    const MILLIS_PER_SECOND = 1000, SECONDS_PER_MINUTE = 60;

    let endTimeMillis, interval, minutesRequested;

    function onTick() {
        const secondsRemaining = Math.round((endTimeMillis - Date.now()) / MILLIS_PER_SECOND);
        if (secondsRemaining > 0) {
            eventSource.trigger(EVENT_SLEEP_TIMER_TICK, secondsRemaining);
        } else {
            timer.stop();
            eventSource.trigger(EVENT_SLEEP_TIMER_DONE);
        }
    }

    const timer = {
        on: eventSource.on,
        start(minutes) {
            minutesRequested = minutes;
            endTimeMillis = Date.now() + minutes *  MILLIS_PER_SECOND * SECONDS_PER_MINUTE;
            onTick();
            if (!interval) {
                interval = setInterval(onTick, MILLIS_PER_SECOND);
            }
        },
        stop() {
            clearInterval(interval);
            interval = null;
            minutesRequested = null;
        },
        getMinutesRequested() {
            return minutesRequested;
        }
    };

    return timer;
}