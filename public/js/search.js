window.addEventListener('load', () => {
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

    async function performSearch(searchText) {
        if (!searchText) return;

        try {
            setState(STATE_SEARCHING);
            const response = await fetch('/api/search/' + encodeURIComponent(searchText));

            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(errorMessage || `${response.status} ${response.statusText}`);
            }

            const searchResultsHtml = await response.text();
            setState(STATE_RESULTS);
            elSearchResults.innerHTML = searchResultsHtml;

            history.pushState({searchText}, '', '/search/' + encodeURIComponent(searchText));

        } catch (error) {
            setState(STATE_ERROR);
            elSearchError.textContent = `Search failed: ${error.message}`;
        }
    }

    elSearchButton.addEventListener('click', async () => {
        const searchText = elSearchInput.value.trim();
        await performSearch(searchText);
    });

    elSearchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            elSearchButton.click();
        } else if (event.key === 'Escape') {
            elSearchInput.value = '';
        }
    });

    // Check if there's a search term in the URL on page load
    const pathParts = window.location.pathname.split('/');
    if (pathParts.length >= 3 && pathParts[1] === 'search' && pathParts[2]) {
        const searchText = decodeURIComponent(pathParts[2]);
        elSearchInput.value = searchText;
        performSearch(searchText);
    } else {
        setState(STATE_INIT);
    }
});