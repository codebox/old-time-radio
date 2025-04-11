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
    playlists: [PlaylistId],
    index: ShowIndex,
    isCommercial: boolean
}

export type ConfigChannel = {
    name: ChannelName,
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
export type ChannelName = string & { readonly __brand: unique symbol };
export type ShowName = string & { readonly __brand: unique symbol };
export type PlaylistId = string & { readonly __brand: unique symbol };
export type ShowIndex = number & { readonly __brand: unique symbol };

export type ShowsList = {
    channels: [ChannelId],
    index: ShowIndex,
    isCommercial: boolean,
    name: string,
    shortName: string,
    descriptiveId: string,
    channelCode: ChannelCode
}