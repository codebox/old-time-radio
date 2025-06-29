import {config} from "./config.mjs";
import type {
    ChannelId,
    CurrentChannelSchedule,
    ConfigShow,
    DescriptiveId, PlayingNowAndNext,
    ShowId,
    ShowsListItem, Xml, CurrentChannelScheduleWithDetails
} from "./types.mjs";
import {buildChannelCodeFromShowIds} from "./channelCodes.mjs";
import type {Seconds} from "./clock.mjs";
import {Scheduler} from "./scheduler.mjs";
import {getSitemapXml} from "./sitemap.mjs";
import {shows} from "./shows.mjs";


function getChannelIdsForShowId(showId: ShowId) {
    return config.channels.filter(channel => channel.shows.includes(showId)).map(channel => channel.name);
}

function getDescriptiveIdForShowName(showName: string): DescriptiveId {
    return showName.toLowerCase().replace(/ /g, '-').replace(/-+/g, '-').replace(/[^a-zA-Z0-9-]/g, '') as DescriptiveId;
}

export class Service {
    private scheduler: Scheduler;

    constructor() {
        this.scheduler = new Scheduler();
    }

    private getShowsListItemFromConfigShow(configShow: ConfigShow): ShowsListItem {
        return {
            channels: getChannelIdsForShowId(configShow.id),
            id: configShow.id,
            isCommercial: configShow.isCommercial,
            name: configShow.name,
            shortName: configShow.shortName || configShow.name,
            descriptiveId: getDescriptiveIdForShowName(configShow.name),
            channelCode: buildChannelCodeFromShowIds([configShow.id]),
        };
    }

    getShows(): Promise<ShowsListItem[]> {
        return Promise.resolve(config.shows.map(show => this.getShowsListItemFromConfigShow(show)));
    }

    getChannels(): Promise<ChannelId[]> {
        return Promise.resolve(config.channels.map(channel => channel.name));
    }

    async getScheduleForChannel(channelId: ChannelId, length: Seconds): Promise<CurrentChannelScheduleWithDetails> {
        const scheduleWithoutDetails = await this.scheduler.getScheduleForChannel(channelId, length),
            scheduleEpisodeDetails = await Promise.all(scheduleWithoutDetails.list.map(episode => shows.getEpisodeDetails(episode)));

        return {
            list: scheduleEpisodeDetails,
            initialOffset: scheduleWithoutDetails.initialOffset,
        } as CurrentChannelScheduleWithDetails;
    }

    getCodeForShowIds(showIds: ShowId[]): ChannelId {
        return buildChannelCodeFromShowIds(showIds);
    }

    getPlayingNowAndNext(channels: ChannelId[]): Promise<PlayingNowAndNext> {
        return Promise.all(channels.map(channelId => this.scheduler.getPlayingNowAndNext(channelId))).then(channelSchedules => {
            const result = {} as PlayingNowAndNext;
            channels.map((channelId, index) => {
               result[channelId] = channelSchedules[index];
            });
            return result;
        });
    }

    getSitemapXml(): Promise<Xml> {
        return this.getShows().then(shows => getSitemapXml(shows));
    }
}