"use strict";
const MILLISECONDS_PER_SECOND = 1000;

module.exports = {
    now() {
        return this.nowMillis() / MILLISECONDS_PER_SECOND;
    },
    nowMillis() {
        return Date.now();
    }
};
