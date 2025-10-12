window.addEventListener('load', () => {
    document.body.addEventListener('toggle', async (event) => {
        const elDetails = event.target;
        const episodeId = elDetails.dataset.episodeId;

        if (!episodeId || !elDetails.open || elDetails.dataset.loaded) return;

        elDetails.dataset.loaded = 'true';
        const response = await fetch('/api/episode/' + encodeURIComponent(episodeId));
        elDetails.querySelector('.episodeDetailsContainer').innerHTML = await response.text();
    }, true);
});