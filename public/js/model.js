function buildModel() {
    "use strict";
    const MIN_VOLUME = 1,
        MAX_VOLUME = 10,
        STORED_PROPS = {
            'volume': MAX_VOLUME
        };

    let volume = 10, stationBuilderModel = {
        shows:[],
        savedChannelCodes: [],
        commercialShowIds:[],
        includeCommercials: false
    };

    const model = {
        load() {
            Object.keys(STORED_PROPS).forEach(propName => {
                const propDefaultValue = STORED_PROPS[propName];
                model[propName] = Number(localStorage.getItem(propName)) || propDefaultValue;
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
        stationBuilder: stationBuilderModel
    };

    model.load();

    return model;
}