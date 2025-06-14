import {config} from "./config.mjs";
import type {
    ChannelCode,
    ChannelId,
    CurrentChannelSchedule,
    ConfigShow,
    DescriptiveId, PlayingNowAndNext,
    ShowIndex,
    ShowsListItem, FullChannelSchedule, ChannelScheduleItem
} from "./types.mjs";

import type {Seconds} from "./clock.mjs";
import {clock} from "./clock.mjs";

type SchedulerStopCondition = (currentPlaylistDuration: Seconds, currentPlaylistSize: number) => boolean;
type SchedulePosition = {itemIndex: number, itemOffset: Seconds};

const MAX_SCHEDULE_LENGTH = 24 * 60 * 60 as Seconds,
    START_TIME = 1595199600 as Seconds; // 2020-07-20 00:00:00

export class Scheduler {
    constructor() {

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

    private getFullScheduleForChannel(channelId: ChannelId): Promise<FullChannelSchedule> {
        /*
        results should be cached/re-used
        get shows in channel
        get episodes in shows
         */
        return Promise.resolve({} as FullChannelSchedule); //TODO
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
        const clientPlaylist = [] as ChannelScheduleItem[];

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