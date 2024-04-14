function getEventTarget() {
    "use strict";
    try {
        return new EventTarget();
    } catch(err) {
        const listeners = [];
        return {
            dispatchEvent(event) {
                listeners.filter(listener => listener.name === event.type).forEach(listener => {
                    listener.handler(event);
                });
            },
            addEventListener(name, handler) {
                listeners.push({name, handler});
            }
        };
    }
}

function buildEventSource(name, stateMachine) {
    "use strict";
    const eventTarget = getEventTarget();

    return {
        trigger(eventName, eventData) {
            //console.debug(`=== EVENT ${name + ' ' || ''}: ${eventName} ${JSON.stringify(eventData) || ''}`);
            const event = new Event(eventName);
            event.data = eventData;
            eventTarget.dispatchEvent(event);
        },
        on(eventName) {
            return {
                then(handler) {
                    eventTarget.addEventListener(eventName, handler);
                },
                ifState(...states) {
                    return {
                        then(handler) {
                            eventTarget.addEventListener(eventName, event => {
                                if (states.includes(stateMachine.state)) {
                                    handler(event);
                                }
                            });
                        }
                    };
                }
            };

        }
    };
}

const EVENT_CHANNEL_BUTTON_CLICK = 'channelButtonClick',
    EVENT_AUDIO_ERROR = 'audioError',
    EVENT_AUDIO_TRACK_LOADED = 'audioTrackLoaded',
    EVENT_AUDIO_TRACK_ENDED = 'audioTrackEnded',
    EVENT_AUDIO_PLAY_STARTED = 'audioPlaying',
    EVENT_MENU_OPEN_CLICK = 'menuOpenClick',
    EVENT_MENU_CLOSE_CLICK = 'menuCloseClick',
    EVENT_VOLUME_UP_CLICK = 'volumeUpClick',
    EVENT_VOLUME_DOWN_CLICK = 'volumeDownClick',
    EVENT_PREF_INFO_MESSAGES_CLICK = 'prefInfoMessagesClick',
    EVENT_PREF_NOW_PLAYING_CLICK = 'prefNowPlayingMessagesClick',
    EVENT_NEW_MESSAGE = 'newMessage',
    EVENT_MESSAGE_PRINTING_COMPLETE = 'messagePrintingComplete',
    EVENT_SLEEP_TIMER_CLICK = 'sleepTimerClick',
    EVENT_SLEEP_TIMER_TICK = 'sleepTimerTick',
    EVENT_SLEEP_TIMER_DONE = 'sleepTimerDone',
    EVENT_WAKE_UP = 'wakeUp',
    EVENT_SCHEDULE_BUTTON_CLICK = 'scheduleButtonClick',
    EVENT_STATION_BUILDER_SHOW_CLICK = 'stationBuilderShowClick',
    EVENT_STATION_BUILDER_PLAY_COMMERCIALS_CLICK = 'stationBuilderPlayCommercialsClick',
    EVENT_STATION_BUILDER_CREATE_CHANNEL_CLICK  = 'stationBuilderCreateChannelClick',
    EVENT_STATION_BUILDER_GO_TO_CHANNEL_CLICK  = 'stationBuilderGoToChannelClick',
    EVENT_STATION_BUILDER_ADD_CHANNEL_CLICK = 'stationBuilderAddChannelClick',
    EVENT_STATION_BUILDER_DELETE_STATION_CLICK = 'stationBuilderDeleteStationClick',
    EVENT_VISUALISER_BUTTON_CLICK = 'visualiserButtonClick';
