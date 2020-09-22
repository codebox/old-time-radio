const channelBuilder = (() => {
    const model = [],
        STATE_INITIAL = 0,
        STATE_NO_SELECTION = 1,
        STATE_SELECTION = 2,
        STATE_CHANNEL_PENDING = 3,
        STATE_CHANNEL_CREATED = 4;

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

        function updateUiForState(state) {
            const showButtons = state === STATE_INITIAL ? 'none' : 'inline';
            elShowsSelected.style.display = showButtons;
            elBuildChannelButton.style.display = showButtons;
            elResetChannelButton.style.display = showButtons;
            elChannelUrl.style.display = state === STATE_CHANNEL_CREATED ? 'block' : 'none';

            elBuildChannelButton.disabled = state !== STATE_SELECTION;
            elResetChannelButton.disabled = [STATE_INITIAL, STATE_NO_SELECTION, STATE_CHANNEL_PENDING].includes(state);
        }

        updateUiForState(STATE_INITIAL);

        const view = {
            populateShows() {
                elShowList.innerHTML = '';
                model.forEach(show => {
                    const elShowButton = buildShowButtonElement(show);
                    elShowButton.onclick = () => {
                        showClickHandler(show);
                    };
                    elShowList.appendChild(elShowButton);
                });
                elBuildChannelButton.onclick = buildChannelClickHandler;
                elResetChannelButton.onclick = resetClickHandler;
                updateUiForState(STATE_NO_SELECTION);
            },
            updateShowSelections() {
                model.forEach(show => {
                    show.el.classList.toggle('selected', show.selected);
                });
                const selectedCount = model.filter(show => show.selected).length;
                elShowsSelected.innerHTML = `${selectedCount || 'No'} show${selectedCount === 1 ? '' : 's'} selected`;

                updateUiForState(selectedCount ? STATE_SELECTION : STATE_NO_SELECTION);
            },
            onShowClick(handler) {
                showClickHandler = handler;
            },
            onResetClick(handler) {
                resetClickHandler = handler;
            },
            onBuildChannelClick(handler) {
                buildChannelClickHandler = () => {
                    const selectedShowIndexes = model.filter(show => show.selected).map(show => show.index);
                    updateUiForState(STATE_CHANNEL_PENDING);
                    handler(selectedShowIndexes).then(code => {
                        const path = `?channels=${code}`;
                        elChannelUrl.innerHTML = `Channel created. You can listen here:<br><a href="./${path}">https://oldtime.radio/${path}</a>`;
                        updateUiForState(STATE_CHANNEL_CREATED);

                    }).catch(err => {
                        updateUiForState(STATE_SELECTION);
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
            model.length = 0;
            model.push(...shows.filter(show => !show.isCommercial).map(show => {
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
                model.forEach(show => show.selected = false);
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