import { config } from './config.mjs';
import {
    EVENT_CHANNEL_BUTTON_CLICK,
    EVENT_MENU_OPEN_CLICK,
    EVENT_MENU_CLOSE_CLICK,
    EVENT_VOLUME_UP_CLICK,
    EVENT_VOLUME_DOWN_CLICK,
    EVENT_PREF_INFO_MESSAGES_CLICK,
    EVENT_PREF_NOW_PLAYING_CLICK,
    EVENT_PREF_SHOW_SUMMARY_CLICK,
    EVENT_MESSAGE_PRINTING_COMPLETE,
    EVENT_WAKE_UP,
    EVENT_VISUALISER_BUTTON_CLICK,
    SUMMARY_LINK_CLICK
} from './events.mjs';
import { buildSleepTimerView } from './viewSleepTimer.mjs';
import { buildScheduleView } from './viewSchedule.mjs';
import { buildStationBuilderView } from './viewStationBuilder.mjs';
import { buildPlayingNowManager } from './playingNowManager.mjs';
import { buildSnowMachine } from './snowMachine.mjs';
import type { View, EventSource, Model, Channel, ChannelId, Visualiser, ApiChannelScheduleResponse, ApiPlayingNowResponse, StationBuilderModel, Url } from './types.mjs';

export function buildView(eventSource: EventSource, model: Model): View {
    const FEW_CHANNELS_LIMIT = 4,
        channelButtons: Record<string, HTMLDivElement> = {},
        visualiserButtons: Record<string, HTMLButtonElement> = {},

        CLASS_LOADING = 'channelLoading',
        CLASS_PLAYING = 'channelPlaying',
        CLASS_ERROR = 'channelError',
        CLASS_SELECTED = 'selected',

        elMenuOpenIcon = document.getElementById('menuOpenIcon')!,
        elMenuCloseIcon = document.getElementById('menuCloseIcon')!,
        elMenuButton = document.getElementById('menuButton')! as HTMLButtonElement,
        elMenuBox = document.getElementById('menu')! as HTMLDivElement,
        elVolumeUp = document.getElementById('volumeUp')!,
        elVolumeDown = document.getElementById('volumeDown')!,
        elPrefInfoMessages = document.getElementById('prefInfoMessages')!,
        elPrefNowPlayingMessages = document.getElementById('prefNowPlayingMessages')!,
        elPrefShowSummary = document.getElementById('prefShowSummary')!,
        elMessage = document.getElementById('message')!,
        elDownloadLink = document.getElementById('downloadLink')!,
        elButtonContainer = document.getElementById('buttons')!,
        elVolumeLeds = Array.from(Array(10).keys()).map(i => document.getElementById(`vol${i + 1}`)!),
        elVisualiserCanvas = document.getElementById('visualiserCanvas')! as HTMLCanvasElement,
        elPlayingNowCanvas = document.getElementById('playingNowCanvas')! as HTMLCanvasElement,
        elVisualiserButtons = document.getElementById('visualiserList')!,
        elTitle = document.getElementsByTagName('title')[0],
        elSummary = document.getElementById('episodeSummary')! as HTMLDivElement,
        elSummaryContent = document.getElementById('episodeSummaryContent')!,
        elSummaryLink = document.getElementById('summaryLink')!,

        sleepTimerView = buildSleepTimerView(eventSource),
        scheduleView = buildScheduleView(eventSource),
        stationBuilderView = buildStationBuilderView(eventSource);

    function forEachChannelButton(fn: (channelId: string, el: HTMLDivElement) => void) {
        Object.keys(channelButtons).forEach(channelId => {
            fn(channelId, channelButtons[channelId]);
        });
    }

    function buildChannelButton(channel: Channel) {
        const channelId = channel.id as string,
            channelName = channel.name,
            elButtonBox = document.createElement('div');
        elButtonBox.classList.add('buttonBox');

        const elButtonIndicator = document.createElement('div'),
            elButton = document.createElement('button'),
            elButtonLabel = document.createElement('label');

        elButtonIndicator.classList.add('buttonIndicator');

        elButton.classList.add('raisedButton');
        elButton.setAttribute('role', 'radio');
        elButton.id = (channelName + '_channel').toLowerCase().replaceAll(' ', '_');
        elButtonLabel.classList.add('buttonLabel');
        elButtonLabel.innerText = channelName;
        elButtonLabel.setAttribute('for', elButton.id);

        elButton.onclick = () => {
            eventSource.trigger(EVENT_CHANNEL_BUTTON_CLICK, channelId);
        };
        elButtonBox.appendChild(elButtonIndicator);
        elButtonBox.appendChild(elButton);
        elButtonBox.appendChild(elButtonLabel);

        elButtonContainer.appendChild(elButtonBox);
        channelButtons[channelId] = elButtonBox;
    }

    function buildVisualiserButton(id: string) {
        const button = document.createElement('button');
        button.innerHTML = id;
        button.classList.add('menuButton');
        button.setAttribute('data-umami-event', `visualiser-${id.toLowerCase()}`);
        button.setAttribute('role', 'radio');
        button.onclick = () => {
            eventSource.trigger(EVENT_VISUALISER_BUTTON_CLICK, id);
        };
        elVisualiserButtons.appendChild(button);
        visualiserButtons[id] = button;
    }

    const messagePrinter = (() => {
        const PRINT_INTERVAL = config.messages.charPrintIntervalMillis;
        let interval: ReturnType<typeof setInterval> | null = null;

        function stopPrinting() {
            if (interval) {
                clearInterval(interval);
                interval = null;
            }
        }

        return {
            print(msg: string) {
                if (interval) {
                    stopPrinting();
                }
                const msgLen = msg.length;
                let i = 1;
                interval = setInterval(() => {
                    elMessage.innerText = (msg.substr(0, i) + (i < msgLen ? '\u2588' : '')).padEnd(msgLen, ' ');
                    const messageComplete = i === msgLen;
                    if (messageComplete) {
                        stopPrinting();
                        eventSource.trigger(EVENT_MESSAGE_PRINTING_COMPLETE);
                    } else {
                        i += 1;
                    }

                }, PRINT_INTERVAL);
            }
        };
    })();

    const playingNowPrinter = buildPlayingNowManager(model, elPlayingNowCanvas);

    function triggerWake() {
        eventSource.trigger(EVENT_WAKE_UP);
    }

    let menuOpen = false;
    elMenuButton.onclick = () => {
        eventSource.trigger(menuOpen ? EVENT_MENU_CLOSE_CLICK : EVENT_MENU_OPEN_CLICK);
    };

    elMenuBox.ontransitionend = () => {
        if (!menuOpen) {
            elMenuBox.style.visibility = 'hidden';
        }
    };
    elMenuBox.style.visibility = 'hidden';

    elVolumeUp.onclick = () => {
        eventSource.trigger(EVENT_VOLUME_UP_CLICK);
    };
    elVolumeDown.onclick = () => {
        eventSource.trigger(EVENT_VOLUME_DOWN_CLICK);
    };

    elPrefInfoMessages.onclick = () => {
        eventSource.trigger(EVENT_PREF_INFO_MESSAGES_CLICK);
    };

    elPrefNowPlayingMessages.onclick = () => {
        eventSource.trigger(EVENT_PREF_NOW_PLAYING_CLICK);
    };

    elPrefShowSummary.onclick = () => {
        eventSource.trigger(EVENT_PREF_SHOW_SUMMARY_CLICK);
    };

    elSummaryLink.onclick = () => {
        eventSource.trigger(SUMMARY_LINK_CLICK);
    };

    elSummary.addEventListener('transitionend', () => {
        if (elSummary.classList.contains('visible')) {
            elSummary.style.display = 'grid';
        } else {
            elSummary.style.display = 'none';
        }
    });

    sleepTimerView.init();

    const snowMachine = buildSnowMachine(elVisualiserCanvas);

    return {
        on: eventSource.on,

        setChannels(channels: Channel[]) {
            channels.forEach(channel => {
                buildChannelButton(channel);
                scheduleView.addChannel(channel);
            });

            if (channels.length <= FEW_CHANNELS_LIMIT) {
                elButtonContainer.classList.add('fewerChannels');
            }

            elButtonContainer.scroll({ left: 1000 });
            elButtonContainer.scroll({ behavior: 'smooth', left: 0 });
        },

        setNoChannelSelected() {
            forEachChannelButton((id, el) => {
                el.classList.remove(CLASS_LOADING, CLASS_PLAYING, CLASS_ERROR);
                (el.querySelector('button') as HTMLButtonElement).ariaChecked = 'false';
            });
        },

        setChannelLoading(channelId: ChannelId) {
            forEachChannelButton((id, el) => {
                el.classList.remove(CLASS_PLAYING, CLASS_ERROR);
                el.classList.toggle(CLASS_LOADING, id === channelId);
                (el.querySelector('button') as HTMLButtonElement).ariaChecked = 'false';
            });
        },

        setChannelLoaded(channelId: ChannelId) {
            forEachChannelButton((id, el) => {
                el.classList.remove(CLASS_LOADING, CLASS_ERROR);
                el.classList.toggle(CLASS_PLAYING, id === channelId);
                (el.querySelector('button') as HTMLButtonElement).ariaChecked = String(id === channelId);
            });
        },

        openMenu() {
            menuOpen = true;
            elMenuBox.style.visibility = 'visible';
            elMenuBox.classList.add('visible');
            elMenuOpenIcon.style.display = 'none';
            elMenuCloseIcon.style.display = 'inline';
            elMenuButton.ariaExpanded = "true";
        },
        closeMenu() {
            menuOpen = false;
            elMenuBox.classList.remove('visible');
            elMenuOpenIcon.style.display = 'inline';
            elMenuCloseIcon.style.display = 'none';
            elMenuButton.ariaExpanded = "false";
        },

        updateVolume(volume: number, minVolume: number, maxVolume: number) {
            elVolumeLeds.forEach((el, i) => el.classList.toggle('on', (i + 1) <= volume));
            elVolumeDown.classList.toggle('disabled', volume === minVolume);
            elVolumeUp.classList.toggle('disabled', volume === maxVolume);
        },

        showMessage(message: string) {
            messagePrinter.print(message);
        },

        startSleepTimer() {
            sleepTimerView.setRunState(true);
        },
        updateSleepTimer(seconds: number) {
            sleepTimerView.render(seconds);
        },
        clearSleepTimer() {
            sleepTimerView.setRunState(false);
        },
        sleep() {
            this.closeMenu();
            sleepTimerView.setRunState(false);
            document.body.classList.add('sleeping');
            document.body.addEventListener('mousemove', triggerWake);
            document.body.addEventListener('touchstart', triggerWake);
            document.body.addEventListener('keydown', triggerWake);
        },
        wakeUp() {
            document.body.classList.remove('sleeping');
            document.body.removeEventListener('mousemove', triggerWake);
            document.body.removeEventListener('touchstart', triggerWake);
            document.body.removeEventListener('keydown', triggerWake);
        },

        updateScheduleChannelSelection(channelId?: ChannelId | null) {
            scheduleView.setSelectedChannel(channelId ?? null);
        },
        displaySchedule(schedule: ApiChannelScheduleResponse) {
            scheduleView.displaySchedule(schedule);
        },
        hideSchedule() {
            scheduleView.hideSchedule();
        },

        populateStationBuilderShows(stationBuilderModel: StationBuilderModel) {
            stationBuilderView.populate(stationBuilderModel);
        },
        updateStationBuilderShowSelections(stationBuilderModel: StationBuilderModel) {
            stationBuilderView.updateShowSelections(stationBuilderModel);
        },
        updateStationBuilderIncludeCommercials(stationBuilderModel: StationBuilderModel) {
            stationBuilderView.updateIncludeCommercials(stationBuilderModel);
        },
        updateStationBuilderStationDetails(stationBuilderModel: StationBuilderModel) {
            stationBuilderView.updateStationDetails(stationBuilderModel);
        },
        addAnotherStationBuilderChannel() {
            stationBuilderView.addAnotherChannel();
        },
        setVisualiser(audioVisualiser: Visualiser) {
            audioVisualiser.init(elVisualiserCanvas);
        },
        showPlayingNowDetails(playingNowDetails: ApiPlayingNowResponse) {
            elPlayingNowCanvas.style.display = 'block';
            playingNowPrinter.start(playingNowDetails);
        },
        updatePlayingNowDetails(playingNowDetails: ApiPlayingNowResponse) {
            playingNowPrinter.update(playingNowDetails);
        },
        hidePlayingNowDetails() {
            elPlayingNowCanvas.style.display = 'none';
            playingNowPrinter.stop();
        },
        showDownloadLink(mp3Url: Url) {
            elDownloadLink.innerHTML = `<a href="${mp3Url}" target="_blank">Download this show as an MP3 file</a>`;
        },
        hideDownloadLink() {
            elDownloadLink.innerHTML = '';
        },
        showEpisodeSummary(summary: string) {
            elSummaryContent.innerHTML = summary;
            elSummaryLink.classList.add('selected');
            elSummary.style.display = 'grid';
            elSummary.offsetHeight; // force reflow
            elSummary.classList.add('visible');
        },
        hideEpisodeSummary() {
            elSummary.classList.remove('visible');
            elSummaryLink.classList.remove('selected');
        },
        showSummaryLink() {
            (elSummaryLink as HTMLElement).style.display = 'flex';
        },
        hideSummaryLink() {
            (elSummaryLink as HTMLElement).style.display = 'none';
        },
        showError(errorMsg: unknown) {
            forEachChannelButton((id, el) => {
                el.classList.remove(CLASS_PLAYING, CLASS_ERROR);
                el.classList.toggle(CLASS_LOADING, true);
            });
        },
        setVisualiserIds(visualiserIds: string[]) {
            visualiserIds.forEach(visualiserId => {
                buildVisualiserButton(visualiserId);
            });
        },
        updateVisualiserId(selectedVisualiserId: string) {
            Object.keys(visualiserButtons).forEach(visualiserId => {
                const el = visualiserButtons[visualiserId];
                el.classList.toggle(CLASS_SELECTED, selectedVisualiserId === visualiserId);
                el.ariaChecked = String(selectedVisualiserId === visualiserId);
                el.setAttribute('aria-controls', 'canvas');
            });
        },
        updatePrefInfoMessages(showInfoMessages: boolean) {
            elPrefInfoMessages.classList.toggle(CLASS_SELECTED, showInfoMessages);
            elPrefInfoMessages.innerHTML = showInfoMessages ? 'On' : 'Off';
        },
        updatePrefNowPlayingMessages(showNowPlayingMessages: boolean) {
            elPrefNowPlayingMessages.classList.toggle(CLASS_SELECTED, showNowPlayingMessages);
            elPrefNowPlayingMessages.innerHTML = showNowPlayingMessages ? 'On' : 'Off';
        },
        updatePrefShowSummaryWhenTuningIn(showSummaryWhenTuningIn: boolean) {
            elPrefShowSummary.classList.toggle(CLASS_SELECTED, showSummaryWhenTuningIn);
            elPrefShowSummary.innerHTML = showSummaryWhenTuningIn ? 'On' : 'Off';
        },
        addShowTitleToPage(title: string) {
            elTitle.innerHTML += (' - ' + title);
        },
        startSnowMachine(intensity: number) {
            snowMachine.start(intensity);
        },
        stopSnowMachine() {
            snowMachine.stop();
        }
    };
}
