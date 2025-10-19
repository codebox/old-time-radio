import {config} from "./config.mjs";
import type {
    ChannelId,
    ConfigShow,
    DescriptiveId,
    PlayingNowAndNext,
    ShowId,
    ShowsListItem,
    Xml,
    CurrentChannelScheduleWithDetails,
    SearchText,
    SearchResults,
    ShowName,
    EpisodeName,
    ShortEpisodeSummary, Url, SearchResultTextMatch, EpisodeDetails, OtrDocument, EpisodeId, OtrDataEpisodeResponse,
    OtrDataEpisodeId, OtrDataShowCounts, OtrDataEpisodesResponse
} from "./types.mjs";
import {buildChannelCodeFromShowIds} from "./channelCodes.mjs";
import type {Seconds} from "./clock.mjs";
import {getSitemapXml} from "./sitemap.mjs";
import {shows} from "./shows.mjs";
import {scheduler} from "./scheduler.mjs";
import {otrData} from "./otrData.mjs";

function getChannelIdsForShowId(showId: ShowId) {
    return config.channels.filter(channel => channel.shows.includes(showId)).map(channel => channel.name);
}

function getDescriptiveIdForShowName(showName: string): DescriptiveId {
    return showName.toLowerCase().replace(/ /g, '-').replace(/-+/g, '-').replace(/[^a-zA-Z0-9-]/g, '') as DescriptiveId;
}

export class Service {
    private showsForSearchCache: OtrDataShowCounts | null = null;

    private getShowsListItemFromConfigShow(configShow: ConfigShow): ShowsListItem {
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

    getShows(): Promise<ShowsListItem[]> {
        return Promise.resolve(config.shows.map(show => this.getShowsListItemFromConfigShow(show)));
    }

    getChannels(): Promise<ChannelId[]> {
        return Promise.resolve(config.channels.map(channel => channel.name));
    }

    async getScheduleForChannel(channelId: ChannelId, length: Seconds): Promise<CurrentChannelScheduleWithDetails> {
        const scheduleWithoutDetails = await scheduler.getScheduleForChannel(channelId, length),
            scheduleEpisodeDetails = await Promise.all(scheduleWithoutDetails.list.map(episode => shows.getEpisodeDetails(episode)));

        return {
            list: scheduleEpisodeDetails,
            initialOffset: scheduleWithoutDetails.initialOffset,
        } as CurrentChannelScheduleWithDetails;
    }

    getCodeForShowIds(showIds: ShowId[]): ChannelId {
        return buildChannelCodeFromShowIds(showIds);
    }

    getPlayingNowAndNext(channels: ChannelId[]): Promise<PlayingNowAndNext> {
        return Promise.all(channels.map(channelId => scheduler.getPlayingNowAndNext(channelId))).then(channelSchedules => {
        const result = {} as PlayingNowAndNext;
            channels.map((channelId, index) => {
               result[channelId] = channelSchedules[index];
            });
            return result;
        });
    }

    async search(searchText: SearchText): Promise<SearchResults> {
        const otrDataSearchResponse = await otrData.search(searchText);
        return otrDataSearchResponse.map(item => ({
            id: item.id,
            show: item.metadata.show,
            episode: item.metadata.episode,
            summary: item.metadata.summary_small,
            url: item.metadata.url,
            textMatches: item.metadata._chunks.map(chunk => chunk.text) as SearchResultTextMatch[]
        }));
    }

    async getEpisodeDetails(episodeId: OtrDataEpisodeId): Promise<OtrDataEpisodeResponse> {
        return await otrData.getEpisodeDetails(episodeId);
    }

    async getShowsForSearch(): Promise<OtrDataShowCounts> {
        if (this.showsForSearchCache === null) {
            this.showsForSearchCache = await otrData.getShows();
        }
        return this.showsForSearchCache;
    }

    async getEpisodesForShow(showName: ShowName): Promise<OtrDataEpisodesResponse> {
        return await otrData.getEpisodeDetailsForShow(showName);
    }

    getSitemapXml(): Promise<Xml> {
        return this.getShows().then(shows => getSitemapXml(shows));
    }
}