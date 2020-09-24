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
            elResetChannelButton = document.getElementById('resetChannel'),
            elBuildChannelButton = document.getElementById('buildChannel'),
            elChannelUrl = document.getElementById('channelUrl');

        let showClickHandler, buildChannelClickHandler, resetClickHandler;

        function buildShowButtonElement(show) {
            const el = document.createElement('li');
            el.innerHTML = show.name;
            el.dataset.index = show.index;
            el.classList.add('showButton');
            show.el = el;
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
                    if ([STATE_NO_SELECTION, STATE_SELECTION].includes(state)) {
                        setState(STATE_SELECTION);
                    } else if (state === STATE_CHANNEL_PENDING) {
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
            const showButtons = state === STATE_INITIAL ? 'none' : 'inline';
            elShowsSelected.style.display = showButtons;
            elBuildChannelButton.style.display = showButtons;
            elResetChannelButton.style.display = showButtons;
            elChannelUrl.style.display = model.savedChannelCodes.length ? 'block' : 'none';

            elBuildChannelButton.disabled = state !== STATE_SELECTION;
            elResetChannelButton.disabled = [STATE_INITIAL, STATE_NO_SELECTION, STATE_CHANNEL_PENDING].includes(state);
        }

        const view = {
            populateShows() {
                elShowList.innerHTML = '';
                model.shows.forEach(show => {
                    const elShowButton = buildShowButtonElement(show);
                    elShowButton.onclick = () => {
                        showClickHandler(show);
                    };
                    elShowList.appendChild(elShowButton);
                });
                elBuildChannelButton.onclick = buildChannelClickHandler;
                elResetChannelButton.onclick = resetClickHandler;
                stateMachine.reset();
            },
            updateShowSelections() {
                model.shows.forEach(show => {
                    show.el.classList.toggle('selected', show.selected);
                });
                const selectedCount = model.shows.filter(show => show.selected).length;
                elShowsSelected.innerHTML = `${selectedCount || 'No'} show${selectedCount === 1 ? '' : 's'} selected`;

                if (selectedCount) {
                    stateMachine.somethingSelected();
                } else {
                    stateMachine.nothingSelected();
                }
            },
            onShowClick(handler) {
                showClickHandler = handler;
            },
            onResetClick(handler) {
                resetClickHandler = handler;
            },
            onBuildChannelClick(handler) {
                buildChannelClickHandler = () => {
                    const selectedShowIndexes = model.shows.filter(show => show.selected).map(show => show.index);
                    stateMachine.channelPending();
                    handler(selectedShowIndexes).then(code => {
                        model.savedChannelCodes.push(code);
                        model.shows.forEach(show => show.selected = false);
                        const path = `?channels=${model.savedChannelCodes.join(',')}`;
                        elChannelUrl.innerHTML = `${model.savedChannelCodes.length} channel${model.savedChannelCodes.length === 1 ? '' : 's'} created. You can listen here:<br><a href="./${path}">https://oldtime.radio/${path}</a>`;
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
                    selected: false
                };
            }));

            view.onShowClick(show => {
                show.selected = !show.selected;
                view.updateShowSelections();
            });
            view.onBuildChannelClick(channelRequestedHandler);
            view.onResetClick(() => {
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