import {config} from "./config.mjs";
import type {
    ChannelId,
    CurrentChannelSchedule,
    ConfigShow,
    DescriptiveId, PlayingNowAndNext,
    ShowIndex,
    ShowsListItem, Xml
} from "./types.mjs";
import {buildChannelCodeFromShowIndexes} from "./channelCodes.mjs";
import type {Seconds} from "./clock.mjs";
import {Scheduler} from "./scheduler.mjs";
import {getSitemapXml} from "./sitemap.mjs";


function getChannelIdsForShowIndex(showIndex: ShowIndex) {
    return config.channels.filter(channel => channel.shows.includes(showIndex)).map(channel => channel.name);
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
            channels: getChannelIdsForShowIndex(configShow.index),
            index: configShow.index,
            isCommercial: configShow.isCommercial,
            name: configShow.name,
            shortName: configShow.shortName || configShow.name,
            descriptiveId: getDescriptiveIdForShowName(configShow.name),
            channelCode: buildChannelCodeFromShowIndexes([configShow.index]),
        };
    }

    getShows(): Promise<ShowsListItem[]> {
        return Promise.resolve(config.shows.map(show => this.getShowsListItemFromConfigShow(show)));
    }

    getChannels(): Promise<ChannelId[]> {
        return Promise.resolve(config.channels.map(channel => channel.name));
    }

    getScheduleForChannel(channelId: ChannelId, length: Seconds): Promise<CurrentChannelSchedule> {
        return this.scheduler.getScheduleForChannel(channelId, length);
    }

    getCodeForShowIndexes(showIndexes: ShowIndex[]): ChannelId {
        return buildChannelCodeFromShowIndexes(showIndexes);
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