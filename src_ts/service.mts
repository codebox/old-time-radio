import {config} from "./config.mjs";
import type {ChannelCode, ChannelId, ConfigShow, ShowIndex, ShowsList, ShowsListItem} from "./types.mjs";

export class Service {
    constructor() {

    }

    private getShowsListItemFromConfigShow(configShow: ConfigShow): ShowsListItem {
        return {
            channels: [ChannelId],
            index: configShow.index,
            isCommercial: configShow.isCommercial,
            name: configShow.name,
            shortName: string,
            descriptiveId: string,
            channelCode: ChannelCode
        };
    }

    getShows(): Promise<ShowsListItem[]> {
        return Promise.resolve(config.shows.map(show => this.getShowsListItemFromConfigShow(show)));
    }
}