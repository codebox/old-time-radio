const sleepTimer = (() => {
    "use strict";
    const MILLIS_PER_SECOND = 1000, TICK_INTERVAL_SECONDS = 1;
    let timerStartedHandler, timerCancelledHandler, timerFinishedHandler, timerTickHandler, finishTime;

    timerStartedHandler = timerCancelledHandler = timerFinishedHandler = timerTickHandler = () => {};

    function tick() {
        setTimeout(() => {
            if (finishTime) {
                const secondsUntilTimerFinishes = (finishTime - Date.now()) / MILLIS_PER_SECOND;
                if (secondsUntilTimerFinishes <= 0) {
                    finishTime = 0;
                    timerFinishedHandler();
                } else {
                    timerTickHandler(secondsUntilTimerFinishes);
                    tick();
                }
            }
        }, TICK_INTERVAL_SECONDS * MILLIS_PER_SECOND);
    }

    return {
        start(timeSeconds) {
            this.stop();
            finishTime = Date.now() + timeSeconds * MILLIS_PER_SECOND;
            tick();
            timerStartedHandler(timeSeconds);
        },
        stop() {
            if (finishTime) {
                finishTime = 0;
                timerCancelledHandler();
            }
        },
        onTimerStarted(handler) {
            timerStartedHandler = handler;
        },
        onTimerTick(handler) {
            timerTickHandler = handler;
        },
        onTimerCancelled(handler) {
            timerCancelledHandler = handler;
        },
        onTimerFinish(handler) {
            timerFinishedHandler = handler;
        }
    };
})();