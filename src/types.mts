// SEO-friendly unique identifier for a show, returned by the data service and also referenced in the config file
export type ShowId = string & { readonly __brand: unique symbol };

// Human-friendly name for a show, returned by the data service
export type ShowName = string & { readonly __brand: unique symbol };

// Unique numeric code for a show, read from config file and used to generate channel codes
export type ShowNumber = number & { readonly __brand: unique symbol };

// Unique identifier for an episode, returned by the data service
export type EpisodeId = string & { readonly __brand: unique symbol };

// Human-friendly episode title, returned by the data service
export type EpisodeTitle = string & { readonly __brand: unique symbol };

// Episode number (representing its broadcast order) within a show, returned by the data service
export type EpisodeNumber = number & { readonly __brand: unique symbol };

// Human-friendly name for a channel, read from the config file
export type ChannelName = string & { readonly __brand: unique symbol };

// Formatted date (or partial date) string, representing when an episode was broadcast, returned by the data service
export type BroadcastDate = string & { readonly __brand: unique symbol };

// Short summary of an episode (typically 1-2 sentences) returned from the data service
export type ShortEpisodeSummary = string & { readonly __brand: unique symbol };

// Medium summary of an episode (typically 1 paragraph) returned from the data service
export type MediumEpisodeSummary = string & { readonly __brand: unique symbol };

// Long summary of an episode (typically several paragraphs) returned from the data service
export type LongEpisodeSummary = string & { readonly __brand: unique symbol };

// Generated channel code for user-defined channels
export type ChannelCode = string & { readonly __brand: unique symbol };

// Union type representing either a named channel or a generated channel code.
export type ChannelId = ChannelName | ChannelCode

// Full URL to a resource.
export type Url = string & { readonly __brand: unique symbol };

export type Seconds = number & { readonly __brand: unique symbol };
export type Millis = number & { readonly __brand: unique symbol };
export type Hours = number & { readonly __brand: unique symbol };


// Data about a specific show, returned from the data service
export type Show = {
    id: ShowId;
    name: ShowName
    episodeCount: number
}

// Data about a specific show, read from the config file
export type ShowConfig = {
    id: ShowId;
    number: ShowNumber;
    isCommercial: boolean;
}

// Data about a specific episode, returned from the data service
export type Episode = {
    id: EpisodeId;
    showId: ShowId;
    show: ShowName;
    isCommercial: boolean;
    title: EpisodeTitle;
    duration: Seconds;
    date: BroadcastDate;
    number: EpisodeNumber;
    url: Url;
    summarySmall: ShortEpisodeSummary;
    summaryMedium?: MediumEpisodeSummary;
    summaryLong?: LongEpisodeSummary;
}

// Data about a specific channel, read from the config file
export type Channel = {
    name : ChannelName;
    playCommercials: boolean;
    shows: ShowId[];
}

export type ApiShowsResponse = Show[];

export type Schedule = {};

export type ApiChannelScheduleResponse = Schedule;

export type ApiChannelCodeGenerateResponse = ChannelCode;

// Full list of all episodes that will play on a channel in order
export type FullChannelSchedule = {
    list: Episode[]
    length: Seconds,
}

// List of episodes playing now and next on a channel, derived from a FullChannelSchedule and the current time
export type CurrentChannelSchedule = {
    list: Episode[]
    initialOffset: Seconds,
}

// Contains an abbreviated schedule (now and next) for multiple channels
export type PlayingNowAndNext = {
    [key in ChannelId]: CurrentChannelSchedule
};

export type ApiPlayingNowResponse = PlayingNowAndNext;

export type ApiChannelsResponse = ChannelName[];

// Search text entered by the user
export type SearchText = string & { readonly __brand: unique symbol };

// Single search result, returned from the data service
export type SearchResult = {
    id: EpisodeId;
    similarity: number;
    metadata: {
        show: ShowName;
        episode: EpisodeTitle;
        summary_small: ShortEpisodeSummary;
    }
};

// Represents the XML content of a sitemap
export type SiteMapXml = string & { readonly __brand: unique symbol };

/**
 * Generic generator interface for iterating through a sequence.
 * Used in schedule generation and other iteration-based operations.
 * Provides a next() method to get the next item and a length property for total count.
 */
export type Generator<T> = {
    next: () => T,
    length: number
}

// Data used to populate the search.ejs view
export type SearchViewData = {
    searchText?: SearchText;
    goodMatchThreshold: number;
    exampleSearch: SearchText;
}

// Data used to populate the shows.ejs view
export type ShowsViewData = {
    links: { text: string; url: Url }[];
}

// Data used to populate episode.ejs view, also used in episodes.ejs and search.ejs
export type EpisodeViewData = {
    id: EpisodeId;
    similarity: number;
    show: ShowName;
    episode: EpisodeTitle;
    summary: ShortEpisodeSummary;
}

// Data used to populate the episodes.ejs view
export type EpisodesViewData = {
    showName: ShowName;
    episodes: EpisodeViewData[];
}

// Data used to populate the HTML returned in response to a search request
export type SearchResultsViewData = {
    summaries: EpisodeViewData[];
}

// Endpoint responses returned from the data service
export type DataServiceShowsResponse = Show[];

export type DataServiceEpisodesResponse = Episode[];

export type DataServiceEpisodeDetailsResponse = Episode;

export type DataServiceSearchResponse = SearchResult[];
