const MILLISECONDS_PER_SECOND = 1000;

export type Seconds = number & { readonly __brand: unique symbol };
export type Millis = number & { readonly __brand: unique symbol };
export type Hours = number & { readonly __brand: unique symbol };

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