const log = require('./log.js'),
    LOG_ID = 'configChecker';

function assertNoRepeatedShowIndexes(shows) {
    const showIndexes = new Set();
    shows.forEach(show => {
         if (showIndexes.has(show.index)) {
             log.error(`${LOG_ID}: duplicate show index: ${show.index}`);
         }
         showIndexes.add(show.index);
    });
}

function logShowsNotOnChannels(shows, channels) {
    const showsInChannels = new Set(channels.flatMap(c => c.shows)),
        showsNotInChannels = shows.filter(show => !showsInChannels.has(show.index));
    log.info(`${LOG_ID} These ${showsNotInChannels.length} shows are not in any channels: ${showsNotInChannels.map(s => s.name).join(', ')}`);
}

function logShowsInMultipleChannels(shows, channels) {
    const channelShows = {};
    channels.forEach(channel => {
        channelShows[channel.name] = new Set(channel.shows);
    });
    shows.forEach(show => {
        const index = show.index,
            channels = Object.keys(channelShows).filter(channelId => channelShows[channelId].has(index));
        if (channels.length > 1) {
            log.info(`${LOG_ID}: '${show.name}' is in multiple channels: ${channels.join(',')}`);
        }
    });
}

module.exports.checkConfig = config => {
    assertNoRepeatedShowIndexes(config.shows);
    logShowsNotOnChannels(config.shows, config.channels);
    logShowsInMultipleChannels(config.shows, config.channels);
}