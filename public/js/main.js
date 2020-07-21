window.onload = () => {
    const elPlayer = document.getElementById('player'),
        elChannelsList = document.getElementById('channels');

    let currentPlaylist = [];

    function startPlaying(url, offset) {
        "use strict";
        elPlayer.src = currentPlaylist[0].url;
        elPlayer.play();
        elPlayer.currentTime = offset;
    }

    function playChannel(channelId) {
        "use strict";
        fetch(`/api/playlist/${channelId}`).then(response => {
            response.json().then(playlist => {
                console.log(playlist)
                currentPlaylist = playlist.list;
                startPlaying(currentPlaylist[0], playlist.initialOffset);
            });
        });
    }

    fetch('/api/channels').then(response => {
        response.json().then(channels => {
            channels.forEach(channel => {
                "use strict";
                const elChannel = document.createElement('li');
                elChannel.innerText = channel;
                elChannel.onclick = () => {
                    playChannel(channel);
                };
                elChannelsList.appendChild(elChannel);
            })
        });
    });
};
