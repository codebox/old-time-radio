import {config} from "./config.mjs";
import type {ShowsList} from "./types.mjs";

export class Service {
    constructor() {

    }

    getShows(): Promise<ShowsList> {
        return Promise.resolve(config.shows.map((show) => {
            return {
                channels: show.channels,
                index: show.index,
                isCommercial: show.isCommercial,
                name: show.name,
                shortName: show.shortName,
                descriptiveId: show.name.toLowerCase().replace(/ /g, '-').replace(/-+/g, '-').replace(/[^a-zA-Z0-9-]/g, ''),
                channelCode
            }
        });
    }
}