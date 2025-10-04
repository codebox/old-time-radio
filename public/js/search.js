window.onload = () => {
    const elSearchInput = document.getElementById('searchInput'),
        elSearchButton = document.getElementById('searchButton'),
        elSearchResults = document.getElementById('searchResults'),
        elSearchRunning = document.getElementById('searchRunning'),
        elSearchError = document.getElementById('searchError'),
        STATE_INIT = 'initial',
        STATE_SEARCHING = 'searching',
        STATE_ERROR = 'error',
        STATE_RESULTS = 'done';

    function setVisible(el, visible) {
        el.style.display = visible ? 'block' : 'none';
    }

    function setState(state) {
        elSearchInput.disabled = state === STATE_SEARCHING;
        elSearchButton.disabled = state === STATE_SEARCHING;

        setVisible(elSearchResults, state === STATE_RESULTS);
        setVisible(elSearchRunning, state === STATE_SEARCHING);
        setVisible(elSearchError, state === STATE_ERROR);

        if (state === STATE_INIT || state === STATE_ERROR) {
            elSearchInput.focus();
        }
    }

    elSearchResults.addEventListener('toggle', async (event) => {
        const elDetails = event.target;
        const episodeId = elDetails.dataset.episodeId;

        if (!episodeId || !elDetails.open || elDetails.dataset.loaded) return;

        elDetails.dataset.loaded = 'true';
        const response = await fetch('/api/episode/' + encodeURIComponent(episodeId));
        const data = await response.json();

        elDetails.querySelector('.episodeDetailsContent').innerHTML = `
            <p>${data.text.replaceAll('\\n', '<br>').replaceAll('\\"', '"')}</p>
            <div class="episodeDownloadLinks">
                <audio controls preload="none" src="${data.metadata.url}"></audio>
                <a href="${data.metadata.url}">Download</a>
            </div>
        `;
    }, true);

    elSearchButton.addEventListener('click', async () => {
        const searchText = elSearchInput.value.trim();
        if (!searchText) return;

        try {
            setState(STATE_SEARCHING);
            const response = await fetch('/api/search/' + encodeURIComponent(searchText));

            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(errorMessage || `Search failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            setState(STATE_RESULTS);
            elSearchResults.innerHTML = '';

            if (data.length === 0) {
                elSearchResults.innerHTML = '<p>No results found.</p>';
            } else {
                data.forEach(item => {
                    const div = document.createElement('div');
                    div.className = 'searchResultItem';
                    const matches = item.textMatches.join(' ... ');
                    div.innerHTML = `
                        <h3>
                            <span class="showName">${item.show}:</span> <span class="episodeName">${item.episode}</span>
                        </h3>
                        <p class="episodeSummary">${item.summary}</p>
                        <details data-episode-id="${item.id}">
                            <summary>more...</summary>
                            <div class="episodeDetailsContent">
                                <div class="episodeDetailsLoading">
                                    <div class="bounce1"></div>
                                    <div class="bounce2"></div>
                                    <div class="bounce3"></div>
                                </div>
                            </div>
                        </details>
                    `;
                    elSearchResults.appendChild(div);
                });
            }
        } catch (error) {
            setState(STATE_ERROR);
            elSearchError.textContent = error.message;
        }
    });

    elSearchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            elSearchButton.click();
        } else if (event.key === 'Escape') {
            elSearchInput.value = '';
        }
    });

    setState(STATE_INIT);
};