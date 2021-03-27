function buildModel() {
    "use strict";
    const MIN_VOLUME = 1,
        MAX_VOLUME = 10;

    let volume = 10, channels;

    return {
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
        getChannelFromId(channelId) {
            return this.channels.find(channel => channel.id === channelId);
        }
    };
}