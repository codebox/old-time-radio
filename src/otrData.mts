import { WebClient } from "./webClient.mjs";
import { log } from "./log.mjs";
import { config } from "./config.mjs";
import type {
    EpisodeId,
    MediumEpisodeSummary,
    OtrDataEpisodeId, OtrDataEpisodeResponse, OtrDataEpisodesResponse, OtrDataSearchResponse, OtrDataShowCounts,
    OtrDataSummaryResponse, OtrDocument, OtrSearchResult,
    PlaylistId, SearchResults, SearchText, ShortEpisodeSummary, ShowId, ShowName,
    Url
} from "./types.mjs";
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

    async get(url: Url) {
        try {
            log.debug(`Fetching ${url}...`);
            return await this.webClient.get(url);
        }
        catch (err) {
            throw new Error(`Failed to fetch ${url}: ${err}`);
        }
    }

    async getEpisodeSummariesForPlaylist(playlistId: PlaylistId): Promise<OtrDataSummaryResponse> {
        const otrDataDocuments = await this.get(`${this.baseUrl}${this.summariesPath}${playlistId}` as Url) as OtrDocument[],
            response = {} as OtrDataSummaryResponse;

        otrDataDocuments.forEach(otrDataDocument => {
            response[otrDataDocument.id] = {
                short: otrDataDocument.metadata.summary_small as ShortEpisodeSummary,
                medium: otrDataDocument.metadata.summary_medium as MediumEpisodeSummary
            }
        });

        return response;
    }

    async search(searchText: SearchText): Promise<OtrDataSearchResponse> {
        return await this.get(`${this.baseUrl}${this.searchPath}${searchText}` as Url) as OtrDataSearchResponse;
    }

    async getEpisodeDetails(id: OtrDataEpisodeId): Promise<OtrDataEpisodeResponse> {
        return await this.get(`${this.baseUrl}${this.episodePath}${id}` as Url) as OtrDataEpisodeResponse;
    }

    async getShows(): Promise<OtrDataShowCounts> {
        return await this.get(`${this.baseUrl}${this.showsPath}` as Url) as OtrDataShowCounts;
    }

    async getEpisodeDetailsForShow(showName: ShowName): Promise<OtrDataEpisodesResponse> {
        return await this.get(`${this.baseUrl}${this.episodesPath}${showName}` as Url) as OtrDataEpisodesResponse;
    }

    getOtrEpisodeId(playlistId: PlaylistId, fileName: string): OtrDataEpisodeId {
        const fileWithoutExtension = path.parse(fileName).name;
        return `${playlistId}/${fileWithoutExtension}` as OtrDataEpisodeId;
    }
}

export const otrData = new OtrData();
//# sourceMappingURL=otrData.mjs.map