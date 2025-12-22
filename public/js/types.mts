// Re-export shared types
export type {
    ShowId,
    ShowName,
    ShowIndex,
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
} from '../../shared/types.mjs';

import type {
    ShowId,
    ShowName,
    ShowIndex,
    ChannelName,
    ChannelCode,
    Url,
    Seconds,
    Episode,
    ApiShowEnriched,
    ApiChannelScheduleResponse,
    ApiPlayingNowResponse
} from '../../shared/types.mjs';

// ============================================
// Frontend-specific types
// ============================================

// Show data (now comes enriched from the API)
export type Show = ApiShowEnriched;

// Playlist item used internally (episode with additional playback fields)
export type PlaylistItem = Episode & {
    archivalUrl?: Url;
};

// Frontend channel representation
export type Channel = {
    id: ChannelCode | ChannelName;
    name: string;
    userChannel: boolean;
};

// Station builder show representation
export type StationBuilderShow = {
    id: ShowId;
    index: ShowIndex;
    name: ShowName;
    selected: boolean;
    channels: ChannelName[];
    elements?: HTMLButtonElement[];
};

// Station builder model
export type StationBuilderModel = {
    shows: StationBuilderShow[];
    savedChannelCodes: ChannelCode[];
    commercialShowIndexes: ShowIndex[];
    includeCommercials: boolean;
};

// ============================================
// Event system types
// ============================================

export type EventHandler = (event: Event & { data?: unknown }) => void;

export type EventSubscription = {
    then(handler: EventHandler): void;
    ifState(...states: string[]): { then(handler: EventHandler): void };
};

export type EventSource = {
    trigger(eventName: string, eventData?: unknown): void;
    on(eventName: string): EventSubscription;
};

// ============================================
// Component interfaces
// ============================================

export type StateMachine = {
    readonly state: string;
    initialising(): void;
    idle(): void;
    error(): void;
    tuningIn(): void;
    goingToSleep(): void;
    sleeping(): void;
    loadingTrack(): void;
    playing(): void;
};

export type Clock = {
    nowSeconds(): number;
    nowMillis(): number;
};

export type AudioDataSource = {
    get(): number[];
};

export type AudioDataSourceBuilder = {
    withBucketCount(count: number): AudioDataSourceBuilder;
    withRedistribution(p: number): AudioDataSourceBuilder;
    withFiltering(threshold: number): AudioDataSourceBuilder;
    withShuffling(): AudioDataSourceBuilder;
    build(): AudioDataSource;
};

export type VisualiserDataFactory = {
    audioDataSource(): AudioDataSourceBuilder;
};

export type Visualiser = {
    init(canvas: HTMLCanvasElement): void;
    getVisualiserIds(): string[];
    setVisualiserId(id: string): void;
    start(): void;
    stop(delayMillis?: number): void;
    onResize(): () => void;
};

export type AudioPlayer = {
    on: EventSource['on'];
    load(urls: string | string[]): void;
    play(offset?: number): void;
    stop(): void;
    getVolume(): number;
    setVolume(volume: number): void;
    getData(): Uint8Array;
};

export type MessageManager = {
    on: EventSource['on'];
    init(): void;
    showLoadingChannels(): void;
    showSelectChannel(): void;
    showTuningInToChannel(channelName: string): void;
    showNowPlaying(trackName: string): void;
    showTempMessage(): void;
    showSleeping(): void;
    showError(): void;
};

export type SummaryManager = {
    on: EventSource['on'];
    setText(summaryText: string): void;
    showAndThenHide(): void;
    show(): void;
    hide(): void;
    clear(): void;
    toggle(): void;
};

export type SleepTimer = {
    on: EventSource['on'];
    start(minutes: number): void;
    stop(): void;
    getMinutesRequested(): number | null;
};

export type SleepTimerView = {
    init(): void;
    render(totalSeconds: number): void;
    setRunState(isRunning: boolean): void;
};

export type ScheduleView = {
    addChannel(channel: Channel): void;
    setSelectedChannel(selectedChannelId: ChannelCode | ChannelName | null): void;
    displaySchedule(schedule: ApiChannelScheduleResponse): void;
    hideSchedule(): void;
};

