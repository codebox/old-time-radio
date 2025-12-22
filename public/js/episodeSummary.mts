window.addEventListener('load', () => {
    document.body.addEventListener('toggle', async (event) => {
        const elDetails = event.target as HTMLDetailsElement;
        const episodeId = elDetails.dataset.episodeId;

        if (!episodeId || !elDetails.open || elDetails.dataset.loaded) return;

        elDetails.dataset.loaded = 'true';
        const response = await fetch('/api/episode/' + encodeURIComponent(episodeId));
        const container = elDetails.querySelector('.episodeDetailsContainer');
        if (container) {
            container.innerHTML = await response.text();
        }
    }, true);
});
