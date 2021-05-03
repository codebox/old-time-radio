"use strict";
const MILLISECONDS_PER_SECOND = 1000;

module.exports = {
    now() {
        return Date.now() / MILLISECONDS_PER_SECOND;
    }
};
