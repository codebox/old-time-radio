
function buildSummaryManager(eventSource) {
    const SUMMARY_DURATION_MILLIS = config.summary.displayDurationMillis;
    let timeout;

    function cancelTimeout() {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
    }

    return {
        on: eventSource.on,
        showSummary(summaryText) {
            cancelTimeout();
            if (summaryText) {
                // we call this even if there is no summary text, to ensure any previous summary is cleared
                timeout = setTimeout(() => {
                    this.hideSummary();
                }, SUMMARY_DURATION_MILLIS);

                eventSource.trigger(EVENT_NEW_SUMMARY, summaryText);
            }
        },
        hideSummary() {
            cancelTimeout();
            eventSource.trigger(EVENT_HIDE_SUMMARY);
        }
    };
}