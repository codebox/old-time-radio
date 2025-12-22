// Re-export shared types
export type {
    ShowId,
    ShowName,
    EpisodeId,
    EpisodeTitle,
    EpisodeNumber,
    ChannelName,
    ChannelCode,
    ChannelId,
    BroadcastDate,
    ShortEpisodeSummary,
    MediumEpisodeSummary,
    Url,
    Seconds,
    Millis,
    ApiShow,
    ApiShowEnriched,
    Episode,
    ChannelSchedule,
    ApiShowsResponse,
    ApiChannelsResponse,
    ApiChannelScheduleResponse,
    ApiChannelCodeGenerateResponse,
    ApiPlayingNowResponse
} from '../shared/types.mjs';

import type {
    ShowId,
    ShowName,
    EpisodeId,
    EpisodeTitle,
    EpisodeNumber,
    ChannelName,
    ChannelCode,
    BroadcastDate,
    ShortEpisodeSummary,
    Url,
    Seconds,
    Episode,
    ChannelSchedule,
    ApiShow
} from '../shared/types.mjs';

// ============================================
// Backend-specific branded types
// ============================================

// Unique numeric code for a show, read from config file and used to generate channel codes
export type ShowNumber = number & { readonly __brand: unique symbol };

export type Hours = number & { readonly __brand: unique symbol };

// Long summary of an episode (several paragraphs) returned from the data service
export type LongEpisodeSummary = string & { readonly __brand: unique symbol };

// Search text entered by the user
export type SearchText = string & { readonly __brand: unique symbol };

// Represents the XML content of a sitemap
export type SiteMapXml = string & { readonly __brand: unique symbol };

// ============================================
// Backend-specific data types
// ============================================

// Alias for shared ApiShow (backend Show is what API returns)
export type Show = ApiShow;

// Data about a specific show, read from the config file
export type ShowConfig = {
    id: ShowId;
    number: ShowNumber;
    isCommercial: boolean;
};

// Episode with optional long summary (for episode detail pages)
export type EpisodeWithLongSummary = Episode & {
    summaryLong?: LongEpisodeSummary;
};

// Data about a specific channel, read from the config file
export type Channel = {
    name: ChannelName;
    playCommercials: boolean;
    shows: ShowId[];
};

// Full list of all episodes that will play on a channel in order
export type FullChannelSchedule = {
    list: Episode[];
    length: Seconds;
};

// Alias for shared ChannelSchedule
export type CurrentChannelSchedule = ChannelSchedule;

// Contains an abbreviated schedule (now and next) for multiple channels
export type PlayingNowAndNext = {
    [key: string]: CurrentChannelSchedule;
};

// Single search result, returned from the data service
export type SearchResult = {
    id: EpisodeId;
    similarity: number;
    metadata: {
        show: ShowName;
        episode: EpisodeTitle;
        summary_small: ShortEpisodeSummary;
    };
};

/**
 * Generic generator interface for iterating through a sequence.
 * Used in schedule generation and other iteration-based operations.
 */
export type Generator<T> = {
    next: () => T;
    length: number;
};

// ============================================
// View data types (for EJS templates)
// ============================================

export type SearchViewData = {
    searchText?: SearchText;
    goodMatchThreshold: number;
    exampleSearch: SearchText;
};

export type ShowsViewData = {
    links: { text: string; url: Url }[];
};

export type EpisodeViewData = {
    id: EpisodeId;
    similarity: number;
    show: ShowName;
    episode: EpisodeTitle;
    summary: ShortEpisodeSummary;
};

export type EpisodeDetailsViewData = {
    id: EpisodeId;
    showId: ShowId;
    show: ShowName;
    title: EpisodeTitle;
    duration: string;
    date: BroadcastDate;
    number: EpisodeNumber;
    url: Url;
    summarySmall: ShortEpisodeSummary;
    summaryLong: LongEpisodeSummary;
};

export type EpisodesViewData = {
    showName: ShowName;
    episodes: EpisodeViewData[];
};

export type SearchResultsViewData = {
    summaries: EpisodeViewData[];
};

// ============================================
// Data service response types
// ============================================

export type DataServiceShowsResponse = Show[];

export type DataServiceEpisodesResponse = Episode[];

export type DataServiceEpisodeDetailsResponse = EpisodeWithLongSummary;

export type DataServiceSearchResponse = SearchResult[];
