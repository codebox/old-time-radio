import {config} from "./config.mjs";
import type {
    ChannelCode,
    ChannelId,
    CurrentChannelSchedule,
    ConfigShow,
    DescriptiveId, PlayingNowAndNext,
    ShowId,
    ShowsListItem, FullChannelSchedule, Episode
} from "./types.mjs";
import { LRUCache } from 'lru-cache'
import type {Seconds} from "./clock.mjs";
import {clock} from "./clock.mjs";
import {log} from "./log.mjs";
import {buildShowIdsFromChannelCode} from "./channelCodes.mjs";
import {shows} from "./shows.mjs";
import {schedule} from "./utils.mjs";

type SchedulerStopCondition = (currentPlaylistDuration: Seconds, currentPlaylistSize: number) => boolean;
type SchedulePosition = {itemIndex: number, itemOffset: Seconds};

const MAX_SCHEDULE_LENGTH = 24 * 60 * 60 as Seconds,
    START_TIME = 1595199600 as Seconds; // 2020-07-20 00:00:00

export class Scheduler {
    private cache: LRUCache<ChannelId,FullChannelSchedule>;

    constructor() {
        this.cache = new LRUCache<ChannelId,FullChannelSchedule>({
            max: config.cache.maxItems,
            onInsert: (_, key) => {
                log.debug(`Adding schedule for channel ${key} to cache`);
            },
            fetchMethod: (key) => {
                log.debug(`Calculating schedule for channel ${key}`);
                return this.calculateFullScheduleForChannel(key);
            }
        });
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

    private calculateFullScheduleForChannel(channelId: ChannelId): Promise<FullChannelSchedule> {
        const showIds = this.getShowIdsForChannelId(channelId);

        return Promise.all(showIds.map(showId => shows.getEpisodesForShow(showId))).then(showScheduleItemsForAllShows => {
            const totalChannelDuration = showScheduleItemsForAllShows.flatMap(scheduleItem => scheduleItem).reduce((acc, item) => acc + item.length, 0) as Seconds,
                showCounts = new Map<ShowId, number>();

            showIds.forEach((showId, i) => {
                const showScheduleItems = showScheduleItemsForAllShows[i];
                showCounts.set(showId, showScheduleItems.length);
            });

            const scheduleResults = schedule(showCounts, () => {}),
                fullSchedule = [] as Episode[];

            scheduleResults.forEach((showId) => {
                const nextItem = showScheduleItemsForAllShows[showId].shift();
                fullSchedule.push(nextItem);
            });

            return {
                list: fullSchedule,
                length: totalChannelDuration
            };
        });
    }

    private getFullScheduleForChannel(channelId: ChannelId): Promise<FullChannelSchedule> {
        return this.cache.fetch(channelId);
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
        return this.getFullScheduleForChannel(channelId).then(fullSchedule => {
            const currentPosition = this.getCurrentSchedulePosition(fullSchedule);
            return this.getCurrentSchedule(fullSchedule, currentPosition, stopCondition);
        });
    }

    getScheduleForChannel(channelId: ChannelId, length: Seconds) {
        return this.getSchedule(channelId, this.playlistReachedMinDuration(Math.min(length, MAX_SCHEDULE_LENGTH) as Seconds));
    }

    getPlayingNowAndNext(channelId: ChannelId) {
        // min length of '3' guarantees we get the current show and the next show even if there are commercials playing between them
        return this.getSchedule(channelId, this.playlistContainsRequiredNumberOfItems(3));
    }

}