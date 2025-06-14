import type {Episode, EpisodeDetails, ShowId} from "./types.mjs";

export class Shows {
    constructor() {

    }

    getEpisodesForShow(showId: ShowId): Promise<Episode[]> {
        return Promise.resolve([]); //TODO
    }

    getEpisodeDetails(episode: Episode): Promise<EpisodeDetails> {
        return Promise.resolve(); //TODO
    }
}

export const shows = new Shows();