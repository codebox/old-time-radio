import { WebClient } from "./webClient.mjs";
import { log } from "./log.mjs";
import { config } from "./config.mjs";
import { OtrDocument } from "./types.mjs";
import path from "path";
export class OtrData {
    webClient;
    baseUrl;
    summariesPath;
    searchPath;
    showsPath;
    episodePath;
    episodesPath;
    constructor() {
        this.webClient = new WebClient(config.webClients.otrData);
        this.baseUrl = config.dataApi.baseUrl;
        this.summariesPath = config.dataApi.paths.summaries;
        this.searchPath = config.dataApi.paths.search;
        this.showsPath = config.dataApi.paths.shows;
        this.episodePath = config.dataApi.paths.episode;
        this.episodesPath = config.dataApi.paths.episodes;
    }
    async get(url) {
        try {
            log.debug(`Fetching ${url}...`);
            return await this.webClient.get(url);
        }
        catch (err) {
            throw new Error(`Failed to fetch ${url}: ${err}`);
        }
    }
    buildEpisodeName(doc) {
        const numberPart = doc.number ? ` [#${doc.number}]` : '', datePart = doc.date ? ` (${doc.date})` : '';
        return `${doc.show}${numberPart} - ${doc.episode}${datePart}`;
    }
    async getEpisodeSummariesForPlaylist(playlistId) {
        const rawDocuments = await this.get(`${this.baseUrl}${this.summariesPath}${playlistId}`), otrDataDocuments = rawDocuments.map(doc => new OtrDocument(doc));
        console.log(`Fetched ${otrDataDocuments.length} episode summaries for playlist ${playlistId}`);
        return otrDataDocuments.map(otrDataDocument => ({
            url: otrDataDocument.url,
            name: this.buildEpisodeName(otrDataDocument),
            short: otrDataDocument.summarySmall,
            medium: otrDataDocument.summaryMedium
        }));
    }
    async search(searchText) {
        return await this.get(`${this.baseUrl}${this.searchPath}${searchText}`);
    }
    async getEpisodeDetails(id) {
        const rawDocument = await this.get(`${this.baseUrl}${this.episodePath}${id}`);
        return new OtrDocument(rawDocument);
    }
    async getShows() {
        return await this.get(`${this.baseUrl}${this.showsPath}`);
    }
    async getEpisodeDetailsForShow(showName) {
        const rawDocuments = await this.get(`${this.baseUrl}${this.episodesPath}${encodeURIComponent(showName)}`);
        return rawDocuments.map(doc => new OtrDocument(doc));
    }
}
export const otrData = new OtrData();
//# sourceMappingURL=otrData.mjs.map
//# sourceMappingURL=otrData.mjs.map