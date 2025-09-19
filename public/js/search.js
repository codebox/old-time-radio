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
                            const matches = item.matches.map(match => `<li>${match}</li>`).join('');
                            div.innerHTML = `
                                <h3>${item.show} - ${item.episode}</h3>
                                <p>${item.summary}</p>
                                <p>${item.description}</p>
                                <ul>${matches}</ul>
                                <a href="${item.url}">Listen</a>
                            `;
                            elSearchResults.appendChild(div);
                        });
                    }
                })
        }
    })
};