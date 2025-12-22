import {readFileSync} from "fs";
import type {Channel, ChannelName, Hours, Millis, SearchText, ShowConfig, ShowId, ShowNumber, Url} from "./types.mjs";

class Config {
    private configData = JSON.parse(readFileSync("config.json", "utf8"));

    get webPort(): number {
        return this.configData.web.port;
    }

    get logLevel(): string {
        return this.configData.log.level;
    }

    get channels(): Channel[] {
        return this.configData.channels;
    }

    get channelNames(): ChannelName[] {
        return this.channels.map((channel: Channel) => channel.name);
    }

    get searchGoodMatchThreshold(): number {
        return this.configData.search.goodMatchThreshold;
    }

    getRandomSearchExample(): SearchText {
        const searchExamples = this.configData.search.examples as SearchText[];
        return searchExamples[Math.floor(Math.random() * searchExamples.length)];
    }

    get sitemapMaxAgeHours(): Hours {
        return this.configData.sitemap.maxAgeHours;
    }

    get publicUrlPrefix(): Url {
        return this.configData.web.publicUrlPrefix;
    }

    get cacheBaseDir(): string {
        return this.configData.cache.baseDir;
    }

    get scheduleCacheMaxItems(): number {
        return this.configData.cache.scheduleCacheMaxItems;
    }

    getShowConfigById(showId: ShowId): ShowConfig {
        const maybeShowConfig = this.configData.shows.find((show: ShowConfig) => show.id === showId);
        if (!maybeShowConfig) {
            throw new Error(`Show config not found for showId: ${showId}`);
        }
        return maybeShowConfig as ShowConfig;
    }

    getShowConfigByNumber(showNumber: ShowNumber): ShowConfig {
        const maybeShowConfig = this.configData.shows.find((show: ShowConfig) => show.number === showNumber);
        if (!maybeShowConfig) {
            throw new Error(`Show config not found for showNumber: ${showNumber}`);
        }
        return maybeShowConfig as ShowConfig;
    }

    get dataServiceBaseUrl(): string {
        return this.configData.dataApi.baseUrl;
    }

    get dataServiceMinRequestIntervalMillis(): Millis {
        return this.configData.dataApi.minRequestIntervalMillis as Millis;
    }

    isShowCommercial(showId: ShowId): boolean {
        const showConfig = this.getShowConfigById(showId);
        return showConfig.isCommercial;
    }

    getChannelsForShow(showId: ShowId): ChannelName[] {
        return this.channels
            .filter((channel: Channel) => channel.shows.includes(showId))
            .map((channel: Channel) => channel.name);
    }
}

export const config = new Config();