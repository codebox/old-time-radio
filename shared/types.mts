// Shared types between frontend and backend
// These types define the API contract

// ============================================
// Branded types for type safety
// ============================================

// SEO-friendly unique identifier for a show
export type ShowId = string & { readonly __brand: unique symbol };

// Human-friendly name for a show
export type ShowName = string & { readonly __brand: unique symbol };

// Unique identifier for an episode
export type EpisodeId = string & { readonly __brand: unique symbol };

// Human-friendly episode title
export type EpisodeTitle = string & { readonly __brand: unique symbol };

// Human-friendly name for a channel
export type ChannelName = string & { readonly __brand: unique symbol };

// Generated channel code for user-defined channels
export type ChannelCode = string & { readonly __brand: unique symbol };

// Union type representing either a named channel or a generated channel code
export type ChannelId = ChannelName | ChannelCode;

// Formatted date string representing when an episode was broadcast
export type BroadcastDate = string & { readonly __brand: unique symbol };

// Short summary of an episode (1-2 sentences)
export type ShortEpisodeSummary = string & { readonly __brand: unique symbol };

// Medium summary of an episode (1 paragraph)
export type MediumEpisodeSummary = string & { readonly __brand: unique symbol };

// Full URL to a resource
export type Url = string & { readonly __brand: unique symbol };

export type Seconds = number & { readonly __brand: unique symbol };
export type Millis = number & { readonly __brand: unique symbol };

// Numeric index identifying a show in config
export type ShowIndex = number & { readonly __brand: unique symbol };

// ============================================
// API Data Types
// ============================================

// Basic show data from data service
export type ApiShow = {
    id: ShowId;
    name: ShowName;
    episodeCount: number;
};

// Enriched show data returned by /api/shows (includes config-derived fields)
export type ApiShowEnriched = ApiShow & {
    index: ShowIndex;           // from config 'number' property
    isCommercial: boolean;      // from config (default false if missing)
    channels: ChannelName[];    // derived from config channels array
};

// Episode number (broadcast order) within a show
export type EpisodeNumber = number & { readonly __brand: unique symbol };

// Episode data structure used in API responses
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
};

// Schedule for a channel - list of episodes and current playback offset
export type ChannelSchedule = {
    list: Episode[];
    initialOffset: Seconds;
};

// ============================================
// API Response Types
// ============================================

// GET /api/shows
export type ApiShowsResponse = ApiShowEnriched[];

// GET /api/channels
export type ApiChannelsResponse = ChannelName[];

// GET /api/channel/:channel
export type ApiChannelScheduleResponse = ChannelSchedule;

// GET /api/channel/generate/:nums
export type ApiChannelCodeGenerateResponse = ChannelCode;

// GET /api/playing-now
export type ApiPlayingNowResponse = {
    [key: string]: ChannelSchedule;
};
