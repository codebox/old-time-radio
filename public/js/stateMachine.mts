import type { StateMachine } from './types.mjs';

export const STATE_START = 'Start';
export const STATE_INITIALISING = 'Initialising';
export const STATE_IDLE = 'Idle';
export const STATE_TUNING_IN = 'Tuning In';
export const STATE_LOADING_TRACK = 'Loading Track';
export const STATE_PLAYING = 'Playing';
export const STATE_GOING_TO_SLEEP = 'Going to sleep';
export const STATE_SLEEPING = 'Sleeping';
export const STATE_ERROR = 'Error';

export function buildStateMachine(): StateMachine {
    let state = STATE_START;

    function ifStateIsOneOf(...validStates: string[]) {
        return {
            thenChangeTo(newState: string) {
                if (validStates.includes(state)) {
                    console.log('State changed to', newState);
                    state = newState;
                } else {
                    console.warn(`Unexpected state transition requested: ${state} -> ${newState}`);
                }
            }
        };
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
