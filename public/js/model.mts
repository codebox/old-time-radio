import type {Model, StationBuilderModel } from './types.mjs';

export function buildModel(): Model {
    const MIN_VOLUME = 1,
        MAX_VOLUME = 10,
        MODE_NORMAL = 'normal',
        MODE_SINGLE_SHOW = 'singleShow',
        MODE_USER_CHANNELS = 'userChannels',
        STORED_PROPS: Record<string, unknown> = {
            'volume': MAX_VOLUME,
            'visualiserId': 'Oscillograph',
            'showInfoMessages': true,
            'showNowPlayingMessages': true,
            'showSummaryWhenTuningIn': true,
        };

    let volume = 10,
        mode: string,
        stationBuilderModel: StationBuilderModel = {
        shows: [],
        savedChannelCodes: [],
        commercialShowIndexes: [],
        includeCommercials: false
    };

    const model: Model = {
        // Dynamic properties that will be set at runtime
        channels: null,
        shows: null,
        selectedChannelId: null,
        selectedScheduleChannelId: null,
        playlist: null,
        track: null,
        nextTrackOffset: null,
        visualiserId: 'Oscillograph',
        showInfoMessages: true,
        showNowPlayingMessages: true,
        showSummaryWhenTuningIn: true,

        load() {
            Object.keys(STORED_PROPS).forEach(propName => {
                const valueAsString = localStorage.getItem(propName);
                let typedValue: unknown;

                if (valueAsString === null) {
                    typedValue = STORED_PROPS[propName];
                } else if (valueAsString === 'true') {
                    typedValue = true;
                } else if (valueAsString === 'false') {
                    typedValue = false;
                } else if (/^\d+$/.test(valueAsString)) {
                    typedValue = Number(valueAsString);
                } else {
                    typedValue = valueAsString;
                }
                (model as Record<string, unknown>)[propName] = typedValue;
            });
        },
        save() {
            Object.keys(STORED_PROPS).forEach(propName => {
                localStorage.setItem(propName, String((model as Record<string, unknown>)[propName]));
            });
        },
        get maxVolume() {
            return MAX_VOLUME;
        },
        get minVolume() {
            return MIN_VOLUME;
        },
        get volume() {
            return volume;
        },
        set volume(value: number) {
            volume = Math.max(Math.min(value, MAX_VOLUME), MIN_VOLUME);
        },
        setModeNormal() {
            mode = MODE_NORMAL;
        },
        setModeSingleShow() {
            mode = MODE_SINGLE_SHOW;
        },
        setModelUserChannels() {
            mode = MODE_USER_CHANNELS;
        },
        isUserChannelMode() {
            return mode === MODE_USER_CHANNELS;
        },
        isSingleShowMode() {
            return mode === MODE_SINGLE_SHOW;
        },
        stationBuilder: stationBuilderModel
    };

    model.load();

    return model;
}
