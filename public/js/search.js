window.onload = () => {
    const elSearchInput = document.getElementById('searchInput'),
        elSearchButton = document.getElementById('searchButton'),
        elSearchResults = document.getElementById('searchResults');

    elSearchButton.addEventListener('click', () => {
        const searchText = elSearchInput.value.trim();
        if (searchText) {
            return fetch('/api/search/' + encodeURIComponent(searchText))
                .then(response => response.json())
                .then(data => {
                    elSearchResults.innerHTML = '';
                    if (data.length === 0) {
                        elSearchResults.innerHTML = '<p>No results found.</p>';
                    } else {
                        data.forEach(item => {
                            const div = document.createElement('div');
                            div.className = 'searchResultItem';
                            const matches = item.textMatches.join(' ... ');
                            div.innerHTML = `
                                <h3><span class="showName">${item.show}:</span> <span class="episodeName">${item.episode}</span></h3>
                                <p class="episodeSummary">${item.summary}</p>
                                <p class="episodeMatches">${matches}</p>
                                <audio controls preload="none" src="${item.url}"></audio>
                                <a href="${item.url}">Download</a>
                            `;
                            elSearchResults.appendChild(div);
                        });
                    }
                })
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

    elSearchInput.focus();
};