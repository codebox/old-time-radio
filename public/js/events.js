function buildEventSource(name) {
    "use strict";
    const eventTarget = new EventTarget();

    return {
        trigger(eventName, eventData) {
            console.debug(`=== EVENT ${name + ' ' || ''}: ${eventName} ${JSON.stringify(eventData) || ''}`);
            const event = new Event(eventName);
            event.data = eventData;
            eventTarget.dispatchEvent(event);
        },
        on(eventName, handler) {
            eventTarget.addEventListener(eventName, handler);
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
    EVENT_NEW_MESSAGE = 'newMessage',
    EVENT_MESSAGE_PRINTING_COMPLETE = 'messagePrintingComplete',
    EVENT_SET_SLEEP_TIMER_CLICK = 'setSleepTimerClick',
    EVENT_CANCEL_SLEEP_TIMER_CLICK = 'cancelSleepTimerClick',
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
    EVENT_STATE_CHANGED_TO_INITIALISING = 'stateChangeInitialising',
    EVENT_STATE_CHANGED_TO_IDLE = 'stateChangeIdle',
    EVENT_STATE_CHANGED_TO_TUNING_IN = 'stateChangeTuningIn',
    EVENT_STATE_CHANGED_TO_TUNED_IN_IDLE = 'stateChangeTunedInIdle',
    EVENT_STATE_CHANGED_TO_LOADING_TRACK = 'stateChangeLoadingTrack',
    EVENT_STATE_CHANGED_TO_PLAYING = 'stateChangePlaying',
    EVENT_STATE_CHANGED_TO_GOING_TO_SLEEP = 'stateChangeGoingToSleep',
    EVENT_STATE_CHANGED_TO_SLEEPING = 'stateChangeSleeping',
    EVENT_STATE_CHANGED_TO_ERROR = 'stateChangeError';

