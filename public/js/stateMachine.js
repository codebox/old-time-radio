function buildStateMachine() {
    "use strict";

    function buildState(name, event) {
        return Object.freeze({name, event});
    }

    const states = Object.freeze({
        START:          buildState('Start'),
        INITIALISING:   buildState('Initialising', EVENT_STATE_CHANGED_TO_INITIALISING),
        IDLE:           buildState('Idle', EVENT_STATE_CHANGED_TO_IDLE),
        TUNING_IN:      buildState('Tuning In', EVENT_STATE_CHANGED_TO_TUNING_IN),
        TUNED_IN_IDLE:  buildState('Tuned In Idle', EVENT_STATE_CHANGED_TO_TUNED_IN_IDLE),
        LOADING_TRACK:  buildState('Loading Track', EVENT_STATE_CHANGED_TO_LOADING_TRACK),
        PLAYING:        buildState('Playing', EVENT_STATE_CHANGED_TO_PLAYING),
        GOING_TO_SLEEP: buildState('Going to sleep', EVENT_STATE_CHANGED_TO_GOING_TO_SLEEP),
        SLEEPING:       buildState('Sleeping', EVENT_STATE_CHANGED_TO_SLEEPING),
        ERROR:          buildState('Error', EVENT_STATE_CHANGED_TO_ERROR)
    }), eventSource = buildEventSource('state');

    let state;
    function changeState(newState) {
        console.log('State changed to', newState.name);
        eventSource.trigger(newState.event, state = newState);
    }

    changeState(state = states.START);

    function ifStateIsOneOf(...validStates) {
        return {
            thenChangeTo(newState) {
                if (validStates.includes(state)) {
                    changeState(newState);
                } else {
                    console.warn(`Unexpected state transition requested: ${state} -> ${newState}`);
                }
            }
        }
    }

    return {
        states, //TODO don't expose this if not needed
        on: eventSource.on,
        initialise() {
            ifStateIsOneOf(states.START)
                .thenChangeTo(states.INITIALISING);
        },
        channelListSuccess() {
            ifStateIsOneOf(states.INITIALISING)
                .thenChangeTo(states.IDLE);
        },
        channelListFailure() {
            ifStateIsOneOf(states.INITIALISING)
                .thenChangeTo(states.ERROR);
        },
        userSelectsNewChannel() {
            ifStateIsOneOf(states.IDLE, states.TUNING_IN, states.PLAYING, states.TUNED_IN_IDLE, states.LOADING_TRACK)
                .thenChangeTo(states.TUNING_IN);
        },
        userDeselectsChannel() {
            ifStateIsOneOf(states.TUNING_IN, states.PLAYING, states.TUNED_IN_IDLE, states.LOADING_TRACK)
                .thenChangeTo(states.IDLE);
        },
        sleepTimerTriggers() {
            if (state === states.PLAYING) {
                changeState(states.GOING_TO_SLEEP);

            } else {
                ifStateIsOneOf(states.IDLE, states.TUNING_IN, states.TUNED_IN_IDLE, states.LOADING_TRACK, states.ERROR)
                    .thenChangeTo(states.SLEEPING);
            }
        },
        goingToSleepComplete() {
            ifStateIsOneOf(states.GOING_TO_SLEEP)
                .thenChangeTo(states.SLEEPING);
        },
        playlistSuccess() {
            ifStateIsOneOf(states.TUNING_IN)
                .thenChangeTo(states.TUNED_IN_IDLE);
        },
        playlistFailure() {
            ifStateIsOneOf(states.TUNING_IN)
                .thenChangeTo(states.ERROR);
        },
        trackRequested() {
            ifStateIsOneOf(states.TUNED_IN_IDLE)
                .thenChangeTo(states.LOADING_TRACK);
        },
        trackLoadSuccess() {
            ifStateIsOneOf(states.LOADING_TRACK)
                .thenChangeTo(states.PLAYING);
        },
        trackLoadFailure() {
            ifStateIsOneOf(states.LOADING_TRACK)
                .thenChangeTo(states.ERROR);
        },
        trackEnds() {
            ifStateIsOneOf(states.PLAYING)
                .thenChangeTo(states.TUNED_IN_IDLE);
        },
        wakeAction() {
            if (state === states.GOING_TO_SLEEP) { //TODO better way to write these
                changeState(states.PLAYING);
            } else {
                ifStateIsOneOf(states.SLEEPING)
                    .thenChangeTo(states.IDLE);
            }
        },
        isSleeping() {
            return [states.SLEEPING, states.GOING_TO_SLEEP].includes(state);
        },
        isIdle() {
            return state === states.IDLE;
        }
    };

}