import {
    EVENT_STATION_BUILDER_SHOW_CLICK,
    EVENT_STATION_BUILDER_PLAY_COMMERCIALS_CLICK,
    EVENT_STATION_BUILDER_CREATE_CHANNEL_CLICK,
    EVENT_STATION_BUILDER_GO_TO_CHANNEL_CLICK,
    EVENT_STATION_BUILDER_ADD_CHANNEL_CLICK,
    EVENT_STATION_BUILDER_DELETE_STATION_CLICK
} from './events.mjs';
import type { StationBuilderView, EventSource, StationBuilderModel, StationBuilderShow } from './types.mjs';

type Genre = {
    name: string;
    shows: StationBuilderShow[];
};

export function buildStationBuilderView(eventSource: EventSource): StationBuilderView {
    const elShowList = document.getElementById('showList')!;
    const elShowsSelected = document.getElementById('showsSelected')!;
    const elCreateChannelButton = document.getElementById('createChannel')!;
    const elStationDetails = document.getElementById('stationDetails')! as HTMLDivElement;
    const elGoToStation = document.getElementById('goToStation')!;
    const elAddAnotherChannel = document.getElementById('addAnotherChannel')!;
    const elChannelCount = document.getElementById('channelCount')!;
    const elDeleteStationButton = document.getElementById('deleteStation')!;
    const elStationBuilderTitle = document.getElementById('stationBuilderTitle')!;
    const elIncludeAdsInChannelButton = document.getElementById('adsInChannel')!;

    const CSS_CLASS_SELECTED = 'selected';

    function buildGenreListForShows(shows: StationBuilderShow[]): Genre[] {
        const unclassifiedShows: StationBuilderShow[] = [];
        const genreMap: Record<string, StationBuilderShow[]> = {};

        function sortShowsByName(s1: StationBuilderShow, s2: StationBuilderShow): number {
            return s1.name > s2.name ? 1 : -1;
        }
        shows.forEach(show => {
            if (show.channels && show.channels.length) {
                show.channels.forEach(channelName => {
                    if (!genreMap[channelName as string]) {
                        genreMap[channelName as string] = [];
                    }
                    genreMap[channelName as string].push(show);
                });
            } else {
                unclassifiedShows.push(show);
            }
        });

        const genreList: Genre[] = [];
        Object.keys(genreMap).sort().forEach(genreName => {
            genreList.push({ name: genreName, shows: genreMap[genreName].sort(sortShowsByName) });
        });
        genreList.push({ name: 'other', shows: unclassifiedShows.sort(sortShowsByName) });

        return genreList;
    }

    function buildGenreTitleElement(genreName: string): HTMLHeadingElement {
        const el = document.createElement('h3');
        el.innerHTML = `${genreName} shows`;
        return el;
    }

    function buildShowButtonElement(show: StationBuilderShow): HTMLButtonElement {
        const button = document.createElement('button');
        button.innerHTML = show.name as string;
        button.dataset.id = show.id as string;
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

    function updateCreateChannelVisibility(selectedChannelsCount: number) {
        const isButtonVisible = selectedChannelsCount > 0;
        (elCreateChannelButton as HTMLElement).style.display = isButtonVisible ? 'inline' : 'none';
    }

    function updateCreateChannelButtonText(selectedChannelsCount: number) {
        let buttonText: string;

        if (selectedChannelsCount === 0) {
            buttonText = '';

        } else if (selectedChannelsCount === 1) {
            buttonText = 'Create a new channel with just this show';

        } else {
            buttonText = `Create a new channel with these ${selectedChannelsCount} shows`;
        }

        elCreateChannelButton.innerHTML = buttonText;
    }

    function updateStationDescription(selectedChannelsCount: number, includeCommercials: boolean) {
        const commercialsStatus = includeCommercials ? 'Commercials will play between programmes' : 'No commercials between programmes';

        let description: string;

        if (selectedChannelsCount === 0) {
            description = 'Pick some shows to add to a new channel';

        } else if (selectedChannelsCount === 1) {
            description = `1 show selected<br>${commercialsStatus}`;

        } else {
            description = `${selectedChannelsCount} shows selected<br>${commercialsStatus}`;
        }

        elShowsSelected.innerHTML = description;
    }

    function getSelectedChannelCount(stationBuilderModel: StationBuilderModel): number {
        return stationBuilderModel.shows.filter(show => show.selected).length;
    }

    return {
        populate(stationBuilderModel: StationBuilderModel) {
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

        updateShowSelections(stationBuilderModel: StationBuilderModel) {
            stationBuilderModel.shows.forEach(show => {
                if (show.elements) {
                    show.elements.forEach(el => {
                        el.classList.toggle(CSS_CLASS_SELECTED, show.selected);
                        el.ariaChecked = String(show.selected);
                    });
                }
            });

            const selectedChannelsCount = getSelectedChannelCount(stationBuilderModel);
            updateCreateChannelVisibility(selectedChannelsCount);
            updateCreateChannelButtonText(selectedChannelsCount);
            updateStationDescription(selectedChannelsCount, stationBuilderModel.includeCommercials);
        },

        updateIncludeCommercials(stationBuilderModel: StationBuilderModel) {
            elIncludeAdsInChannelButton.classList.toggle(CSS_CLASS_SELECTED, stationBuilderModel.includeCommercials);
            (elIncludeAdsInChannelButton as HTMLButtonElement).ariaChecked = String(stationBuilderModel.includeCommercials);

            const selectedChannelsCount = getSelectedChannelCount(stationBuilderModel);
            updateStationDescription(selectedChannelsCount, stationBuilderModel.includeCommercials);
        },

        updateStationDetails(stationBuilderModel: StationBuilderModel) {
            elStationDetails.style.display = stationBuilderModel.savedChannelCodes.length ? 'block' : 'none';

            const channelCount = stationBuilderModel.savedChannelCodes.length;
            elChannelCount.innerHTML = `Your station now has ${channelCount} channel${channelCount === 1 ? '' : 's'}`;
        },

        addAnotherChannel() {
            elStationBuilderTitle.scrollIntoView({ behavior: 'smooth' });
        }
    };
}
