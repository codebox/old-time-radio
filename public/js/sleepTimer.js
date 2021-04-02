function buildSleepTimer() {
    "use strict";

    const MILLIS_PER_SECOND = 1000, SECONDS_PER_MINUTE = 60,
        eventSource = buildEventSource('sleep');

    let endTimeMillis, interval;

    function onTick() {
        const secondsRemaining = Math.round((endTimeMillis - Date.now()) / MILLIS_PER_SECOND); //TODO
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
            endTimeMillis = Date.now() + minutes *  MILLIS_PER_SECOND;
            onTick();
            if (!interval) {
                interval = setInterval(onTick, MILLIS_PER_SECOND);
            }
        },
        stop() {
            clearInterval(interval);
            interval = null;
        }
    };

    return timer;
}