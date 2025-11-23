import type {
    ChannelId, Schedule, Seconds, CurrentChannelSchedule, Episode, FullChannelSchedule,
    ShowId, ChannelCode
} from "./types.mjs";
import {Cache} from "./cache.mjs";
import {log} from "./log.mjs";
import {config} from "./config.mjs";
import {generator} from "./utils.mjs";
import {clock} from "./clock.mjs";
import {ChannelCodeService} from "./channelCodeService.mjs";
import type {DataService} from "./dataService.mjs";

type SchedulerStopCondition = (currentPlaylistDuration: Seconds, currentPlaylistSize: number) => boolean;
type SchedulePosition = {itemIndex: number, itemOffset: Seconds};
type ShowCountsWithInitialCount = Map<ShowId, {initial: number, remaining: number}>;
type ScheduleResultsAfterInsertHandler = (results: ScheduleResults) => void;
type ShowCounts = Map<ShowId, number>;
type ScheduleResults = ShowId[]

const DEFAULT_SCHEDULE_LENGTH = 60 * 60 as Seconds,
    MAX_SCHEDULE_LENGTH = 24 * 60 * 60 as Seconds,
    START_TIME = 1595199600 as Seconds; // 2020-07-20 00:00:00

export class ScheduleService {
    private channelCodeService: ChannelCodeService;
    private dataService: DataService;
    private cache: Cache<ChannelId, FullChannelSchedule>;

    constructor(channelCodeService: ChannelCodeService, dataService: DataService) {
        this.channelCodeService = channelCodeService;
        this.dataService = dataService;
        this.cache = new Cache<ChannelId, FullChannelSchedule>("schedules", channelId => this.calculateFullScheduleForChannel(channelId as ChannelId), config.scheduleCacheMaxItems);
    }

    private async calculateFullScheduleForChannel(channelId: ChannelId): Promise<FullChannelSchedule> {
        const allShowIds = this.getShowIdsForChannelId(channelId),
            nonCommercialShowIds = allShowIds.filter(showId => !config.getShowConfigById(showId).isCommercial),
            commercialShowIds = allShowIds.filter(showId => config.getShowConfigById(showId).isCommercial),
            showScheduleItems = (await Promise.all(allShowIds.map(showId => this.dataService.getEpisodesForShow(showId)))).map(generator),
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

        const scheduleResults = this.schedule(nonCommercialShowCounts, afterEach),
            fullSchedule = [] as Episode[];

        scheduleResults.forEach((showId) => {
            const index = showIdToIndex.get(showId),
                nextItem = showScheduleItems[index].next();

            fullSchedule.push(nextItem);
        });

        const totalChannelDuration = fullSchedule.map(item => item.duration).reduce((a, b) => a + b, 0) as Seconds;

        return {
            list: fullSchedule,
            length: totalChannelDuration
        };
    }

    private getNextShow(showCounts: ShowCountsWithInitialCount): ShowId {
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

    private schedule(initialShowCounts: ShowCounts, afterEach: ScheduleResultsAfterInsertHandler): ScheduleResults {
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
            const nextShowId = this.getNextShow(showCounts);

            results.push(nextShowId);

            showCounts.get(nextShowId).remaining--;
            if (showCounts.get(nextShowId).remaining <= 0) {
                showCounts.delete(nextShowId);
            }

            afterEach(results);
        }

        return results;
    }

    private getShowIdsForChannelId(channelId: ChannelId): ShowId[] {
        const configChannel = config.channels.find(channel => channel.name === channelId);
        if (configChannel) {
            return configChannel.shows;
        } else {
            return this.channelCodeService.getShowNumbersFromCode(channelId as ChannelCode).map(showNumber => config.getShowConfigByNumber(showNumber).id);
        }
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

    private getCurrentSchedule(fullSchedule: FullChannelSchedule, startPosition: SchedulePosition, stopCondition: SchedulerStopCondition): CurrentChannelSchedule {
        const clientPlaylist = [] as Episode[];

        let clientPlaylistDuration = -startPosition.itemOffset as Seconds,
            fullScheduleIndex = startPosition.itemIndex;

        while (!stopCondition(clientPlaylistDuration, clientPlaylist.length)) {
            const currentItem = fullSchedule.list[fullScheduleIndex];
            clientPlaylist.push(currentItem);
            clientPlaylistDuration = clientPlaylistDuration + currentItem.duration as Seconds;
            fullScheduleIndex = (fullScheduleIndex + 1) % fullSchedule.list.length;
        }

        return {
            list: clientPlaylist,
            initialOffset: startPosition.itemOffset
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
                itemIsPlayingNow = playlistItemOffset + playlistItem.duration > offsetSinceStartOfPlay;

            if (itemIsPlayingNow) {
                initialOffset = (offsetSinceStartOfPlay - playlistItemOffset) as Seconds;
                break;
            }
            playlistItemOffset = playlistItemOffset + playlistItem.duration as Seconds;
            i++;
        }

        return {
            itemIndex: i % numberOfItemsInSchedule,
            itemOffset: initialOffset
        };
    }

    private async getSchedule(channelId: ChannelId, stopCondition: SchedulerStopCondition): Promise<CurrentChannelSchedule> {
        return this.cache.get(channelId).then(fullSchedule => {
            const currentPosition = this.getCurrentSchedulePosition(fullSchedule);
            return this.getCurrentSchedule(fullSchedule, currentPosition, stopCondition);
        });
    }

    async getScheduleForChannel(channelId: ChannelId, length: Seconds): Promise<Schedule> {
        return this.getSchedule(channelId, this.playlistReachedMinDuration(Math.min(length || DEFAULT_SCHEDULE_LENGTH, MAX_SCHEDULE_LENGTH) as Seconds));
    }

    async getPlayingNowAndNext(channelId: ChannelId): Promise<CurrentChannelSchedule> {
        // min length of '3' guarantees we get the current show and the next show even if there are commercials playing between them
        return this.getSchedule(channelId, this.playlistContainsRequiredNumberOfItems(3));
    }
}