import type {Generator} from "./types.mjs";

export function generator<T>(items: T[]): Generator<T> {
    if (items.length === 0) {
        throw new Error("array is empty");
    }

    let nextIndex = 0;
    return {
        next() {
            return items[nextIndex++ % items.length];
        },
        get length() {
            return items.length;
        }
    };
}

export function deepEquals(a: any, b: any): boolean{
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== 'object' || typeof b !== 'object') return false;

    const keys = Object.keys(a);
    if (keys.length !== Object.keys(b).length) return false;

    return keys.every(key => deepEquals(a[key], b[key]));
}