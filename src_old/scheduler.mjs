import { config, configHelper } from "./config.mjs";
import { clock } from "./clock.mjs";
import { buildShowIdsFromChannelCode } from "./channelCodes.mjs";
import { shows } from "./shows.mjs";
import { generator, schedule } from "./utils.mjs";
import { Cache } from "./cache.mjs";
import { log } from "../src/log.mjs";
const DEFAULT_SCHEDULE_LENGTH = 60 * 60, MAX_SCHEDULE_LENGTH = 24 * 60 * 60, START_TIME = 1595199600; // 2020-07-20 00:00:00
export class Scheduler {
    cache;
    constructor() {
        this.cache = new Cache("schedules", channelId => this.calculateFullScheduleForChannel(channelId), config.caches.scheduleCacheMaxItems);
    }
    playlistReachedMinDuration(minDuration) {
        return (currentPlaylistDuration) => {
            return currentPlaylistDuration >= minDuration;
        };
    }
    playlistContainsRequiredNumberOfItems(numberOfItems) {
        return (_, currentPlaylistSize) => {
            return currentPlaylistSize >= numberOfItems;
        };
    }
    getShowIdsForChannelId(channelId) {
        const configChannel = config.channels.find(channel => channel.name === channelId);
        if (configChannel) {
            return configChannel.shows;
        }
        else {
            return buildShowIdsFromChannelCode(channelId);
        }
    }
    async calculateFullScheduleForChannel(channelId) {
        const allShowIds = this.getShowIdsForChannelId(channelId), nonCommercialShowIds = allShowIds.filter(showId => !configHelper.getShowFromId(showId).isCommercial), commercialShowIds = allShowIds.filter(showId => configHelper.getShowFromId(showId).isCommercial), showScheduleItems = (await Promise.all(allShowIds.map(showId => shows.getEpisodesForShow(showId)))).map(generator), showIdToIndex = new Map(allShowIds.map((showId, index) => [showId, index])), nonCommercialShowCounts = new Map();
        nonCommercialShowIds.forEach((showId, i) => {
            const index = showIdToIndex.get(showId);
            nonCommercialShowCounts.set(showId, showScheduleItems[index].length);
        });
        let afterEach;
        if (commercialShowIds.length > 0) {
            const g = generator(commercialShowIds);
            afterEach = results => results.push(g.next());
        }
        else {
            afterEach = () => { };
        }
        const scheduleResults = schedule(nonCommercialShowCounts, afterEach), fullSchedule = [];
        scheduleResults.forEach((showId) => {
            const index = showIdToIndex.get(showId), nextItem = showScheduleItems[index].next();
            fullSchedule.push(nextItem);
        });
        const totalChannelDuration = fullSchedule.map(item => item.length).reduce((a, b) => a + b, 0);
        return {
            list: fullSchedule,
            length: totalChannelDuration
        };
    }
    getCurrentSchedulePosition(fullSchedule) {
        const scheduleDuration = fullSchedule.length, offsetSinceStartOfPlay = (clock.now() - START_TIME) % scheduleDuration, numberOfItemsInSchedule = fullSchedule.list.length;
        let i = 0, playlistItemOffset = 0;
        let initialOffset;
        while (true) {
            const playlistItem = fullSchedule.list[i % numberOfItemsInSchedule], itemIsPlayingNow = playlistItemOffset + playlistItem.length > offsetSinceStartOfPlay;
            if (itemIsPlayingNow) {
                initialOffset = (offsetSinceStartOfPlay - playlistItemOffset);
                break;
            }
            playlistItemOffset = playlistItemOffset + playlistItem.length;
            i++;
        }
        return {
            itemIndex: i % numberOfItemsInSchedule,
            itemOffset: initialOffset
        };
    }
    getCurrentSchedule(fullSchedule, startPosition, stopCondition) {
        const clientPlaylist = [];
        let clientPlaylistDuration = -startPosition.itemOffset, fullScheduleIndex = startPosition.itemIndex;
        while (!stopCondition(clientPlaylistDuration, clientPlaylist.length)) {
            const currentItem = fullSchedule.list[fullScheduleIndex];
            clientPlaylist.push(currentItem);
            clientPlaylistDuration = clientPlaylistDuration + currentItem.length;
            fullScheduleIndex = (fullScheduleIndex + 1) % fullSchedule.list.length;
        }
        return {
            list: clientPlaylist,
            initialOffset: startPosition.itemOffset
        };
    }
    getSchedule(channelId, stopCondition) {
        return this.cache.get(channelId).then(fullSchedule => {
            const currentPosition = this.getCurrentSchedulePosition(fullSchedule);
            return this.getCurrentSchedule(fullSchedule, currentPosition, stopCondition);
        });
    }
    getScheduleForChannel(channelId, length) {
        return this.getSchedule(channelId, this.playlistReachedMinDuration(Math.min(length || DEFAULT_SCHEDULE_LENGTH, MAX_SCHEDULE_LENGTH)));
    }
    getPlayingNowAndNext(channelId) {
        // min length of '3' guarantees we get the current show and the next show even if there are commercials playing between them
        return this.getSchedule(channelId, this.playlistContainsRequiredNumberOfItems(3));
    }
    clearCache() {
        return this.cache.clear();
    }
}
export const scheduler = new Scheduler();
//# sourceMappingURL=scheduler.mjs.map