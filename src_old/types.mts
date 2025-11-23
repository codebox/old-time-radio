import type {Hours, Millis, Seconds} from "./clock.mjs";

/**
 * Configuration for web clients that fetch data from external APIs.
 * Used in Config type for archiveOrg and otrData clients.
 * Example: { minRequestIntervalMillis: 1500 }
 */
export type WebClientConfig = {
    minRequestIntervalMillis: number
}

/**
 * Main application configuration loaded from config.json.
 * Used throughout the application to configure web server, API clients, caching, and show/channel data.
 * Loaded in main application startup and passed to various services.
 */
export type Config = {
    "web": {
        "port": number,
        "paths": {
            "static": UrlPath,
            "publicUrlPrefix": UrlPath,
            "listenTo": UrlPath,
            "search": UrlPath,
            "shows": UrlPath,
            "episodes": UrlPath,
            "episode": UrlPath,
            "api": {
                "shows": UrlPath,
                "channels": UrlPath,
                "channel": UrlPath,
                "generate": UrlPath,
                "playingNow": UrlPath,
                "search": UrlPath,
                "episodes": UrlPath,
                "episode": UrlPath
            }
        }
    },
    "log": {
        "level": string
    },
    "webClients": {
        "archiveOrg": WebClientConfig,
        "otrData": WebClientConfig
    },
    "minRequestIntervalMillis": Millis,
    "shows" : ConfigShow[],
    "channels" : ConfigChannel[],
    "caches": {
        "baseDirectory": string,
        "scheduleCacheMaxItems": number,
        "showsCacheMaxAgeHours": number,
        "showsCacheRefetchIntervalHours": number
    },
    "sitemap": {
        "maxAgeHours": Hours
    },
    "search": {
        "examples": SearchText[],
        "goodMatchThreshold": number
    },
    "dataApi": {
        "baseUrl": Url,
        "paths": {
            "summaries": UrlPath,
            "search": UrlPath,
            "shows": UrlPath,
            "episodes": UrlPath,
            "episode": UrlPath
        }
    }
};

/**
 * Configuration for a radio show from config.json.
 * Used to define which Archive.org playlists contain episodes for each show.
 * Example: { name: "X Minus One", playlists: ["OTRR_X_Minus_One_Singles"], id: 1, isCommercial: false }
 */
export type ConfigShow = {
    name: ShowName,
    shortName?: ShowName,
    playlists: PlaylistId[],
    id: ShowId,
    isCommercial: IsCommercial,
    skip?: SkipText[]
}

/**
 * Configuration for a radio channel from config.json.
 * Used to group multiple shows into themed channels (e.g., "future", "action", "comedy").
 * Example: { name: "future", shows: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 77] }
 */
export type ConfigChannel = {
    name: ChannelId,
    shows: ShowId[]
}

/**
 * Metadata for a single file from Archive.org's metadata API.
 * Used when fetching episode metadata from Archive.org playlists.
 */
export type ArchiveOrgFileMetadata = {
    "name": string,
    "format": string,
    "length": string,
    "title"?: string,
};

/**
 * Full metadata response from Archive.org's metadata API.
 * Used when fetching playlist/collection metadata to get episode files and server locations.
 * Contains file listings and server information for downloading audio files.
 */
export type ArchiveOrgMetadata = {
    alternate_locations: {
        servers: {
            "server": string,
            "dir": string,
        }[],
        "workable": {
            "server": string,
            "dir": string,
        }[]
    },
    "d1": string,
    "d2": string,
    "dir": string,
    "files": ArchiveOrgFileMetadata[],
    "server": string,
    "workable_servers": string[],
    "is_dark"?: boolean
}

/**
 * URL path used in routing and configuration.
 * Used in Config for defining API endpoints and page routes.
 * Examples: "/listen-to", "/search", "/api/shows", "https://oldtime.radio"
 */
export type UrlPath = string & { readonly __brand: unique symbol };

/**
 * Human-readable channel name used in configuration.
 * Used in ConfigChannel and for display in the UI.
 * Examples: "action", "future", "comedy", "horror", "western"
 */
export type ChannelName = string & { readonly __brand: unique symbol };

/**
 * Machine-generated channel code used for single-show channels.
 * Used for creating unique channel identifiers for listen-to URLs.
 * Examples: "0004", "00000g"
 */
