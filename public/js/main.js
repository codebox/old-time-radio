// window.onload = () => {
//     const elPlayer = document.getElementById('player'),
//         elStart = document.getElementById('startButton');
//
//     let playlist = [];
//
//     function startPlaying() {
//         "use strict";
//         elPlayer.src = playlist[0].urls[0]
//         elPlayer.play();
//     }
//
//     elStart.onclick = startPlaying;
//
//     fetch('/api/playlist').then(response => {
//         response.json().then(rsp => {
//             playlist = rsp;
//         });
//     });
// };

function buildPlaylistUsing(channelName, shows) {
    "use strict";
    const episodeCount = shows.flatMap(show => show.files).length,
        remainingForEachShow = {};

    shows.forEach(show => {
        remainingForEachShow[show.id] = {
            startCount: show.files.length,
            remaining: show.files.length
        };
    });
    console.log(`Build '${channelName}' channel with ${episodeCount} episodes`);

    const episodeList = [], currentPlayLength = 0;
    for (let i=0; i<episodeCount; i++) {
        const nextShowId = Object.entries(remainingForEachShow).map(kv => {
            return {
                showId: kv[0],
                remainingFraction: (kv[1].remaining - 1) / kv[1].startCount
            };
        }).sort((o1, o2) => o2.remainingFraction - o1.remainingFraction)[0].showId;
        console.log(nextShowId)
        const remainingForNextShow = remainingForEachShow[nextShowId],
            nextEpisode = {
                file: shows.find(s => s.id === nextShowId).files[remainingForNextShow.startCount - remainingForNextShow.remaining]
            };
        remainingForNextShow.remaining--;
        episodeList.push(nextEpisode);
    }
    // console.log(JSON.stringify(episodeList, 4))
    return {
        title: channelName

    };
}

buildPlaylistUsing('scifi', [
    {
        id: 's1',
        files: [{name: 's1e1', length: 100}, {name: 's1e2', length: 100}, {name: 's1e3', length: 100}, {name: 's1e4', length: 100}]
    },
    {
        id: 's2',
        files: [{name: 's2e1', length: 100}, {name: 's2e2', length: 100}, {name: 's2e3', length: 100}]
    },
    {
        id: 's3',
        files: [{name: 's3e1', length: 100}, {name: 's3e2', length: 100}]
    },
    {
        id: 's4',
        files: [{name: 's4e1', length: 100}]
    }
])