import { config } from './config.mjs';
import { EVENT_SHOW_SUMMARY, EVENT_HIDE_SUMMARY, EVENT_CLEAR_SUMMARY } from './events.mjs';
import type { SummaryManager, EventSource } from './types.mjs';

export function buildSummaryManager(eventSource: EventSource): SummaryManager {
    const WPM = config.summary.wpmReadingSpeed;
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const state = { text: null as string | null, isVisible: false };

    function cancelTimeout() {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
    }

    function calculateDisplayIntervalInMillis(text: string): number {
        const wordCount = text.trim().split(/\s+/).length,
            readingTimeInMinutes = wordCount / WPM,
            readingTimeInMillis = Math.ceil(readingTimeInMinutes * 60 * 1000);

        return readingTimeInMillis;
    }

    const manager: SummaryManager = {
        on: eventSource.on,
        setText(summaryText: string) {
            state.text = summaryText;
        },
        showAndThenHide() {
            this.show();
            if (state.text) {
                timeout = setTimeout(() => this.hide(), calculateDisplayIntervalInMillis(state.text));
            }
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

    return manager;
}
