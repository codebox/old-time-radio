window.onload = () => {
    const elPlayer = document.getElementById('player'),
        elStart = document.getElementById('startButton');

    let playlist = [];

    function startPlaying() {
        "use strict";
        elPlayer.src = playlist[0].urls[0]
        elPlayer.play();
    }

    elStart.onclick = startPlaying;

    fetch('/api/playlist').then(response => {
        response.json().then(rsp => {
            playlist = rsp;
        });
    });
};