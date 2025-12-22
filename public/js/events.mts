import type { StateMachine, EventSource, EventSubscription, EventHandler } from './types.mjs';

type CustomEvent = Event & { data?: unknown };

type Listener = {
    name: string;
    handler: EventHandler;
};

function getEventTarget(): EventTarget | { dispatchEvent(event: Event): void; addEventListener(name: string, handler: EventHandler): void } {
    try {
        return new EventTarget();
    } catch (err) {
        const listeners: Listener[] = [];
        return {
            dispatchEvent(event: Event) {
                listeners.filter(listener => listener.name === event.type).forEach(listener => {
                    listener.handler(event as CustomEvent);
                });
            },
            addEventListener(name: string, handler: EventHandler) {
                listeners.push({ name, handler });
            }
        };
    }
}

export function buildEventSource(name: string, stateMachine: StateMachine): EventSource {
    const eventTarget = getEventTarget();

    return {
        trigger(eventName: string, eventData?: unknown) {
            const event = new Event(eventName) as CustomEvent;
            event.data = eventData;
            eventTarget.dispatchEvent(event);
        },
        on(eventName: string): EventSubscription {
            return {
                then(handler: EventHandler) {
                    eventTarget.addEventListener(eventName, handler as EventListener);
                },
                ifState(...states: string[]) {
                    return {
                        then(handler: EventHandler) {
                            eventTarget.addEventListener(eventName, ((event: CustomEvent) => {
                                if (states.includes(stateMachine.state)) {
                                    handler(event);
                                }
                            }) as EventListener);
                        }
                    };
                }
            };
        }
    };
}

// Event constants
export const EVENT_CHANNEL_BUTTON_CLICK = 'channelButtonClick';
export const EVENT_AUDIO_ERROR = 'audioError';
export const EVENT_AUDIO_TRACK_LOADED = 'audioTrackLoaded';
export const EVENT_AUDIO_TRACK_ENDED = 'audioTrackEnded';
export const EVENT_AUDIO_PLAY_STARTED = 'audioPlaying';
export const EVENT_MENU_OPEN_CLICK = 'menuOpenClick';
export const EVENT_MENU_CLOSE_CLICK = 'menuCloseClick';
export const EVENT_VOLUME_UP_CLICK = 'volumeUpClick';
export const EVENT_VOLUME_DOWN_CLICK = 'volumeDownClick';
export const EVENT_PREF_INFO_MESSAGES_CLICK = 'prefInfoMessagesClick';
export const EVENT_PREF_NOW_PLAYING_CLICK = 'prefNowPlayingMessagesClick';
export const EVENT_PREF_SHOW_SUMMARY_CLICK = 'prefShowSummaryClick';
export const EVENT_NEW_MESSAGE = 'newMessage';
export const EVENT_MESSAGE_PRINTING_COMPLETE = 'messagePrintingComplete';
export const EVENT_SLEEP_TIMER_CLICK = 'sleepTimerClick';
export const EVENT_SLEEP_TIMER_TICK = 'sleepTimerTick';
export const EVENT_SLEEP_TIMER_DONE = 'sleepTimerDone';
export const EVENT_WAKE_UP = 'wakeUp';
export const EVENT_SCHEDULE_BUTTON_CLICK = 'scheduleButtonClick';
export const EVENT_STATION_BUILDER_SHOW_CLICK = 'stationBuilderShowClick';
export const EVENT_STATION_BUILDER_PLAY_COMMERCIALS_CLICK = 'stationBuilderPlayCommercialsClick';
export const EVENT_STATION_BUILDER_CREATE_CHANNEL_CLICK = 'stationBuilderCreateChannelClick';
export const EVENT_STATION_BUILDER_GO_TO_CHANNEL_CLICK = 'stationBuilderGoToChannelClick';
export const EVENT_STATION_BUILDER_ADD_CHANNEL_CLICK = 'stationBuilderAddChannelClick';
export const EVENT_STATION_BUILDER_DELETE_STATION_CLICK = 'stationBuilderDeleteStationClick';
export const EVENT_VISUALISER_BUTTON_CLICK = 'visualiserButtonClick';
export const EVENT_SHOW_SUMMARY = 'showSummary';
export const EVENT_HIDE_SUMMARY = 'hideSummary';
export const EVENT_CLEAR_SUMMARY = 'clearSummary';
export const SUMMARY_LINK_CLICK = 'summaryLinkClick';
