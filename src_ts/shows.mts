import type {
    Episode,
    EpisodeDetails,
    EpisodeId,
    EpisodeIndex,
    EpisodeName,
    IsCommercial,
    ShowId,
    ShowName,
    Url
} from "./types.mjs";
import type {Seconds} from "./clock.mjs";
import {log} from "./log.mjs";

export class Shows {
    private readonly episodeLookup: Map<ShowId, EpisodeDetails[]> = new Map();

    constructor() {
        this.episodeLookup = new Map();
    }

    addEpisodeDetails(showId: ShowId, episodeDetails: EpisodeDetails[]): void {
        this.episodeLookup.set(showId, episodeDetails);
    }

    getEpisodesForShow(showId: ShowId): Episode[] {
        const episodes = this.episodeLookup.get(showId);
        if (!episodes) {
            log.error(`getEpisodesForShow called with unknown showId '${showId}'`);
            return [];
        } else if (episodes.length === 0) {
            log.error(`getEpisodesForShow called with showId '${showId}' but show has no episodes`);
            return [];
        }
        return episodes.map((details, index) => ({
            index: index as EpisodeIndex,
            showId: showId,
            length: details.length,
        }));
    }

    getEpisodeDetails(episode: Episode): EpisodeDetails | null {
        const episodeDetailsForShow = this.episodeLookup.get(episode.showId);
        if (!episodeDetailsForShow) {
            log.error(`getEpisodeDetails called with episode containing unknown showId '${episode.showId}'`);
            return null;
        } else if (episode.index < 0 || episode.index >= episodeDetailsForShow.length) {
            log.error(`getEpisodeDetails called with episode containing index '${episode.index}' which is out of bounds for showId '${episode.showId}'`);
            return null;
        }
        return episodeDetailsForShow[episode.index];
    }
}

export const shows = new Shows();