module.exports.buildPlaylistManager = () => {
    const playlists = {};

    /*
     {
        id: "PatNovakForHire",
        title: "Pat Novak for Hire",
        files: [
            {
                "file": "46-11-24-DixieGilian.mp3",
                "name": "Pat Novak For Hire: Dixie Gilian [46-11-24]",
                "length": 1775.13,
                "itemId": "PatNovakForHire"
            }
        ]
    }
     */
    return {
        addPlaylist(playlistMetadata) {
            "use strict";
            const playlist = {
                id: playlistMetadata.id,
                title: playlistMetadata.title,
                files: playlistMetadata.files
            };
            playlists[playlistMetadata.id] = playlist;
        },
        getPlaylist(playlistId) {
            "use strict";
            return playlists[playlistId];
        }
    };
};

