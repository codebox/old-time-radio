import {readFile} from "fs/promises";

export type Config = {
    "web": {
        "port": number,
        "paths": {
            "static": string,
            "listenTo": string,
            "api": {
                "shows": string,
                "channels": string,
                "channel": string,
                "generate": string,
                "playingNow": string,
            }
        }
    },
    "log": {
        "level": string
    },
    "minRequestIntervalMillis": number
};

export const config: Config = JSON.parse(await readFile("config.json", "utf8"));
