import {DataService} from "./dataService.mjs";
import {config} from "./config.mjs";
import type {ChannelId, EpisodeId, PlayingNowAndNext, SearchText, Seconds, ShowId, ShowNumber} from "./types.mjs";
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

    async getShows() {
        return this.dataService.getShows();
    }

    async getChannelNames() {
        return Promise.resolve(config.channelNames);
    }

    async getScheduleForChannel(channelId: ChannelId, length: Seconds) {
        return this.scheduleService.getScheduleForChannel(channelId, length);
    }

    async getChannelCodeForShowNumbers(showNumbers: ShowNumber[]) {
        return Promise.resolve(this.channelCodeService.getCodeForShowNumbers(showNumbers));
    }

    async getPlayingNowAndNext(channels: ChannelId[]): Promise<PlayingNowAndNext> {
        return Object.fromEntries(
            await Promise.all(channels.map(async channelId =>
                [channelId, await this.scheduleService.getPlayingNowAndNext(channelId)]
            ))
        ) as PlayingNowAndNext;
    }

    async getShowEpisodeCounts() {
        return this.dataService.getShowEpisodeCounts();
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