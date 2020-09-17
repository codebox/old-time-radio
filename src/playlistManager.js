module.exports.buildPlaylistManager = () => {
    const playlists = {};

    /*
     {
        id: "PatNovakForHire",
        title: "Pat Novak for Hire",
        urlPrefixes: [
            "https://ia800206.us.archive.org/30/items/PatNovakForHire/",
            "https://ia800207.us.archive.org/30/items/PatNovakForHire/"
        ]
        files: [
            {
                "file": "46-11-24-DixieGilian.mp3",
                "name": "Pat Novak For Hire: Dixie Gilian [46-11-24]",
                "length": 1775.13
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
                files: playlistMetadata.files.map(file => {
                    file.urlPrefixes = [...playlistMetadata.urlPrefixes];
                    return file;
                })
            };
            playlists[playlistMetadata.id] = playlist;
        },
        getPlaylist(playlistId) {
            "use strict";
            return playlists[playlistId];
        }
    };
};

