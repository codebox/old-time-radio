import type {Millis} from "./clock.mjs";

export type Config = {
    "web": {
        "port": number,
        "paths": {
            "static": UrlPath,
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
    "minRequestIntervalMillis": Millis,
    "shows" : [ConfigShow],
    "channels" : [ConfigChannel]
};

export type ConfigShow = {
    name: ShowName,
    shortName?: ShowName,
    playlists: [PlaylistId],
    index: ShowIndex,
    isCommercial: boolean
}

export type ConfigChannel = {
    name: ChannelId,
    shows: [ShowIndex]
}

export type ArchiveOrgMetadata = {
    alternate_locations: {
        servers: [
            {
                "server": string,
                "dir": string,
            }
        ],
            "workable": [
            {
                "server": string,
                "dir": string,
            }
        ]
    },
    "d1": string,
    "d2": string,
    "dir": string,
    "files": [
        {
            "name": string,
            "format": string,
            "length": string,
        }
    ],
    "server": string,
    "workable_servers": [string]
}

export type UrlPath = string & { readonly __brand: unique symbol };
export type ChannelId = string & { readonly __brand: unique symbol };
export type ChannelCode = string & { readonly __brand: unique symbol };
export type ShowName = string & { readonly __brand: unique symbol };
export type DescriptiveId = string & { readonly __brand: unique symbol };
export type PlaylistId = string & { readonly __brand: unique symbol };
export type ShowIndex = number & { readonly __brand: unique symbol };

export type ShowsListItem = {
    channels: ChannelId[], // used on client-side in Channel Builder to decide which section to display the show in
    index: ShowIndex, // comes from config.json
    isCommercial: boolean, // comes from config.json
    name: ShowName, // comes from config.json
    shortName: ShowName, // used on client-side in various places where we need to display the name without taking up a lot of space. Comes from config.json but not defined for all shows, we fallback to the full name if nothing is specified in the config file
    descriptiveId: DescriptiveId, // a normalised, url-safe version of the show name, used for 'listen-to' urls, sitemap etc
    channelCode: ChannelCode
}