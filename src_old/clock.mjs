const MILLISECONDS_PER_SECOND = 1000;
class Clock {
    now() {
        return this.nowMillis() / MILLISECONDS_PER_SECOND;
    }
    nowMillis() {
        return Date.now();
    }
}
export const clock = new Clock();
export const ONE_HOUR = 60 * 60;
//# sourceMappingURL=clock.mjs.map