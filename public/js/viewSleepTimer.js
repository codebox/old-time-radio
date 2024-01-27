function buildSleepTimerView(eventSource) {
    const elSleepTimerTime = document.getElementById('sleepTimerTime'),
        elSleepTimerRunningDisplay = document.getElementById('sleepTimerRunningDisplay'),
        elSleepTimerButtons = document.getElementById('sleepTimerButtons'),

        HIDDEN_CSS_CLASS = 'hidden',
        INTERVALS = config.sleepTimer.intervals;

    function formatTimePart(value) {
        return (value < 10 ? '0' : '') + value;
    }

    function setSelected(selectedButton) {
        elSleepTimerButtons.querySelectorAll('button').forEach(button => {
            const isSelected = button === selectedButton;
            button.ariaChecked = '' + isSelected;
            button.classList.toggle('selected', isSelected);
        });
    }

    return {
        init() {
            elSleepTimerButtons.innerHTML = '';
            INTERVALS.forEach(intervalMinutes => {
                const text = `${intervalMinutes} Minutes`;
                const button = document.createElement('button');
                button.setAttribute('role', 'radio');
                button.setAttribute('aria-controls', elSleepTimerTime.id);
                button.classList.add('menuButton');
                button.setAttribute('data-umami-event', `sleep-${intervalMinutes}`);
                button.innerHTML = text;

                button.onclick = () => {
                    setSelected(button);
                    eventSource.trigger(EVENT_SLEEP_TIMER_CLICK, intervalMinutes);
                };

                elSleepTimerButtons.appendChild(button);
            });
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