import {config} from "./config.mjs";
import type {ChannelCode, ChannelId, ConfigShow, DescriptiveId, ShowIndex, ShowsListItem} from "./types.mjs";
import {buildChannelCodeFromShowIndexes} from "./channelCodes.mjs";

function getChannelIdsForShowIndex(showIndex: ShowIndex) {
    return config.channels.filter(channel => channel.shows.includes(showIndex)).map(channel => channel.name);
}

function getDescriptiveIdForShowName(showName: string): DescriptiveId {
    return showName.toLowerCase().replace(/ /g, '-').replace(/-+/g, '-').replace(/[^a-zA-Z0-9-]/g, '') as DescriptiveId;
}

export class Service {
    constructor() {

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
}