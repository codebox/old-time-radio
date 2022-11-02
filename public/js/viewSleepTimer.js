function buildSleepTimerView(eventSource) {
    const elSleepTimerTime = document.getElementById('sleepTimerTime'),
        elSleepTimerRunningDisplay = document.getElementById('sleepTimerRunningDisplay'),
        elSleepTimerButtons = document.getElementById('sleepTimerButtons'),
        elCancelSleepTimerButton = document.getElementById('cancelSleepTimerButton'),

        HIDDEN_CSS_CLASS = 'hidden',
        INTERVALS = config.sleepTimer.intervals;

    function formatTimePart(value) {
        return (value < 10 ? '0' : '') + value;
    }

    function setSelected(selectedButton) {
        elSleepTimerButtons.querySelectorAll('li').forEach(button => {
            button.ariaChecked = '' + (button === selectedButton);
        });
    }

    return {
        init() {
            elSleepTimerButtons.innerHTML = '';
            INTERVALS.forEach(intervalMinutes => {
                const text = `${intervalMinutes} Minutes`;
                const button = document.createElement('li');
                button.setAttribute('role', 'radio');
                button.setAttribute('aria-controls', elSleepTimerTime.id);
                button.classList.add('showButton');
                button.innerHTML = text;

                button.onclick = () => {
                    setSelected(button);
                    eventSource.trigger(EVENT_SET_SLEEP_TIMER_CLICK, intervalMinutes);
                };

                elSleepTimerButtons.appendChild(button);
            });
            elCancelSleepTimerButton.onclick = () => {
                eventSource.trigger(EVENT_CANCEL_SLEEP_TIMER_CLICK);
            };
        },
        render(totalSeconds) {
            const hours = Math.floor(totalSeconds / 3600),
                minutes = Math.floor((totalSeconds % 3600) / 60),
                seconds = totalSeconds % 60;
            elSleepTimerTime.innerHTML = `${formatTimePart(hours)}:${formatTimePart(minutes)}:${formatTimePart(seconds)}`;
        },
        setRunState(isRunning) {
            elSleepTimerRunningDisplay.classList.toggle(HIDDEN_CSS_CLASS, !isRunning);
            if (!isRunning) {
                setSelected();
            }
        }
    };
}