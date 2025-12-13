import type {
    ApiShowsResponse,
    BroadcastDate, DataServiceEpisodeDetailsResponse, DataServiceEpisodesResponse,
    DataServiceSearchResponse, DataServiceShowsResponse,
    Episode,
    EpisodeId,
    EpisodeNumber,
    EpisodeTitle,
    LongEpisodeSummary,
    MediumEpisodeSummary, SearchResult,
    SearchText,
    Seconds,
    ShortEpisodeSummary,
    Show,
    ShowId,
    ShowName
} from "./types.mjs";
import {config} from "./config.mjs";
import {WebClient} from "./webClient.mjs";


export class DataService {
    private readonly baseUrl: string;
    private readonly webClient: WebClient;

    constructor() {
        this.baseUrl = config.dataServiceBaseUrl as string;
        const minRequestIntervalMillis = config.dataServiceMinRequestIntervalMillis;
        this.webClient = new WebClient(minRequestIntervalMillis);
    }

    private async fetchApi<T>(path: string): Promise<T> {
        const url = `${this.baseUrl}${path}`;
        return await this.webClient.get(url) as T;
    }

    async getShows(): Promise<Show[]> {
        return await this.fetchApi<DataServiceShowsResponse>('/shows') as Show[];
    }

    async getEpisodesForShow(showId: ShowId): Promise<Episode[]> {
        return await this.fetchApi<DataServiceEpisodesResponse>(`/shows/${showId}/episodes`) as Episode[];
    }

    async getEpisode(episodeId: EpisodeId): Promise<Episode> {
        return await this.fetchApi<DataServiceEpisodeDetailsResponse>(`/episodes/${episodeId}`) as Episode;
    }

    async search(searchText: SearchText): Promise<SearchResult[]> {
        return await this.fetchApi<DataServiceSearchResponse>(`/search/${encodeURIComponent(searchText)}`) as SearchResult[];
    }
}