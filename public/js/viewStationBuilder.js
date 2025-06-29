function buildStationBuilderView(eventSource) {
    "use strict";

    const
        elShowList = document.getElementById('showList'),
        elShowsSelected = document.getElementById('showsSelected'),
        elCreateChannelButton = document.getElementById('createChannel'),
        elStationDetails = document.getElementById('stationDetails'),
        elGoToStation = document.getElementById('goToStation'),
        elAddAnotherChannel = document.getElementById('addAnotherChannel'),
        elChannelCount = document.getElementById('channelCount'),
        elDeleteStationButton = document.getElementById('deleteStation'),
        elStationBuilderTitle = document.getElementById('stationBuilderTitle'),
        elIncludeAdsInChannelButton = document.getElementById('adsInChannel'),

        CSS_CLASS_SELECTED = 'selected';


    function buildGenreListForShows(shows) {
        const unclassifiedShows = [],
            genreMap = {};

        function sortShowsByName(s1, s2) {
            return s1.name > s2.name ? 1 : -1;
        }
        shows.forEach(show => {
            if (show.channels.length) {
                show.channels.forEach(channelName => {
                    if (!genreMap[channelName]) {
                        genreMap[channelName] = [];
                    }
                    genreMap[channelName].push(show);
                });
            } else {
                unclassifiedShows.push(show);
            }
        });

        const genreList = [];
        Object.keys(genreMap).sort().forEach(genreName => {
            genreList.push({name: genreName, shows: genreMap[genreName].sort(sortShowsByName)});
        });
        genreList.push({name: 'other', shows: unclassifiedShows.sort(sortShowsByName)});

        return genreList;
    }

    function buildGenreTitleElement(genreName) {
        const el = document.createElement('h3');
        el.innerHTML = `${genreName} shows`;
        return el;
    }

    function buildShowButtonElement(show) {
        const button = document.createElement('button');
        button.innerHTML = show.name;
        button.dataset.id = show.id;
        button.classList.add('menuButton');
        button.setAttribute('role', 'checkbox');
        button.ariaChecked = 'false';
        if (!show.elements) {
            show.elements = [];
        }
        show.elements.push(button);
        return button;
    }

    elIncludeAdsInChannelButton.onclick = () => {
        eventSource.trigger(EVENT_STATION_BUILDER_PLAY_COMMERCIALS_CLICK);
    };

    elCreateChannelButton.onclick = () => {
        eventSource.trigger(EVENT_STATION_BUILDER_CREATE_CHANNEL_CLICK);
    };

    elGoToStation.onclick = () => {
        eventSource.trigger(EVENT_STATION_BUILDER_GO_TO_CHANNEL_CLICK);
    };

    elAddAnotherChannel.onclick = () => {
        eventSource.trigger(EVENT_STATION_BUILDER_ADD_CHANNEL_CLICK);
    };

    elDeleteStationButton.onclick = () => {
        eventSource.trigger(EVENT_STATION_BUILDER_DELETE_STATION_CLICK);
    };

    function updateCreateChannelVisibility(selectedChannelsCount) {
        const isButtonVisible = selectedChannelsCount > 0;
        elCreateChannelButton.style.display = isButtonVisible ? 'inline' : 'none';
    }

    function updateCreateChannelButtonText(selectedChannelsCount) {
        let buttonText;

        if (selectedChannelsCount === 0) {
            buttonText = '';

        } else if (selectedChannelsCount === 1) {
            buttonText = 'Create a new channel with just this show';

        } else {
            buttonText = `Create a new channel with these ${selectedChannelsCount} shows`;
        }

        elCreateChannelButton.innerHTML = buttonText;
    }

    function updateStationDescription(selectedChannelsCount, includeCommercials) {
        const commercialsStatus = includeCommercials ? 'Commercials will play between programmes' : 'No commercials between programmes';

        let description;

        if (selectedChannelsCount === 0) {
            description = 'Pick some shows to add to a new channel';

        } else if (selectedChannelsCount === 1) {
            description = `1 show selected<br>${commercialsStatus}`;

        } else {
            description = `${selectedChannelsCount} shows selected<br>${commercialsStatus}`;
        }

        elShowsSelected.innerHTML = description;
    }

    function getSelectedChannelCount(stationBuilderModel) {
        return stationBuilderModel.shows.filter(show => show.selected).length;
    }

    return {
        populate(stationBuilderModel) {
            elShowList.innerHTML = '';
            const genreList = buildGenreListForShows(stationBuilderModel.shows);

            genreList.forEach(genre => {
                if (!genre.shows.length) {
                    return;
                }
                elShowList.appendChild(buildGenreTitleElement(genre.name));
                genre.shows.forEach(show => {
                    const elShowButton = buildShowButtonElement(show);
                    elShowButton.onclick = () => {
                        eventSource.trigger(EVENT_STATION_BUILDER_SHOW_CLICK, show);
                    };
                    elShowList.appendChild(elShowButton);
                });
            });
            this.updateShowSelections(stationBuilderModel);
            this.updateStationDetails(stationBuilderModel);
        },

        updateShowSelections(stationBuilderModel) {
            stationBuilderModel.shows.forEach(show => {
                show.elements.forEach(el => {
                    el.classList.toggle(CSS_CLASS_SELECTED, show.selected);
                    el.ariaChecked = show.selected;
                });
            });

            const selectedChannelsCount = getSelectedChannelCount(stationBuilderModel);
            updateCreateChannelVisibility(selectedChannelsCount);
            updateCreateChannelButtonText(selectedChannelsCount);
            updateStationDescription(selectedChannelsCount, stationBuilderModel.includeCommercials);
        },

        updateIncludeCommercials(stationBuilderModel) {
            elIncludeAdsInChannelButton.classList.toggle(CSS_CLASS_SELECTED, stationBuilderModel.includeCommercials);
            elIncludeAdsInChannelButton.ariaChecked = stationBuilderModel.includeCommercials;

            const selectedChannelsCount = getSelectedChannelCount(stationBuilderModel);
            updateStationDescription(selectedChannelsCount, stationBuilderModel.includeCommercials);
        },

        updateStationDetails(stationBuilderModel) {
            elStationDetails.style.display = stationBuilderModel.savedChannelCodes.length ? 'block' : 'none';

            const channelCount = stationBuilderModel.savedChannelCodes.length;
            elChannelCount.innerHTML = `Your station now has ${channelCount} channel${channelCount === 1 ? '' : 's'}`;
        },

        addAnotherChannel() {
            elStationBuilderTitle.scrollIntoView({behavior: 'smooth'});
        }

    };
}