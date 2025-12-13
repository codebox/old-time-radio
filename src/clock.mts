import type {Millis, Seconds} from "./types.mjs";

const MILLISECONDS_PER_SECOND = 1000;

class Clock {
    now(): Seconds {
        return this.nowMillis() / MILLISECONDS_PER_SECOND as Seconds;
    }
    nowMillis(): Millis {
        return Date.now() as Millis;
    }
}

export const clock = new Clock();
export const ONE_HOUR = 60 * 60 as Seconds;