export type ChannelCode = string & { readonly __brand: unique symbol };

/**
 * Union type representing either a named channel or a generated channel code.
 * Used throughout the application for channel identification.
 */
export type ChannelId = ChannelName | ChannelCode

/**
 * Name of a radio show.
 * Used in Config, episode metadata, and display throughout the application.
 * Examples: "X Minus One", "Suspense", "The Adventures of Superman", "Gunsmoke"
 */
export type ShowName = string & { readonly __brand: unique symbol };

/**
 * Title of an individual episode.
 * Used in episode metadata and OtrDocument.
 * Examples: Episode titles vary by show
 */
export type EpisodeName = string & { readonly __brand: unique symbol };

/**
 * Date when an episode originally aired.
 * Used in episode metadata from the data API.
 * Format varies, typically strings from Archive.org metadata.
 */
export type EpisodeDate = string & { readonly __brand: unique symbol };

/**
 * Sequential episode number within a show.
 * Used in OtrDocument for episode ordering.
 */
export type EpisodeNumber = number & { readonly __brand: unique symbol };

/**
 * Formatted duration of an episode.
 * Used in display and OtrDocument.
 * Examples: "29:30", "1:23:45" (formatted as [H:]MM:SS)
 */
export type EpisodeLength = string & { readonly __brand: unique symbol };

/**
 * Short summary of an episode (typically 1-2 sentences).
 * Used in search results and episode listings.
 */
export type ShortEpisodeSummary = string & { readonly __brand: unique symbol };

/**
 * Medium-length summary of an episode (typically a paragraph).
 * Used on episode detail pages.
 */
export type MediumEpisodeSummary = string & { readonly __brand: unique symbol };

/**
 * URL-safe, normalized version of a show name.
 * Used in listen-to URLs and sitemaps.
 * Examples: normalized versions of show names for URLs
 */
export type DescriptiveId = string & { readonly __brand: unique symbol };

/**
 * Archive.org playlist/collection identifier.
 * Used in ConfigShow to specify which Archive.org collections contain episodes.
 * Examples: "OTRR_X_Minus_One_Singles", "SUSPENSE", "TheAdventuresOfSuperman_201805"
 */
export type PlaylistId = string & { readonly __brand: unique symbol };

/**
 * Numeric identifier for a show from config.json.
 * Used throughout the application for show identification and scheduling.
 * Examples: 1, 19, 25, 38 (corresponds to show IDs in config.json)
 */
export type ShowId = number & { readonly __brand: unique symbol };

/**
 * Index position of an episode within a channel's schedule.
 * Used in schedule generation and playback tracking.
 */
export type EpisodeIndex = number & { readonly __brand: unique symbol };

/**
 * Full URL to a resource.
 * Used for episode archival URLs and API endpoints.
 * Examples: "http://127.0.0.1:8000", episode URLs from Archive.org
 */
export type Url = string & { readonly __brand: unique symbol };

/**
 * XML content string.
 * Used for sitemap generation and XML responses.
 */
export type Xml = string & { readonly __brand: unique symbol };

/**
 * Boolean flag indicating whether audio contains commercials.
 * Used in ConfigShow and episode metadata to handle commercial content.
 * Examples: true (for show ID 0 - Commercials), false (for most other shows)
 */
export type IsCommercial = boolean & { readonly __brand: unique symbol };

/**
 * Text pattern to skip when filtering episodes.
 * Used in ConfigShow to exclude non-episode content like interviews, intros, or partial episodes.
 * Examples: "interview", "64kb", "Audition", "AFRTS", "Partial"
 */
export type SkipText = string & { readonly __brand: unique symbol };

/**
 * Unique identifier for an episode from the OTR data API.
 * Used in search results, episode lookups, and document IDs.
 */
export type OtrDataEpisodeId = string & { readonly __brand: unique symbol };

/**
 * User search query text.
 * Used in search functionality and stored as examples in config.json.
 * Examples: "native priests steal emerald and escape in helicopter", "purple twilight"
 */
export type SearchText = string & { readonly __brand: unique symbol };

/**
 * Array of search results.
 * Used as the return type for search operations.
 */
export type SearchResults = SearchResult[];

