function buildSleepTimer(eventSource) {
    "use strict";

    const ONE_SECOND_IN_MILLIS = 1000, SECONDS_PER_MINUTE = 60, clock = buildClock();

    let endTimeSeconds, interval, minutesRequested;

    function onTick() {
        const secondsRemaining = endTimeSeconds - clock.nowSeconds();
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
            endTimeSeconds = clock.nowSeconds() + minutes * SECONDS_PER_MINUTE;
            onTick();
            if (!interval) {
                interval = setInterval(onTick, ONE_SECOND_IN_MILLIS);
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