import type {Millis, Seconds} from "./clock.mjs";

export type WebClientConfig = {
    minRequestIntervalMillis: number
}

export type Config = {
    "web": {
        "port": number,
        "paths": {
            "static": UrlPath,
            "publicUrlPrefix": UrlPath,
            "listenTo": UrlPath,
            "api": {
                "shows": UrlPath,
                "channels": UrlPath,
                "channel": UrlPath,
                "generate": UrlPath,
                "playingNow": UrlPath,
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
    "dataApi": {
        "baseUrl": Url,
        "paths": {
            "summaries": UrlPath
        }
    }
};

export type ConfigShow = {
    name: ShowName,
    shortName?: ShowName,
    playlists: PlaylistId[],
    id: ShowId,
    isCommercial: IsCommercial,
    skip?: SkipText[]
}

export type ConfigChannel = {
    name: ChannelId,
    shows: ShowId[]
}

export type ArchiveOrgFileMetadata = {
    "name": string,
    "format": string,
    "length": string,
    "title"?: string,
};

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

export type UrlPath = string & { readonly __brand: unique symbol };
export type ChannelName = string & { readonly __brand: unique symbol }; // eg 'action', 'future'
export type ChannelCode = string & { readonly __brand: unique symbol }; // eg '0004', '00000g'
export type ChannelId = ChannelName | ChannelCode
export type ShowName = string & { readonly __brand: unique symbol };
export type EpisodeName = string & { readonly __brand: unique symbol };
export type ShortEpisodeSummary = string & { readonly __brand: unique symbol };
export type MediumEpisodeSummary = string & { readonly __brand: unique symbol };
export type DescriptiveId = string & { readonly __brand: unique symbol };
export type PlaylistId = string & { readonly __brand: unique symbol };
export type ShowId = number & { readonly __brand: unique symbol };
export type EpisodeIndex = number & { readonly __brand: unique symbol };
export type Url = string & { readonly __brand: unique symbol };
export type Xml = string & { readonly __brand: unique symbol };
export type IsCommercial = boolean & { readonly __brand: unique symbol };
export type SkipText = string & { readonly __brand: unique symbol };
export type OtrDataEpisodeId = string & { readonly __brand: unique symbol };

export type OtrDocument = {
    id: OtrDataEpisodeId,
    text: string,
    metadata: {
        [key: string]: string
    }
}
export type OtrDataSummaryResponse = {
    [key in OtrDataEpisodeId]: {
        short: ShortEpisodeSummary,
        medium: MediumEpisodeSummary,
    }
}

export type ShowsListItem = {
    channels: ChannelId[], // used on client-side in Channel Builder to decide which section to display the show in
    id: ShowId, // comes from config.json
    isCommercial: IsCommercial, // comes from config.json
    name: ShowName, // comes from config.json
    shortName: ShowName, // used on client-side in various places where we need to display the name without taking up a lot of space. Comes from config.json but not defined for all shows, we fallback to the full name if nothing is specified in the config file
    descriptiveId: DescriptiveId, // a normalised, url-safe version of the show name, used for 'listen-to' urls, sitemap etc
    channelCode: ChannelCode // code for a channel with just this show, needed for the 'listen-to' urls so we can retrieve the schedule
}

export type EpisodeId = string;

export type Episode = {
    index: EpisodeIndex,
    showId: ShowId,
    showName: ShowName,
    length: Seconds
}

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

export type FullChannelSchedule = {
    list: Episode[]
    length: Seconds,
}

export type CurrentChannelSchedule = {
    list: Episode[]
    initialOffset: Seconds,
}

export type CurrentChannelScheduleWithDetails = {
    list: EpisodeDetails[]
    initialOffset: Seconds,
}

export type PlayingNowAndNext = {
    [key in ChannelId]: CurrentChannelSchedule
}

export type ShowCounts = Map<ShowId, number>;
export type ScheduleResults = ShowId[]
export type ScheduleResultsAfterInsertHandler = (results: ScheduleResults) => void;

export type StringTransformer = (input: string) => string;

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

export type NameParserStats = {
    ok: number,
    failed: number,
    playlists: Map<PlaylistId, {ok: number, failed: number}>
}

export type Generator<T> = {
    next: () => T,
    length: number
}