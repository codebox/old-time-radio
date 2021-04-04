const STATE_START = 'Start',
    STATE_INITIALISING = 'Initialising',
    STATE_IDLE = 'Idle',
    STATE_TUNING_IN = 'Tuning In',
    STATE_LOADING_TRACK = 'Loading Track',
    STATE_PLAYING = 'Playing',
    STATE_GOING_TO_SLEEP = 'Going to sleep',
    STATE_SLEEPING = 'Sleeping',
    STATE_ERROR = 'Error';

function buildStateMachine() {
    "use strict";

    let state = STATE_START;

    function ifStateIsOneOf(...validStates) {
        return {
            thenChangeTo(newState) {
                if (validStates.includes(state)) {
                    console.log('State changed to', newState);
                    state = newState;
                } else {
                    console.warn(`Unexpected state transition requested: ${state} -> ${newState}`);
                }
            }
        }
    }

    return {
        get state() {
            return state;  
        },
        initialising() {
            ifStateIsOneOf(STATE_START)
                .thenChangeTo(STATE_INITIALISING);
        },
        idle() {
            ifStateIsOneOf(STATE_INITIALISING, STATE_TUNING_IN, STATE_PLAYING, STATE_LOADING_TRACK, STATE_SLEEPING)
                .thenChangeTo(STATE_IDLE);
        },
        error() {
            ifStateIsOneOf(STATE_INITIALISING, STATE_TUNING_IN, STATE_LOADING_TRACK)
                .thenChangeTo(STATE_ERROR);
        },
        tuningIn() {
            ifStateIsOneOf(STATE_IDLE, STATE_TUNING_IN, STATE_PLAYING, STATE_LOADING_TRACK, STATE_ERROR)
                .thenChangeTo(STATE_TUNING_IN);
        },
        goingToSleep() {
            ifStateIsOneOf(STATE_PLAYING)
                .thenChangeTo(STATE_GOING_TO_SLEEP);
        },
        sleeping() {
            ifStateIsOneOf(STATE_IDLE, STATE_TUNING_IN, STATE_LOADING_TRACK, STATE_ERROR, STATE_GOING_TO_SLEEP)
                .thenChangeTo(STATE_SLEEPING);
        },
        loadingTrack() {
            ifStateIsOneOf(STATE_TUNING_IN, STATE_PLAYING, STATE_ERROR)
                .thenChangeTo(STATE_LOADING_TRACK);
        },
        playing() {
            ifStateIsOneOf(STATE_LOADING_TRACK, STATE_GOING_TO_SLEEP)
                .thenChangeTo(STATE_PLAYING);
        }
    };

}