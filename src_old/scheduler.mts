import {config, configHelper} from "./config.mjs";
import type {
    ChannelCode,
    ChannelId,
    CurrentChannelSchedule,
    ShowId,
    FullChannelSchedule, Episode, ScheduleResultsAfterInsertHandler, ScheduleResults, ShowCounts
} from "./types.mjs";
import type {Seconds} from "./clock.mjs";
import {clock} from "./clock.mjs";
import {buildShowIdsFromChannelCode} from "./channelCodes.mjs";
import {shows} from "./shows.mjs";
import {generator, schedule} from "./utils.mjs";
import {Cache} from "./cache.mjs";
import {log} from "../src/log.mjs";

type SchedulerStopCondition = (currentPlaylistDuration: Seconds, currentPlaylistSize: number) => boolean;
type SchedulePosition = {itemIndex: number, itemOffset: Seconds};

const DEFAULT_SCHEDULE_LENGTH = 60 * 60 as Seconds,
    MAX_SCHEDULE_LENGTH = 24 * 60 * 60 as Seconds,
    START_TIME = 1595199600 as Seconds; // 2020-07-20 00:00:00



export class Scheduler {
    private cache: Cache<ChannelId, FullChannelSchedule>;

    constructor() {
        this.cache = new Cache<ChannelId, FullChannelSchedule>("schedules", channelId => this.calculateFullScheduleForChannel(channelId as ChannelId), config.caches.scheduleCacheMaxItems);
    }

    private playlistReachedMinDuration(minDuration: Seconds): SchedulerStopCondition {
        return (currentPlaylistDuration: Seconds) => {
            return currentPlaylistDuration >= minDuration;
        };
    }

    private playlistContainsRequiredNumberOfItems(numberOfItems: number): SchedulerStopCondition {
        return (_: Seconds, currentPlaylistSize: number) => {
            return currentPlaylistSize >= numberOfItems;
        };
    }

    private getShowIdsForChannelId(channelId: ChannelId): ShowId[] {
        const configChannel = config.channels.find(channel => channel.name === channelId);
        if (configChannel) {
            return configChannel.shows;
        } else {
            return buildShowIdsFromChannelCode(channelId as ChannelCode);
        }
    }

    private async calculateFullScheduleForChannel(channelId: ChannelId): Promise<FullChannelSchedule> {
        const allShowIds = this.getShowIdsForChannelId(channelId),
            nonCommercialShowIds = allShowIds.filter(showId => !configHelper.getShowFromId(showId).isCommercial),
            commercialShowIds = allShowIds.filter(showId => configHelper.getShowFromId(showId).isCommercial),
            showScheduleItems = (await Promise.all(allShowIds.map(showId => shows.getEpisodesForShow(showId)))).map(generator),
            showIdToIndex = new Map(allShowIds.map((showId, index) => [showId, index])),
            nonCommercialShowCounts = new Map<ShowId, number>();

        nonCommercialShowIds.forEach((showId, i) => {
            const index = showIdToIndex.get(showId)
            nonCommercialShowCounts.set(showId, showScheduleItems[index].length);
        });

        let afterEach: ScheduleResultsAfterInsertHandler;
        if (commercialShowIds.length > 0) {
            const g = generator(commercialShowIds);
            afterEach = results => results.push(g.next());
        } else {
            afterEach = () => {};
        }

        const scheduleResults = schedule(nonCommercialShowCounts, afterEach),
            fullSchedule = [] as Episode[];

        scheduleResults.forEach((showId) => {
            const index = showIdToIndex.get(showId),
                nextItem = showScheduleItems[index].next();

            fullSchedule.push(nextItem);
        });

        const totalChannelDuration = fullSchedule.map(item => item.length).reduce((a, b) => a + b, 0) as Seconds;

        return {
            list: fullSchedule,
            length: totalChannelDuration
        };
    }



    private getCurrentSchedulePosition(fullSchedule: FullChannelSchedule): SchedulePosition {
        const scheduleDuration = fullSchedule.length as Seconds,
            offsetSinceStartOfPlay = (clock.now() - START_TIME) % scheduleDuration as Seconds,
            numberOfItemsInSchedule = fullSchedule.list.length;
        let i = 0, playlistItemOffset = 0 as Seconds;

        let initialOffset: Seconds;
        while (true) {
            const playlistItem = fullSchedule.list[i % numberOfItemsInSchedule],
                itemIsPlayingNow = playlistItemOffset + playlistItem.length > offsetSinceStartOfPlay;

            if (itemIsPlayingNow) {
                initialOffset = (offsetSinceStartOfPlay - playlistItemOffset) as Seconds;
                break;
            }
            playlistItemOffset = playlistItemOffset + playlistItem.length as Seconds;
            i++;
        }

        return {
            itemIndex: i % numberOfItemsInSchedule,
            itemOffset: initialOffset
        };
    }

    private getCurrentSchedule(fullSchedule: FullChannelSchedule, startPosition: SchedulePosition, stopCondition: SchedulerStopCondition): CurrentChannelSchedule {
        const clientPlaylist = [] as Episode[];

        let clientPlaylistDuration = -startPosition.itemOffset as Seconds,
            fullScheduleIndex = startPosition.itemIndex;

        while (!stopCondition(clientPlaylistDuration, clientPlaylist.length)) {
            const currentItem = fullSchedule.list[fullScheduleIndex];
            clientPlaylist.push(currentItem);
            clientPlaylistDuration = clientPlaylistDuration + currentItem.length as Seconds;
            fullScheduleIndex = (fullScheduleIndex + 1) % fullSchedule.list.length;
        }

        return {
            list: clientPlaylist,
            initialOffset: startPosition.itemOffset
        };
    }

    private getSchedule(channelId: ChannelId, stopCondition: SchedulerStopCondition): Promise<CurrentChannelSchedule> {
        return this.cache.get(channelId).then(fullSchedule => {
            const currentPosition = this.getCurrentSchedulePosition(fullSchedule);
            return this.getCurrentSchedule(fullSchedule, currentPosition, stopCondition);
        });
    }

    getScheduleForChannel(channelId: ChannelId, length: Seconds) {
        return this.getSchedule(channelId, this.playlistReachedMinDuration(Math.min(length || DEFAULT_SCHEDULE_LENGTH, MAX_SCHEDULE_LENGTH) as Seconds));
    }

    getPlayingNowAndNext(channelId: ChannelId) {
        // min length of '3' guarantees we get the current show and the next show even if there are commercials playing between them
        return this.getSchedule(channelId, this.playlistContainsRequiredNumberOfItems(3));
    }

    clearCache() {
        return this.cache.clear();
    }
}

export const scheduler = new Scheduler();