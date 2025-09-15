import { WebClient } from "./webClient.mjs";
import { log } from "./log.mjs";
import { config } from "./config.mjs";
import type {OtrDataShortSummaryResponse, PlaylistId, Url} from "./types.mjs";

export class OtrData {
    webClient;
    baseUrl;
    shortSummariesPath;

    constructor() {
        this.webClient = new WebClient();
        this.baseUrl = config.dataApi.baseUrl;
        this.shortSummariesPath = config.dataApi.paths.shortSummaries;
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

    async getShortEpisodeSummariesForPlaylist(playlistId: PlaylistId): Promise<OtrDataShortSummaryResponse> {
        return this.get(`${this.baseUrl}${this.shortSummariesPath}/${playlistId}` as Url);
    }

    // async getMediumSummaryForEpisode(playlistId, episodeId) {
    //     return this.get(`TODO/${playlistId}/${episodeId}`);
    // }
    // async getLongSummaryForEpisode(playlistId, episodeId) {
    //     return this.get(`TODO/${playlistId}/${episodeId}`);
    // }
}
export const otrData = new OtrData();
//# sourceMappingURL=otrData.mjs.map