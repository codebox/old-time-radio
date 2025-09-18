
function buildSummaryManager(eventSource) {
    const SUMMARY_DURATION_MILLIS = config.summary.displayDurationMillis;
    let timeout, state = {text: null, isVisible: false};

    function cancelTimeout() {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
    }

    return {
        on: eventSource.on,
        setText(summaryText) {
            state.text = summaryText;
        },
        showAndThenHide() {
            this.show();
            timeout = setTimeout(() => this.hide(), SUMMARY_DURATION_MILLIS);
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