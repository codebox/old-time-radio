import type {Episode, EpisodeId, SearchResults, SearchText, Show, ShowEpisodeCounts, ShowId} from "./types.mjs";


export class DataService {
    async getShows(): Promise<Show[]> {
        return [];
    }

    async getShowEpisodeCounts(): Promise<ShowEpisodeCounts> {
        return Promise.resolve({});
    }

    async getEpisodesForShow(showId: ShowId): Promise<Episode[]> {
        return Promise.resolve([]);
    }

    async getEpisode(episodeId: EpisodeId): Promise<Episode> {
        return Promise.resolve(null);
    }

    async search(searchText: SearchText): Promise<SearchResults> {
        return [];
    }
}