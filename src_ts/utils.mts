import type {ScheduleResults, ScheduleResultsAfterInsertHandler, ShowCounts, ShowId} from "./types.mjs";
import {log} from "./log.mjs";

type ShowCountsWithInitialCount = Map<ShowId, {initial: number, remaining: number}>;

function getNextShow(showCounts: ShowCountsWithInitialCount): ShowId {
    let bestShowSoFar = null as ShowId | null,
        bestScoreSoFar = -1;

    showCounts.forEach(({initial, remaining}, showId) => {
        const proportionRemaining = remaining / initial;
        if (proportionRemaining > bestScoreSoFar) {
            bestShowSoFar = showId;
            bestScoreSoFar = proportionRemaining;
        }
    });

    return bestShowSoFar;
}

export function schedule(initialShowCounts: ShowCounts, afterEach: ScheduleResultsAfterInsertHandler): ScheduleResults {
    const results = [] as ScheduleResults,
        showCounts = new Map() as ShowCountsWithInitialCount;

    initialShowCounts.forEach((initial, showId) => {
        if (initial > 0) {
            showCounts.set(showId, {initial, remaining: initial});
        } else {
            log.warn(`Show ${showId} has no episodes, skipping`);
        }
    });

    while(showCounts.size > 0) {
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
