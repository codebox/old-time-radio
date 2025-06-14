import {readFile} from "fs/promises";
import type {Config, PlaylistId, ShowId} from "./types.mjs";

export const config: Config = JSON.parse(await readFile("config.json", "utf8"));

export const configHelper = {
    getShowForPlaylistId(playlistId: PlaylistId) {
        return config.shows.find(show => show.playlists.includes(playlistId));
    },
    getAllPlaylistIds() {
        return config.shows.flatMap(show => show.playlists)
    },
    getChannelNamesForShowId(showId: ShowId) {
        return config.channels.filter(channel => channel.shows.includes(showId)).map(channel => channel.name);
    },
    getShows(){
        return config.shows.map(show => {
            return {
                channels: configHelper.getChannelNamesForShowId(show.id),
                id: show.id,
                isCommercial: !! show.isCommercial,
                name: show.name,
                shortName: show.shortName || show.name,
                playlists: show.playlists
            };
        });
    },
    getChannels() {
        return config.channels.map(channel => channel.name);
    }
}