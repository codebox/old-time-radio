import { WebClient } from "./webClient.mjs";
import { log } from "./log.mjs";
import { config } from "./config.mjs";
import type {
    OtrDataEpisodeId,
    OtrDataMediumSummaryResponse,
    OtrDataShortSummaryResponse,
    PlaylistId,
    ShowId,
    Url
} from "./types.mjs";
import path from "path";

export class OtrData {
    webClient;
    baseUrl;
    shortSummariesPath;
    mediumSummariesPath;

    constructor() {
        this.webClient = new WebClient();
        this.baseUrl = config.dataApi.baseUrl;
        this.shortSummariesPath = config.dataApi.paths.shortSummaries;
        this.mediumSummariesPath = config.dataApi.paths.mediumSummaries;
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

    async getMediumEpisodeSummariesForShow(showId: ShowId): Promise<OtrDataMediumSummaryResponse> {
        return this.get(`${this.baseUrl}${this.mediumSummariesPath}/${showId}` as Url);
    }

    getOtrEpisodeId(fileName: string): OtrDataEpisodeId {
        return path.parse(fileName).name as OtrDataEpisodeId;
    }


    // async getLongSummaryForEpisode(playlistId, episodeId) {
    //     return this.get(`TODO/${playlistId}/${episodeId}`);
    // }
}
export const otrData = new OtrData();
//# sourceMappingURL=otrData.mjs.map