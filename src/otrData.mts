import { WebClient } from "./webClient.mjs";
import { log } from "./log.mjs";
import { config } from "./config.mjs";
import type {
    MediumEpisodeSummary,
    OtrDataEpisodeId, OtrDataSearchResponse,
    OtrDataSummaryResponse, OtrDocument, OtrSearchResult,
    PlaylistId, SearchResults, SearchText, ShortEpisodeSummary,
    Url
} from "./types.mjs";
import path from "path";

export class OtrData {
    webClient;
    baseUrl;
    summariesPath;
    searchPath;

    constructor() {
        this.webClient = new WebClient(config.webClients.otrData);
        this.baseUrl = config.dataApi.baseUrl;
        this.summariesPath = config.dataApi.paths.summaries;
        this.searchPath = config.dataApi.paths.search;
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

    getOtrEpisodeId(fileName: string): OtrDataEpisodeId {
        return path.parse(fileName).name as OtrDataEpisodeId;
    }
}

export const otrData = new OtrData();
//# sourceMappingURL=otrData.mjs.map