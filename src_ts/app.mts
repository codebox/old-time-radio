import {WebServer} from "./webServer.mjs";
import {config, configHelper} from "./config.mjs";
import {archiveOrg} from "./archiveOrg.mjs";
import {log} from "./log.mjs";
import {shows} from "./shows.mjs";
import type {Seconds} from "./clock.mjs";
import type {
    ArchiveOrgFileMetadata,
    ArchiveOrgMetadata,
    EpisodeDetails,
    EpisodeName,
    IsCommercial, PlaylistId,
    ShowName,
    Url
} from "./types.mjs";

const webServer = new WebServer();

function updateArchiveOrgCache(){
    const skippedShows = new Set();
    function isPartOfSkipListForShow(fileName: string, playlistId: PlaylistId){
        return (configHelper.getShowForPlaylistId(playlistId).skip || []).some(skipPattern => fileName.includes(skipPattern));
    }

    function convertFileLengthToSeconds(fileLength: string) {
        let length;
        if (fileLength.match(/^[0-9]+:[0-9]+$/)) {
            const [min, sec] = fileLength.split(':')
            length = Number(min) * 60 + Number(sec);
        } else {
            length = Number(fileLength);
        }
        return length as Seconds;
    }

    function isPlayable(file: ArchiveOrgFileMetadata, playlistId: PlaylistId): Boolean {
        if (!file.name.toLowerCase().endsWith('.mp3')) {
            return false;
        }
        if (isPartOfSkipListForShow(file.name, playlistId)) {
            skippedShows.add(`${playlistId} ${file.name}`);
            log.debug(`Skipping ${file.name} for ${playlistId}`);
            return false;
        }
        if (!convertFileLengthToSeconds(file.length)) {
            log.warn(`File ${file.name} in playlist ${playlistId} has invalid/missing length, skipping`);
            return false;
        }

        return true;
    }

    function validatePlaylist(playlistData: ArchiveOrgMetadata) {
        if (!playlistData || !playlistData.files || playlistData.files.length === 0) {
            throw new Error(`No files found in playlist`);
        }
        if (playlistData.is_dark) {
            throw new Error(`Playlist is_dark=true, skipping`);
        }
    }

    config.shows.forEach(show => {
        show.playlists.forEach(playlistId => {
            archiveOrg.get(playlistId).then(playlistData => {
                validatePlaylist(playlistData);

                const episodeDetails: EpisodeDetails[] = playlistData.files.filter(fileMetadata => isPlayable(fileMetadata, playlistId)).map(fileMetadata => {
                    const encodedFileName = encodeURIComponent(fileMetadata.name),
                        archivalUrl = `https://archive.org/download/${playlistId}/${encodedFileName}` as Url;

                    return {
                        archivalUrl: archivalUrl,
                        commercial: show.isCommercial,
                        length: convertFileLengthToSeconds(fileMetadata.length),
                        name: nameParser.parse(playlistId, fileMetadata);
                        showName: show.name,
                        urls: [
                            archivalUrl,
                            `https://${playlistData.server}${playlistData.dir}/${encodedFileName}` as Url,
                            `https://${playlistData.d1}${playlistData.dir}/${encodedFileName}` as Url,
                            `https://${playlistData.d2}${playlistData.dir}/${encodedFileName}` as Url,
                        ]
                    };
                });
                shows.addEpisodeDetails(show.id, episodeDetails);

            }).catch(err => {
                log.error(`Failed to process Archive.org metadata for playlistId '${playlistId}': ${err}`);
            })
        });
    });
    return Promise.resolve(); //TODO
}

updateArchiveOrgCache().then(() => {
    webServer.start();
});