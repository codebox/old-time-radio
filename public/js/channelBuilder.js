const channelBuilder = (() => {
    const model = {shows:[], savedChannelCodes: []},
        STATE_INITIAL = 0,
        STATE_NO_SELECTION = 1,
        STATE_SELECTION = 2,
        STATE_CHANNEL_PENDING = 3;

    let channelRequestedHandler;

    const view = (() => {
        "use strict";
        const elShowList = document.getElementById('showList'),
            elShowsSelected = document.getElementById('showsSelected'),
            elCreateChannelButton = document.getElementById('createChannel'),
            elStationDetails = document.getElementById('stationDetails'),
            elGoToStation = document.getElementById('goToStation'),
            elAddAnotherChannel = document.getElementById('addAnotherChannel'),
            elChannelCount = document.getElementById('channelCount'),
            elDeleteStationButton = document.getElementById('deleteStation'),
            elStationBuilderTitle = document.getElementById('stationBuilderTitle');

            let showClickHandler, createChannelClickHandler, deleteStationClickHandler;

        function buildShowButtonElement(show) {
            const el = document.createElement('button');
            el.innerHTML = show.name;
            el.dataset.index = show.index;
            el.classList.add('showButton');
            if (!show.elements) {
                show.elements = [];
            }
            show.elements.push(el);
            return el;
        }

        function buildGenreTitleElement(genreName) {
            const el = document.createElement('h3');
            el.innerHTML = `${genreName} shows`;
            return el;
        }

        const stateMachine = (onUpdate => {
            let state;

            function setState(newState) {
                onUpdate(state = newState);
            }

            setState(STATE_INITIAL);
            function operationNoAllowedInCurrentState(operationName) {
                console.assert(false, `Operation ${operationName} not allowed in state ${state}`);
            }
            return {
                get state() {
                    return state;
                },
                reset() {
                    setState(STATE_NO_SELECTION);
                },
                nothingSelected() {
                    setState(STATE_NO_SELECTION);
                },
                somethingSelected() {
                    if ([STATE_NO_SELECTION, STATE_SELECTION, STATE_CHANNEL_PENDING].includes(state)) {
                        setState(STATE_SELECTION);
                    } else {
                        operationNoAllowedInCurrentState('somethingSelected');
                    }
                },
                channelPending() {
                    if (state === STATE_SELECTION) {
                        setState(STATE_CHANNEL_PENDING);
                    } else {
                        operationNoAllowedInCurrentState('channelPending');
                    }
                }
            };
        })(updateUiForState);

        function updateUiForState(state) {
            elShowsSelected.style.display = state === STATE_INITIAL ? 'none' : 'inline';
            elCreateChannelButton.style.display = [STATE_INITIAL, STATE_NO_SELECTION].includes(state) ? 'none' : 'inline';

            elStationDetails.style.display = model.savedChannelCodes.length ? 'block' : 'none';

            elCreateChannelButton.disabled = state !== STATE_SELECTION;
        }

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

        const view = {
            populateShows() {
                elShowList.innerHTML = '';
                const genreList = buildGenreListForShows(model.shows);

                genreList.forEach(genre => {
                    if (!genre.shows.length) {
                        return;
                    }
                    elShowList.appendChild(buildGenreTitleElement(genre.name));
                    genre.shows.forEach(show => {
                        const elShowButton = buildShowButtonElement(show);
                        elShowButton.onclick = () => {
                            showClickHandler(show);
                        };
                        elShowList.appendChild(elShowButton);
                    });

                });

                elCreateChannelButton.onclick = createChannelClickHandler;
                elDeleteStationButton.onclick = deleteStationClickHandler;
                elAddAnotherChannel.onclick = () => {
                    elStationBuilderTitle.scrollIntoView({behavior: 'smooth'});
                };
                stateMachine.reset();
            },
            updateShowSelections() {
                model.shows.forEach(show => {
                    show.elements.forEach(el => {
                        el.classList.toggle('selected', show.selected);
                    });
                });
                const selectedCount = model.shows.filter(show => show.selected).length;

                if (selectedCount === 0) {
                    elShowsSelected.innerHTML = 'Pick some shows to add to a new channel';

                } else if (selectedCount === 1) {
                    elShowsSelected.innerHTML = '1 show selected';
                    elCreateChannelButton.innerHTML = 'Create a new channel with just this show';

                } else {
                    elShowsSelected.innerHTML = `${selectedCount} shows selected`;
                    elCreateChannelButton.innerHTML = `Create a new channel with these ${selectedCount} shows`;
                }

                if (selectedCount) {
                    stateMachine.somethingSelected();
                } else {
                    stateMachine.nothingSelected();
                }
            },
            onShowClick(handler) {
                showClickHandler = handler;
            },
            onDeleteStationClick(handler) {
                deleteStationClickHandler = handler;
            },
            onBuildChannelClick(handler) {
                createChannelClickHandler = () => {
                    const selectedShowIndexes = model.shows.filter(show => show.selected).map(show => show.index);
                    stateMachine.channelPending();
                    handler(selectedShowIndexes).then(code => {
                        model.savedChannelCodes.push(code);
                        model.shows.forEach(show => show.selected = false);
                        const path = `?channels=${model.savedChannelCodes.join(',')}`;
                        elChannelCount.innerHTML = `Your station now has ${model.savedChannelCodes.length} channel${model.savedChannelCodes.length === 1 ? '' : 's'}`;
                        elGoToStation.onclick = () => {
                            window.location.href = `/${path}`;
                        };
                        model.shows.forEach(show => show.selected = false);
                        view.updateShowSelections();
                        stateMachine.nothingSelected();

                    }).catch(err => {
                        stateMachine.somethingSelected();
                        console.error(err);
                    })
                };
            }
        };

        return view;
    })();

    return {
        populate(shows) {
            "use strict";
            model.shows.length = 0;
            model.shows.push(...shows.filter(show => !show.isCommercial).map(show => {
                return {
                    index: show.index,
                    name: show.name,
                    selected: false,
                    channels: show.channels
                };
            }));

            view.onShowClick(show => {
                show.selected = !show.selected;
                view.updateShowSelections();
            });
            view.onBuildChannelClick(channelRequestedHandler);
            view.onDeleteStationClick(() => {
                model.savedChannelCodes.length = 0;
                model.shows.forEach(show => show.selected = false);
                view.updateShowSelections();
            });
            view.populateShows();
            view.updateShowSelections();
        },
        onChannelRequested(handler) {
            "use strict";
            channelRequestedHandler = handler;
        }
    };
})();