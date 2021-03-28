function buildSleepTimer() {
    "use strict";

    const MILLIS_PER_SECOND = 1000, SECONDS_PER_MINUTE = 60,
        eventTarget = new EventTarget();

    let endTimeMillis, interval;

    function onTick() {
        const secondsRemaining = Math.round((endTimeMillis - Date.now()) / MILLIS_PER_SECOND);
        if (secondsRemaining > 0) {
            trigger(EVENT_SLEEP_TIMER_TICK, secondsRemaining);
        } else {
            timer.stop();
            trigger(EVENT_SLEEP_TIMER_DONE);
        }
    }

    function trigger(eventName, eventData) {
        console.log('EVENT timer', eventName);
        const event = new Event(eventName);
        event.data = eventData;
        eventTarget.dispatchEvent(event);
    }

    const timer = {
        on(eventName, handler) {
            eventTarget.addEventListener(eventName, handler);
        },
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