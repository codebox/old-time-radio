function buildModel() {
    "use strict";
    const MIN_VOLUME = 1,
        MAX_VOLUME = 10,
        MODE_NORMAL = 'normal',
        MODE_SINGLE_SHOW = 'singleShow',
        MODE_USER_CHANNELS = 'userChannels',
        STORED_PROPS = {
            'volume': MAX_VOLUME,
            'visualiserId': 'Oscillograph'
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
                const propDefaultValue = STORED_PROPS[propName];
                model[propName] = Number(localStorage.getItem(propName)) || localStorage.getItem(propName) || propDefaultValue;
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