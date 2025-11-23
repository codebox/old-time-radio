import { log } from "./log.mjs";
function getNextShow(showCounts) {
    let bestShowSoFar = null, bestScoreSoFar = -1;
    showCounts.forEach(({ initial, remaining }, showId) => {
        const proportionRemaining = remaining / initial;
        if (proportionRemaining > bestScoreSoFar) {
            bestShowSoFar = showId;
            bestScoreSoFar = proportionRemaining;
        }
    });
    return bestShowSoFar;
}
export function schedule(initialShowCounts, afterEach) {
    const results = [], showCounts = new Map();
    initialShowCounts.forEach((initial, showId) => {
        if (initial > 0) {
            showCounts.set(showId, { initial, remaining: initial });
        }
        else {
            log.warn(`Show ${showId} has no episodes, skipping`);
        }
    });
    while (showCounts.size > 0) {
        const nextShowId = getNextShow(showCounts);
        results.push(nextShowId);
        showCounts.get(nextShowId).remaining--;
        if (showCounts.get(nextShowId).remaining <= 0) {
            showCounts.delete(nextShowId);
        }
        afterEach(results);
    }
    return results;
}
export function generator(items) {
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
export function deepEquals(a, b) {
    if (a === b)
        return true;
    if (a == null || b == null)
        return false;
    if (typeof a !== 'object' || typeof b !== 'object')
        return false;
    const keys = Object.keys(a);
    if (keys.length !== Object.keys(b).length)
        return false;
    return keys.every(key => deepEquals(a[key], b[key]));
}
//# sourceMappingURL=utils.mjs.map