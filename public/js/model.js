function buildModel() {
    "use strict";
    const MIN_VOLUME = 1,
        MAX_VOLUME = 10,
        MODE_NORMAL = 'normal',
        MODE_SINGLE_SHOW = 'singleShow',
        MODE_USER_CHANNELS = 'userChannels',
        STORED_PROPS = {
            'volume': MAX_VOLUME,
            'visualiserId': 'Oscillograph',
            'showInfoMessages': true,
            'showNowPlayingMessages': true,
        };

    let volume = 10,
        mode,
        stationBuilderModel = {
            shows:[],
            savedChannelCodes: [],
            commercialShowIds:[],
            includeCommercials: false
        };

    const model = {
        load() {
            Object.keys(STORED_PROPS).forEach(propName => {
                const valueAsString = localStorage.getItem(propName);
                let typedValue;

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
                model[propName] = typedValue;
            });
        },
        save() {
            Object.keys(STORED_PROPS).forEach(propName => {
                localStorage.setItem(propName, model[propName]);
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
        set volume(value) {
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