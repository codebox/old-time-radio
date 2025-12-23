window.addEventListener('load', () => {
    const elSearchInput = document.getElementById('searchInput') as HTMLInputElement,
        elSearchButton = document.getElementById('searchButton') as HTMLButtonElement,
        elSearchResults = document.getElementById('searchResults') as HTMLDivElement,
        elSearchRunning = document.getElementById('searchRunning')!,
        elSearchError = document.getElementById('searchError')!,
        elSearchInfo = document.getElementById('searchInfo')!,
        goodMatchThreshold = Number(elSearchResults.dataset.threshold),
        STATE_INIT = 'initial',
        STATE_SEARCHING = 'searching',
        STATE_ERROR = 'error',
        STATE_RESULTS = 'done',
        CSS_CLASS_SHOW_SECONDARY_MATCHES = 'showSecondaryMatches';

    function setVisible(el: HTMLElement, visible: boolean) {
        el.style.display = visible ? 'block' : 'none';
    }

    function setState(state: string) {
        elSearchInput.disabled = state === STATE_SEARCHING;
        elSearchButton.disabled = state === STATE_SEARCHING;

        setVisible(elSearchResults, state === STATE_RESULTS);
        setVisible(elSearchInfo, state === STATE_RESULTS);
        setVisible(elSearchRunning, state === STATE_SEARCHING);
        setVisible(elSearchError, state === STATE_ERROR);

        if (state === STATE_INIT || state === STATE_ERROR) {
            elSearchInput.focus();
        }
    }

    async function performSearch(searchText: string) {
        if (!searchText) return;

        try {
            setState(STATE_SEARCHING);
            const response = await fetch('/api/search/' + encodeURIComponent(searchText));

            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(errorMessage || `${response.status} ${response.statusText}`);
            }

            elSearchResults.classList.remove(CSS_CLASS_SHOW_SECONDARY_MATCHES);
            elSearchResults.innerHTML = await response.text();

            let primaryMatchCount = 0,
                secondaryMatchCount = 0;

            elSearchResults.querySelectorAll('.episodeSummary').forEach(el => {
                const score = Number((el as HTMLElement).dataset.similarity);
                if (score < goodMatchThreshold) {
                    el.classList.add('secondaryMatch');
                    if (secondaryMatchCount === 0) {
                        const elShowSecondary = document.createElement('button');
                        elShowSecondary.id = 'showSecondaryMatches';
                        elShowSecondary.className = 'rounded';
                        elShowSecondary.textContent = 'See Other Potential Matches';
                        elSearchResults.insertBefore(elShowSecondary, el);
                        elShowSecondary.addEventListener('click', () => {
                            elSearchResults.classList.add(CSS_CLASS_SHOW_SECONDARY_MATCHES);
                            elSearchInfo.innerHTML += `<br>Displaying secondary matches.`;
                            el.scrollIntoView({ behavior: 'smooth' });
                        });
                    }
                    secondaryMatchCount++;
                } else {
                    primaryMatchCount++;
                }
            });

            if (primaryMatchCount === 0) {
                elSearchInfo.innerText = "No good matches found for your search.";
            } else if (primaryMatchCount === 1) {
                elSearchInfo.innerText = "1 match found.";
            } else {
                elSearchInfo.innerText = `${primaryMatchCount} matches found.`;
            }
            setState(STATE_RESULTS);

            history.pushState({ searchText }, '', '/search/' + encodeURIComponent(searchText));

        } catch (error) {
            setState(STATE_ERROR);
            elSearchError.textContent = `Search failed, please try again later.`;
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
