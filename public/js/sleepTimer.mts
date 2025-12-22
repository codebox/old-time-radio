import { buildClock } from './clock.mjs';
import { EVENT_SLEEP_TIMER_TICK, EVENT_SLEEP_TIMER_DONE } from './events.mjs';
import type { SleepTimer, EventSource } from './types.mjs';

export function buildSleepTimer(eventSource: EventSource): SleepTimer {
    const ONE_SECOND_IN_MILLIS = 1000, SECONDS_PER_MINUTE = 60, clock = buildClock();

    let endTimeSeconds: number, interval: ReturnType<typeof setInterval> | null = null, minutesRequested: number | null = null;

    function onTick() {
        const secondsRemaining = endTimeSeconds - clock.nowSeconds();
        if (secondsRemaining > 0) {
            eventSource.trigger(EVENT_SLEEP_TIMER_TICK, secondsRemaining);
        } else {
            timer.stop();
            eventSource.trigger(EVENT_SLEEP_TIMER_DONE);
        }
    }

    const timer: SleepTimer = {
        on: eventSource.on,
        start(minutes: number) {
            minutesRequested = minutes;
            endTimeSeconds = clock.nowSeconds() + minutes * SECONDS_PER_MINUTE;
            onTick();
            if (!interval) {
                interval = setInterval(onTick, ONE_SECOND_IN_MILLIS);
            }
        },
        stop() {
            if (interval) {
                clearInterval(interval);
                interval = null;
            }
            minutesRequested = null;
        },
        getMinutesRequested(): number | null {
            return minutesRequested;
        }
    };

    return timer;
}
