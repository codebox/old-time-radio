
function buildSummaryManager(eventSource) {
    const WPM = config.summary.wpmReadingSpeed;
    let timeout, state = {text: null, isVisible: false};

    function cancelTimeout() {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
    }

    function calculateDisplayIntervalInMillis(text) {
        const wordCount = text.trim().split(/\s+/).length,
            readingTimeInMinutes = wordCount / WPM,
            readingTimeInMillis = Math.ceil(readingTimeInMinutes * 60 * 1000);

        return readingTimeInMillis;
    }

    return {
        on: eventSource.on,
        setText(summaryText) {
            state.text = summaryText;
        },
        showAndThenHide() {
            this.show();
            timeout = setTimeout(() => this.hide(), calculateDisplayIntervalInMillis(state.text));
        },
        show() {
            cancelTimeout();
            if (state.text) {
                state.isVisible = true;
                eventSource.trigger(EVENT_SHOW_SUMMARY, state.text);
            }
        },
        hide() {
            state.isVisible = false;
            eventSource.trigger(EVENT_HIDE_SUMMARY);
        },
        clear() {
            state.text = null;
            state.isVisible = false;
            eventSource.trigger(EVENT_CLEAR_SUMMARY);
        },
        toggle() {
            if (state.isVisible) {
                this.hide();
            } else {
                this.show();
            }
        }
    };
}