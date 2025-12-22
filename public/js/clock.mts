import type { Clock } from './types.mjs';

export function buildClock(): Clock {
    const MILLISECONDS_PER_SECOND = 1000;
    return {
        nowSeconds() {
            return Math.round(this.nowMillis() / MILLISECONDS_PER_SECOND);
        },
        nowMillis() {
            return Date.now();
        }
    };
}
