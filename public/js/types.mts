// Frontend types that mirror or complement backend API response types

// Branded types for type safety (mirroring backend pattern)
export type ShowId = string & { readonly __brand: unique symbol };
export type ShowName = string & { readonly __brand: unique symbol };
export type EpisodeId = string & { readonly __brand: unique symbol };
export type EpisodeTitle = string & { readonly __brand: unique symbol };
export type ChannelName = string & { readonly __brand: unique symbol };
export type ChannelCode = string & { readonly __brand: unique symbol };
export type ChannelId = ChannelName | ChannelCode;
export type BroadcastDate = string & { readonly __brand: unique symbol };
export type ShortEpisodeSummary = string & { readonly __brand: unique symbol };
export type MediumEpisodeSummary = string & { readonly __brand: unique symbol };
export type Url = string & { readonly __brand: unique symbol };
export type Seconds = number & { readonly __brand: unique symbol };
export type Millis = number & { readonly __brand: unique symbol };

// Episode data from API
export type Episode = {
    id: EpisodeId;
    showId: ShowId;
    show: ShowName;
    isCommercial: boolean;
    title: EpisodeTitle;
    duration: Seconds;
    date: BroadcastDate;
    url: Url;
    summarySmall: ShortEpisodeSummary;
    summaryMedium?: MediumEpisodeSummary;
};

// Playlist item used internally (extended episode with additional fields)
export type PlaylistItem = Episode & {
    name?: string;
    commercial?: boolean;
    archivalUrl?: Url;
    length?: Seconds;
};

// Show data from API
export type Show = {
    id: ShowId;
    index: number;
    name: ShowName;
    shortName: string;
    descriptiveId: string;
    channelCode: ChannelCode;
    isCommercial: boolean;
    channels?: ChannelName[];
};

// API Response: /api/shows
export type ApiShowsResponse = Show[];

// API Response: /api/channels
export type ApiChannelsResponse = ChannelName[];

// API Response: /api/channel/:channel
export type ApiChannelScheduleResponse = {
    list: PlaylistItem[];
    initialOffset: Seconds;
};

// API Response: /api/channel/generate/:nums
export type ApiChannelCodeGenerateResponse = ChannelCode;

// API Response: /api/playing-now
export type ApiPlayingNowResponse = {
    [key: string]: {
        list: PlaylistItem[];
        initialOffset: Seconds;
    };
};

// Frontend channel representation
export type Channel = {
    id: ChannelId;
    name: string;
    userChannel: boolean;
};

// Station builder show representation
export type StationBuilderShow = {
    id: ShowId;
    name: ShowName;
    selected: boolean;
    channels?: ChannelName[];
    elements?: HTMLButtonElement[];
};

// Station builder model
export type StationBuilderModel = {
    shows: StationBuilderShow[];
    savedChannelCodes: ChannelCode[];
    commercialShowIds: ShowId[];
    includeCommercials: boolean;
};

// Event data types
export type EventData = {
    text?: string;
    isTemp?: boolean;
};

// Event source interface
export type EventHandler = (event: Event & { data?: unknown }) => void;

export type EventSubscription = {
    then(handler: EventHandler): void;
    ifState(...states: string[]): { then(handler: EventHandler): void };
};

export type EventSource = {
    trigger(eventName: string, eventData?: unknown): void;
    on(eventName: string): EventSubscription;
};

// State machine interface
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

// Clock interface
export type Clock = {
    nowSeconds(): number;
    nowMillis(): number;
};

// Audio data source interface
export type AudioDataSource = {
    get(): number[];
};

// Audio data source builder interface
export type AudioDataSourceBuilder = {
    withBucketCount(count: number): AudioDataSourceBuilder;
    withRedistribution(p: number): AudioDataSourceBuilder;
    withFiltering(threshold: number): AudioDataSourceBuilder;
    withShuffling(): AudioDataSourceBuilder;
    build(): AudioDataSource;
};

// Visualiser data factory interface
export type VisualiserDataFactory = {
    audioDataSource(): AudioDataSourceBuilder;
};

// Visualiser interface
export type Visualiser = {
    init(canvas: HTMLCanvasElement): void;
    getVisualiserIds(): string[];
    setVisualiserId(id: string): void;
    start(): void;
    stop(delayMillis?: number): void;
    onResize(): () => void;
};

// Audio player interface
export type AudioPlayer = {
    on: EventSource['on'];
    load(urls: string | string[]): void;
    play(offset?: number): void;
    stop(): void;
    getVolume(): number;
    setVolume(volume: number): void;
    getData(): Uint8Array;
};

// Message manager interface
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

// Summary manager interface
export type SummaryManager = {
    on: EventSource['on'];
    setText(summaryText: string): void;
    showAndThenHide(): void;
    show(): void;
    hide(): void;
    clear(): void;
    toggle(): void;
};

// Sleep timer interface
export type SleepTimer = {
    on: EventSource['on'];
    start(minutes: number): void;
    stop(): void;
    getMinutesRequested(): number | null;
};

// Sleep timer view interface
export type SleepTimerView = {
    init(): void;
    render(totalSeconds: number): void;
    setRunState(isRunning: boolean): void;
};

// Schedule view interface
export type ScheduleView = {
    addChannel(channel: Channel): void;
    setSelectedChannel(selectedChannelId: ChannelId | null): void;
    displaySchedule(schedule: ApiChannelScheduleResponse): void;
    hideSchedule(): void;
};

// Station builder view interface
export type StationBuilderView = {
    populate(stationBuilderModel: StationBuilderModel): void;
    updateShowSelections(stationBuilderModel: StationBuilderModel): void;
    updateIncludeCommercials(stationBuilderModel: StationBuilderModel): void;
    updateStationDetails(stationBuilderModel: StationBuilderModel): void;
    addAnotherChannel(): void;
};

// Playing now manager interface
export type PlayingNowManager = {
    start(details: ApiPlayingNowResponse): void;
    update(details: ApiPlayingNowResponse): void;
    stop(): void;
};

// Snow machine interface
export type SnowMachine = {
    start(intensity: number): void;
    stop(): void;
};

// Service interface
export type Service = {
    getChannels(): Promise<ApiChannelsResponse>;
    getShowList(): Promise<ApiShowsResponse>;
    getChannelCodeForShows(indexes: ShowId[]): Promise<ApiChannelCodeGenerateResponse>;
    getPlaylistForChannel(channelId: ChannelId, length?: number): Promise<ApiChannelScheduleResponse>;
    getPlayingNow(channelsList?: ChannelId[]): Promise<ApiPlayingNowResponse>;
};

// Model interface
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
    selectedChannelId: ChannelId | null;
    selectedScheduleChannelId: ChannelId | null;
    playlist: PlaylistItem[] | null;
    track: PlaylistItem | null;
    nextTrackOffset: Seconds | null;
};

// View interface
export type View = {
    on: EventSource['on'];
    setChannels(channels: Channel[]): void;
    setNoChannelSelected(): void;
    setChannelLoading(channelId: ChannelId): void;
    setChannelLoaded(channelId: ChannelId): void;
    openMenu(): void;
    closeMenu(): void;
    updateVolume(volume: number, minVolume: number, maxVolume: number): void;
    showMessage(message: string): void;
    startSleepTimer(): void;
    updateSleepTimer(seconds: number): void;
    clearSleepTimer(): void;
    sleep(): void;
    wakeUp(): void;
    updateScheduleChannelSelection(channelId?: ChannelId | null): void;
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
