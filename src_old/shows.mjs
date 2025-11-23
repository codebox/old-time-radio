import { log } from "./log.mjs";
import { Cache } from "./cache.mjs";
import { config, configHelper } from "./config.mjs";
import { archiveOrg } from "./archiveOrg.mjs";
import { otrData } from "./otrData.mjs";
export class Shows {
    cache;
    constructor() {
        this.cache = new Cache("shows", showId => this.fetchEpisodeDetailsForShowId(showId), 99999, config.caches.showsCacheMaxAgeHours * 60 * 60);
    }
    validatePlaylist(playlistData) {
        if (!playlistData || !playlistData.files || playlistData.files.length === 0) {
            throw new Error(`No files found in playlist`);
        }
        if (playlistData.is_dark) {
            throw new Error(`Playlist is_dark=true, skipping`);
        }
    }
    isPartOfSkipListForShow(fileName, playlistId) {
        return (configHelper.getShowForPlaylistId(playlistId).skip || []).some(skipPattern => fileName.includes(skipPattern));
    }
    convertFileLengthToSeconds(fileLength) {
        let length;
        if (fileLength.match(/^[0-9]+:[0-9]+$/)) {
            const [min, sec] = fileLength.split(':');
            length = Number(min) * 60 + Number(sec);
        }
        else {
            length = Number(fileLength);
        }
        return length;
    }
    isPlayable(file, playlistId) {
        if (!file.name.toLowerCase().endsWith('.mp3')) {
            return false;
        }
        if (this.isPartOfSkipListForShow(file.name, playlistId)) {
            log.debug(`Skipping ${file.name} for ${playlistId}`);
            return false;
        }
        if (!this.convertFileLengthToSeconds(file.length)) {
            log.warn(`File ${file.name} in playlist ${playlistId} has invalid/missing length, skipping`);
            return false;
        }
        return true;
    }
    async fetchEpisodeDetailsForPlaylistId(playlistId, show) {
        try {
            const playlistData = await archiveOrg.get(playlistId), summaries = await otrData.getEpisodeSummariesForPlaylist(playlistId);
            this.validatePlaylist(playlistData);
            return playlistData.files
                .filter(fileMetadata => this.isPlayable(fileMetadata, playlistId))
                .map(fileMetadata => {
                const encodedFileName = encodeURIComponent(fileMetadata.name), archivalUrl = `https://archive.org/download/${playlistId}/${encodedFileName}`, otrDataEpisodeDetails = summaries.find(o => o.url === archivalUrl);
                // if (otrDataEpisodeDetails) {
                // if otrDataEpisodeDetails is undefined this episode was not found in otrData so we exclude it
                return {
                    archivalUrl: archivalUrl,
                    commercial: show.isCommercial,
                    length: this.convertFileLengthToSeconds(fileMetadata.length),
                    showName: show.name,
                    urls: [
                        archivalUrl,
                        `https://${playlistData.server}${playlistData.dir}/${encodedFileName}`,
                        `https://${playlistData.d1}${playlistData.dir}/${encodedFileName}`,
                        `https://${playlistData.d2}${playlistData.dir}/${encodedFileName}`,
                    ],
                    ...otrDataEpisodeDetails
                };
                // }
            })
                .filter(o => o);
        }
        catch (error) {
            log.error(`Error fetching playlist '${playlistId}': ${error.message}`);
            throw error;
            // return [];
        }
    }
    async fetchEpisodeDetailsForShowId(showId) {
        const show = configHelper.getShowFromId(showId), results = await Promise.all(show.playlists.map(playlistId => this.fetchEpisodeDetailsForPlaylistId(playlistId, show)));
        return results.flat();
    }
    async getEpisodesForShow(showId) {
        const episodes = await this.cache.get(showId);
        if (!episodes) {
            log.error(`getEpisodesForShow called with unknown showId '${showId}'`);
            return [];
        }
        else if (episodes.length === 0) {
            log.error(`getEpisodesForShow called with showId '${showId}' but show has no episodes`);
            return [];
        }
        return episodes.map((details, index) => ({
            index: index,
            showId: showId,
            showName: details.showName,
            length: details.length,
        }));
    }
    async getEpisodeDetails(episode) {
        const episodeDetailsForShow = await this.cache.get(episode.showId);
        if (!episodeDetailsForShow) {
            log.error(`getEpisodeDetails called with episode containing unknown showId '${episode.showId}'`);
            return null;
        }
        else if (episode.index < 0 || episode.index >= episodeDetailsForShow.length) {
            log.error(`getEpisodeDetails called with episode containing index '${episode.index}' which is out of bounds for showId '${episode.showId}'`);
            return null;
        }
        return episodeDetailsForShow[episode.index];
    }
    async refetchStaleItems() {
        return this.cache.refetchStaleItems();
    }
}
export const shows = new Shows();
//# sourceMappingURL=shows.mjs.map