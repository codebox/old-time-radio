import { config } from "./config.mjs";
import { buildChannelCodeFromShowIds } from "./channelCodes.mjs";
import { getSitemapXml } from "./sitemap.mjs";
import { shows } from "./shows.mjs";
import { scheduler } from "./scheduler.mjs";
import { otrData } from "./otrData.mjs";
function getChannelIdsForShowId(showId) {
    return config.channels.filter(channel => channel.shows.includes(showId)).map(channel => channel.name);
}
function getDescriptiveIdForShowName(showName) {
    return showName.toLowerCase().replace(/ /g, '-').replace(/-+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
}
export class Service {
    showsForSearchCache = null;
    getShowsListItemFromConfigShow(configShow) {
        return {
            channels: getChannelIdsForShowId(configShow.id),
            id: configShow.id,
            isCommercial: configShow.isCommercial,
            name: configShow.name,
            shortName: configShow.shortName || configShow.name,
            descriptiveId: getDescriptiveIdForShowName(configShow.name),
            channelCode: buildChannelCodeFromShowIds([configShow.id]),
        };
    }
    getShows() {
        return Promise.resolve(config.shows.map(show => this.getShowsListItemFromConfigShow(show)));
    }
    getChannels() {
        return Promise.resolve(config.channels.map(channel => channel.name));
    }
    async getScheduleForChannel(channelId, length) {
        const scheduleWithoutDetails = await scheduler.getScheduleForChannel(channelId, length), scheduleEpisodeDetails = await Promise.all(scheduleWithoutDetails.list.map(episode => shows.getEpisodeDetails(episode)));
        return {
            list: scheduleEpisodeDetails,
            initialOffset: scheduleWithoutDetails.initialOffset,
        };
    }
    getCodeForShowIds(showIds) {
        return buildChannelCodeFromShowIds(showIds);
    }
    getPlayingNowAndNext(channels) {
        return Promise.all(channels.map(channelId => scheduler.getPlayingNowAndNext(channelId))).then(channelSchedules => {
            const result = {};
            channels.map((channelId, index) => {
                result[channelId] = channelSchedules[index];
            });
            return result;
        });
    }
    async search(searchText) {
        const otrDataSearchResponse = await otrData.search(searchText);
        return otrDataSearchResponse.map(item => ({
            id: item.id,
            show: item.metadata.show,
            episode: item.metadata.episode,
            summary: item.metadata.summary_small,
            url: item.metadata.url,
            similarity: item.similarity,
            textMatches: item.metadata._chunks.map(chunk => chunk.text)
        }));
    }
    async getEpisodeDetails(episodeId) {
        return await otrData.getEpisodeDetails(episodeId);
    }
    async getShowsForSearch() {
        if (this.showsForSearchCache === null) {
            this.showsForSearchCache = await otrData.getShows();
        }
        return this.showsForSearchCache;
    }
    async getEpisodesForShow(showName) {
        return await otrData.getEpisodeDetailsForShow(showName);
    }
    async getSitemapXml() {
        const shows = await this.getShows();
        return await getSitemapXml(shows);
    }
}
//# sourceMappingURL=service.mjs.map