import { buildClock } from './clock.mjs';
import type { Service, ChannelId, ShowIndex, ApiChannelsResponse, ApiShowsResponse, ApiChannelCodeGenerateResponse, ApiChannelScheduleResponse, ApiPlayingNowResponse } from './types.mjs';

type CacheEntry = {
    ts: number;
    playlist: ApiChannelScheduleResponse;
};

export function buildService(): Service {
    const clock = buildClock();
    const playlistCache = (() => {
        const cache: Record<string, CacheEntry> = {};

        function buildKeyName(channelId: ChannelId, length: number | undefined): string {
            return `${channelId}_${length}`;
        }

        return {
            get(channelId: ChannelId, length: number | undefined): ApiChannelScheduleResponse | undefined {
                const key = buildKeyName(channelId, length),
                    entry = cache[key];
                if (entry) {
                    const ageInSeconds = clock.nowSeconds() - entry.ts,
                        initialOffsetInSecondsNow = entry.playlist.initialOffset + ageInSeconds,
                        lengthOfCurrentEpisode = entry.playlist.list[0]?.duration;
                    if (lengthOfCurrentEpisode && lengthOfCurrentEpisode > initialOffsetInSecondsNow) {
                        return {
                            initialOffset: initialOffsetInSecondsNow,
                            list: [...entry.playlist.list]
                        } as ApiChannelScheduleResponse;
                    } else {
                        delete cache[key];
                    }
                }
                return undefined;
            },
            set(channelId: ChannelId, length: number | undefined, playlist: ApiChannelScheduleResponse) {
                const key = buildKeyName(channelId, length);
                cache[key] = {
                    ts: clock.nowSeconds(),
                    playlist: { // defensive copy
                        initialOffset: playlist.initialOffset,
                        list: [...playlist.list]
                    }
                };
            }
        };
    })();

    return {
        getChannels(): Promise<ApiChannelsResponse> {
            return fetch('/api/channels')
                .then(response => response.json());
        },
        getShowList(): Promise<ApiShowsResponse> {
            return fetch('/api/shows')
                .then(response => response.json());
        },
        getChannelCodeForShows(showIndexes: ShowIndex[]): Promise<ApiChannelCodeGenerateResponse> {
            return fetch(`/api/channel/generate/${showIndexes.join(',')}`)
                .then(response => response.json());
        },
        getPlaylistForChannel(channelId: ChannelId, length?: number): Promise<ApiChannelScheduleResponse> {
            const cachedPlaylist = playlistCache.get(channelId, length);
            if (cachedPlaylist) {
                console.log(`Cache HIT for ${channelId}/${length}`);
                return Promise.resolve(cachedPlaylist);
            }
            console.log(`Cache MISS for ${channelId}/${length}`);
            return fetch(`/api/channel/${channelId}${length ? '?length=' + length : ''}`)
                .then(response => {
                    return response.json().then((playlist: ApiChannelScheduleResponse) => {
                        playlistCache.set(channelId, length, playlist);
                        return playlist;
                    });
                });
        },
        getPlayingNow(channelsList?: ChannelId[]): Promise<ApiPlayingNowResponse> {
            const hasChannels = channelsList && channelsList.length > 0,
                channelsParameter = hasChannels ? channelsList.map(encodeURIComponent).join(',') : '';
            return fetch(`/api/playing-now${channelsParameter ? '?channels=' + channelsParameter : ''}`)
                .then(response => response.json());
        }
    };
}
