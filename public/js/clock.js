function buildClock() {
    const MILLISECONDS_PER_SECOND = 1000;
    return {
        nowSeconds() {
            return Math.round(this.nowMillis() / MILLISECONDS_PER_SECOND);
        },
        nowMillis() {
            return Date.now();
        }
    }
}