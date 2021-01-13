const config = (() => {
    "use strict";
    const SETTING_VOLUME = 'volume',
        MIN_VOLUME = 1,
        MAX_VOLUME = 10;

    let volumeValue = Number(localStorage.getItem(SETTING_VOLUME)) || MAX_VOLUME;
    return {
        get maxVolume() {
            return MAX_VOLUME;
        },
        get volume() {
            return volumeValue;
        },
        set volume(newValue) {
            newValue = Math.min(MAX_VOLUME, newValue);
            newValue = Math.max(MIN_VOLUME, newValue);
            localStorage.setItem(SETTING_VOLUME, volumeValue = newValue);
        },
        isVolumeMax() {
            return volumeValue === MAX_VOLUME;
        },
        isVolumeMin() {
            return volumeValue === MIN_VOLUME;
        }
    };
})();