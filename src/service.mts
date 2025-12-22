import {DataService} from "./dataService.mjs";
import {config} from "./config.mjs";
import type {ChannelId, EpisodeId, PlayingNowAndNext, SearchText, Seconds, ShowId, ShowIndex, ApiShowEnriched} from "./types.mjs";
import {ScheduleService} from "./scheduleService.mjs";
import {ChannelCodeService} from "./channelCodeService.mjs";
import {SiteMapService} from "./sitemapService.mjs";


export class Service {
    private dataService: DataService;
    private scheduleService: ScheduleService;
    private channelCodeService: ChannelCodeService;
    private sitemapService: SiteMapService;

    constructor() {
        this.dataService = new DataService();
        this.channelCodeService = new ChannelCodeService();
        this.scheduleService = new ScheduleService(this.channelCodeService, this.dataService);
        this.sitemapService = new SiteMapService(this.dataService);
    }

    async getShows(): Promise<ApiShowEnriched[]> {
        const shows = await this.dataService.getShows();
        return shows.map(show => {
            const showConfig = config.getShowConfigById(show.id);
            return {
                ...show,
                index: showConfig.number,
                isCommercial: showConfig.isCommercial || false,
                channels: config.getChannelsForShow(show.id)
            };
        });
    }

    async getChannelNames() {
        return Promise.resolve(config.channelNames);
    }

    async getScheduleForChannel(channelId: ChannelId, length: Seconds) {
        return this.scheduleService.getScheduleForChannel(channelId, length);
    }

    async getChannelCodeForShowIndexes(showIndexes: ShowIndex[]) {
        return Promise.resolve(this.channelCodeService.getCodeForShowIndexes(showIndexes));
    }

    async getPlayingNowAndNext(channels: ChannelId[]): Promise<PlayingNowAndNext> {
        return Object.fromEntries(
            await Promise.all(channels.map(async channelId =>
                [channelId, await this.scheduleService.getPlayingNowAndNext(channelId)]
            ))
        ) as PlayingNowAndNext;
    }

    async getEpisodesForShow(showId: ShowId) {
        return this.dataService.getEpisodesForShow(showId);
    }

    async getEpisode(episodeId: EpisodeId) {
        return this.dataService.getEpisode(episodeId);
    }

    async search(searchText: SearchText) {
        return this.dataService.search(searchText);
    }

    async getSitemapXml() {
        return this.sitemapService.getSitemapXml();
    }
}