/**
 * Text snippets that matched the search query.
 * Used in SearchResult to highlight relevant portions of episode content.
 */
export type SearchResultTextMatch = string & { readonly __brand: unique symbol };

/**
 * Individual search result returned by the search API.
 * Used in search result pages to display matching episodes.
 */
export type SearchResult = {
    id: OtrDataEpisodeId,
    show: ShowName,
    episode: EpisodeName,
    summary: ShortEpisodeSummary,
    url: Url,
    textMatches: SearchResultTextMatch[]
}

/**
 * Document representing an episode from the OTR data API.
 * Used throughout the application for episode data with convenient getter methods.
 * Provides access to episode metadata including show name, episode title, date, summaries, and URLs.
 */
export class OtrDocument {
    id: OtrDataEpisodeId;
    text: string;
    metadata: {
        [key: string]: string
    };

    constructor(data: { id: OtrDataEpisodeId; text: string; metadata: { [key: string]: string } }) {
        this.id = data.id;
        this.text = data.text;
        this.metadata = data.metadata;
    }

    get url(): Url {
        return this.metadata.url as Url;
    }

    get show(): ShowName {
        return this.metadata.show as ShowName;
    }

    get number(): EpisodeNumber {
        return Number(this.metadata.number) as EpisodeNumber;
    }

    private padTime(num: number): string {
        return num.toString().padStart(2, '0');
    }

    get length(): EpisodeLength {
        const totalSeconds = Number(this.metadata.length),
            hours = Math.floor(totalSeconds / 3600),
            minutes = Math.floor((totalSeconds % 3600) / 60),
            seconds = Math.floor(totalSeconds % 60);

        if (hours) {
            return `${hours}:${this.padTime(minutes)}:${this.padTime(seconds)}` as EpisodeLength;
        } else {
            return `${minutes}:${this.padTime(seconds)}` as EpisodeLength;
        }
    }

    get episode(): EpisodeName {
        return this.metadata.episode as EpisodeName;
    }

    get date(): EpisodeDate {
        return this.metadata.date as EpisodeDate;
    }

    get summarySmall(): ShortEpisodeSummary {
        return this.metadata.summary_small as ShortEpisodeSummary;
    }

    get summaryMedium(): MediumEpisodeSummary {
        return this.metadata.summary_medium as MediumEpisodeSummary;
    }

    get episodePageUrl(): string {
        return `/episode/${this.id}`;
    }
}
/**
 * Response from the data API summaries endpoint.
 * Used to fetch episode summaries for a playlist.
 * Returns array of episodes with their URLs and summaries.
 */
export type OtrDataSummaryResponse = {
    url: Url,
    name: EpisodeName,
    short: ShortEpisodeSummary,
    medium: MediumEpisodeSummary,
}[];

/**
 * Mapping of show names to episode counts.
 * Used for displaying statistics and managing show data.
 */
export type OtrDataShowCounts = {
    [key in ShowName]: number
}

/**
 * Single search result from the OTR data API search endpoint.
 * Used to process semantic search results with similarity scores and text chunks.
 */
export type OtrSearchResult = {
    id: OtrDataEpisodeId,
    text: string,
    similarity: number,
    metadata: {
        show: ShowName,
        episode: EpisodeName,
        summary_small: ShortEpisodeSummary,
        playlist: PlaylistId,
        url: Url,
        _chunks: {
            "similarity": number,
            "text": string
        }[]
    }
}

/**
 * Response from the data API search endpoint.
 * Used to return semantic search results for user queries.
 */
export type OtrDataSearchResponse = OtrSearchResult[];

/**
 * Alias for OtrDocument representing episode data.
 * Used for consistency in API response types.
 */
export type OtrEpisodeData = OtrDocument;

/**
 * Response from the data API episodes endpoint (multiple episodes).
 * Used when fetching all episodes for a show.
 */
export type OtrDataEpisodesResponse = OtrEpisodeData[];

/**
 * Response from the data API episode endpoint (single episode).
 * Used when fetching details for a specific episode by ID.
 */
export type OtrDataEpisodeResponse = OtrEpisodeData;

/**
 * Item in the shows list API response.
 * Used in /api/shows endpoint to provide show metadata for the UI.
 * Contains all information needed to display shows and build channel listings.
 */