export type StationBuilderView = {
    populate(stationBuilderModel: StationBuilderModel): void;
    updateShowSelections(stationBuilderModel: StationBuilderModel): void;
    updateIncludeCommercials(stationBuilderModel: StationBuilderModel): void;
    updateStationDetails(stationBuilderModel: StationBuilderModel): void;
    addAnotherChannel(): void;
};

export type PlayingNowManager = {
    start(details: ApiPlayingNowResponse): void;
    update(details: ApiPlayingNowResponse): void;
    stop(): void;
};

export type SnowMachine = {
    start(intensity: number): void;
    stop(): void;
};

export type Service = {
    getChannels(): Promise<string[]>;
    getShowList(): Promise<ApiShowEnriched[]>;
    getChannelCodeForShows(showIndexes: ShowIndex[]): Promise<ChannelCode>;
    getPlaylistForChannel(channelId: ChannelCode | ChannelName, length?: number): Promise<ApiChannelScheduleResponse>;
    getPlayingNow(channelsList?: (ChannelCode | ChannelName)[]): Promise<ApiPlayingNowResponse>;
};

export type Model = {
    load(): void;
    save(): void;
    readonly maxVolume: number;
    readonly minVolume: number;
    volume: number;
    visualiserId: string;
    showInfoMessages: boolean;
    showNowPlayingMessages: boolean;
    showSummaryWhenTuningIn: boolean;
    setModeNormal(): void;
    setModeSingleShow(): void;
    setModelUserChannels(): void;
    isUserChannelMode(): boolean;
    isSingleShowMode(): boolean;
    stationBuilder: StationBuilderModel;
    // Dynamic properties set at runtime
    channels: Channel[] | null;
    shows: Show[] | null;
    selectedChannelId: ChannelCode | ChannelName | null;
    selectedScheduleChannelId: ChannelCode | ChannelName | null;
    playlist: PlaylistItem[] | null;
    track: PlaylistItem | null;
    nextTrackOffset: Seconds | null;
};

export type View = {
    on: EventSource['on'];
    setChannels(channels: Channel[]): void;
    setNoChannelSelected(): void;
    setChannelLoading(channelId: ChannelCode | ChannelName): void;
    setChannelLoaded(channelId: ChannelCode | ChannelName): void;
    openMenu(): void;
    closeMenu(): void;
    updateVolume(volume: number, minVolume: number, maxVolume: number): void;
    showMessage(message: string): void;
    startSleepTimer(): void;
    updateSleepTimer(seconds: number): void;
    clearSleepTimer(): void;
    sleep(): void;
    wakeUp(): void;
    updateScheduleChannelSelection(channelId?: ChannelCode | ChannelName | null): void;
    displaySchedule(schedule: ApiChannelScheduleResponse): void;
    hideSchedule(): void;
    populateStationBuilderShows(stationBuilderModel: StationBuilderModel): void;
    updateStationBuilderShowSelections(stationBuilderModel: StationBuilderModel): void;
    updateStationBuilderIncludeCommercials(stationBuilderModel: StationBuilderModel): void;
    updateStationBuilderStationDetails(stationBuilderModel: StationBuilderModel): void;
    addAnotherStationBuilderChannel(): void;
    setVisualiser(audioVisualiser: Visualiser): void;
    showPlayingNowDetails(playingNowDetails: ApiPlayingNowResponse): void;
    updatePlayingNowDetails(playingNowDetails: ApiPlayingNowResponse): void;
    hidePlayingNowDetails(): void;
    showDownloadLink(mp3Url: Url): void;
    hideDownloadLink(): void;
    showEpisodeSummary(summary: string): void;
    hideEpisodeSummary(): void;
    showSummaryLink(): void;
    hideSummaryLink(): void;
    showError(errorMsg: unknown): void;
    setVisualiserIds(visualiserIds: string[]): void;
    updateVisualiserId(selectedVisualiserId: string): void;
    updatePrefInfoMessages(showInfoMessages: boolean): void;
    updatePrefNowPlayingMessages(showNowPlayingMessages: boolean): void;
    updatePrefShowSummaryWhenTuningIn(showSummaryWhenTuningIn: boolean): void;
    addShowTitleToPage(title: string): void;
    startSnowMachine(intensity: number): void;
    stopSnowMachine(): void;
};