export type ShowsListItem = {
    channels: ChannelId[], // used on client-side in Channel Builder to decide which section to display the show in
    id: ShowId, // comes from config.json
    isCommercial: IsCommercial, // comes from config.json
    name: ShowName, // comes from config.json
    shortName: ShowName, // used on client-side in various places where we need to display the name without taking up a lot of space. Comes from config.json but not defined for all shows, we fallback to the full name if nothing is specified in the config file
    descriptiveId: DescriptiveId, // a normalised, url-safe version of the show name, used for 'listen-to' urls, sitemap etc
    channelCode: ChannelCode // code for a channel with just this show, needed for the 'listen-to' urls so we can retrieve the schedule
}

/**
 * Simple string identifier for an episode.
 * Used in various contexts as a generic episode identifier.
 */
export type EpisodeId = string;

/**
 * Episode in a channel schedule with basic information.
 * Used in schedule generation and playback tracking.
 */
export type Episode = {
    index: EpisodeIndex,
    showId: ShowId,
    showName: ShowName,
    length: Seconds
}

/**
 * Detailed episode information including URLs and descriptions.
 * Used when full episode metadata is needed for display or playback.
 */
export type EpisodeDetails = {
    archivalUrl: Url,
    commercial: IsCommercial,
    length: Seconds,
    name: EpisodeName,
    showName: ShowName,
    urls: Url[],
    shortDescription?: ShortEpisodeSummary,
    mediumDescription?: MediumEpisodeSummary,
}

/**
 * Complete schedule for a channel with all episodes.
 * Used in schedule caching and generation.
 * Contains the full episode list and total duration.
 */
export type FullChannelSchedule = {
    list: Episode[]
    length: Seconds,
}

/**
 * Current portion of a channel's schedule with playback offset.
 * Used for calculating what's playing now based on current time.
 * The initialOffset indicates how far into the first episode playback has progressed.
 */
export type CurrentChannelSchedule = {
    list: Episode[]
    initialOffset: Seconds,
}

/**
 * Current channel schedule with full episode details.
 * Used when detailed episode information is needed for the current schedule.
 */
export type CurrentChannelScheduleWithDetails = {
    list: EpisodeDetails[]
    initialOffset: Seconds,
}

/**
 * Map of all channels to their current schedules.
 * Used in /api/playing-now endpoint to show what's currently playing on each channel.
 */
export type PlayingNowAndNext = {
    [key in ChannelId]: CurrentChannelSchedule
}

/**
 * Map tracking the number of episodes per show.
 * Used in schedule generation to ensure balanced distribution of shows across channels.
 */
export type ShowCounts = Map<ShowId, number>;

/**
 * Array of show IDs representing a generated schedule.
 * Used as the output of schedule generation algorithms.
 */
export type ScheduleResults = ShowId[]

/**
 * Callback function invoked after inserting shows into a schedule.
 * Used in schedule generation to track progress or perform post-insertion operations.
 */
export type ScheduleResultsAfterInsertHandler = (results: ScheduleResults) => void;

/**
 * Function that transforms a string input to a string output.
 * Used in NameParserConfig for transforming episode titles, dates, and numbers during parsing.
 */
export type StringTransformer = (input: string) => string;

/**
 * Configuration for parsing episode names from Archive.org file metadata.
 * Used in episode data processing to extract structured information from filenames.
 * Allows custom regex patterns and transformations per playlist.
 */
export type NameParserConfig = {
    playlistIds: PlaylistId | PlaylistId[],
    regex?: RegExp,
    displayName?: EpisodeName,
    showName?: ShowName,
    transforms?: {
        title?: StringTransformer[],
        date?: StringTransformer[],
        num?: StringTransformer[],
    }
}

/**
 * Statistics tracking the success/failure rate of episode name parsing.
 * Used for monitoring and debugging the name parsing process.
 * Tracks overall stats and per-playlist stats.
 */
export type NameParserStats = {
    ok: number,
    failed: number,
    playlists: Map<PlaylistId, {ok: number, failed: number}>
}

/**
 * Generic generator interface for iterating through a sequence.
 * Used in schedule generation and other iteration-based operations.
 * Provides a next() method to get the next item and a length property for total count.
 */
export type Generator<T> = {
    next: () => T,
    length: number
}