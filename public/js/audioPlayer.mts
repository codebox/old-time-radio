import { config } from './config.mjs';
import { EVENT_AUDIO_TRACK_LOADED, EVENT_AUDIO_PLAY_STARTED, EVENT_AUDIO_TRACK_ENDED, EVENT_AUDIO_ERROR } from './events.mjs';
import type { AudioPlayer, EventSource } from './types.mjs';

declare global {
    interface Window {
        webkitAudioContext: typeof AudioContext;
    }
}

export function buildAudioPlayer(maxVolume: number, eventSource: EventSource): AudioPlayer {
    const audio = new Audio(),
        SMOOTHING = config.audio.smoothing,
        FFT_WINDOW_SIZE = config.audio.fftWindowSize,
        BUFFER_LENGTH = FFT_WINDOW_SIZE / 2;

    let analyser: AnalyserNode | undefined;
    let audioInitialised = false;
    let audioGain: GainNode | undefined;
    let loadingTrack = false;
    let initialAudioGainValue: number | undefined;

    function initAudio() {
        if (!audioInitialised) {
            audio.crossOrigin = "anonymous";
            const AudioContextClass = window.AudioContext || window.webkitAudioContext,
                audioCtx = new AudioContextClass(),
                audioSrc = audioCtx.createMediaElementSource(audio);
            audioGain = audioCtx.createGain();
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = FFT_WINDOW_SIZE;
            analyser.smoothingTimeConstant = SMOOTHING;

            // need this if volume is set before audio is initialised
            if (initialAudioGainValue !== undefined) {
                audioGain.gain.value = initialAudioGainValue;
            }

            audioCtx.onstatechange = () => {
                // 'interrupted' is a Safari-specific state not in the standard AudioContextState type
                if ((audioCtx.state as string) === 'interrupted') {
                    audioCtx.resume();
                }
            };

            audioSrc.connect(audioGain);
            audioGain.connect(analyser);
            analyser.connect(audioCtx.destination);
            audioInitialised = true;
        }
    }

    /* 'Volume' describes the user-value (0-10) which is saved in browser storage and indicated by the UI
    volume control. 'Gain' describes the internal value used by the WebAudio API (0-1). */
    function convertVolumeToGain(volume: number): number {
        return Math.pow(volume / maxVolume, 2);
    }
    function convertGainToVolume(gain: number): number {
        return maxVolume * Math.sqrt(gain);
    }

    audio.addEventListener('canplaythrough', () => {
        if (loadingTrack) {
            eventSource.trigger(EVENT_AUDIO_TRACK_LOADED);
        }
    });
    audio.addEventListener('playing', () => {
        eventSource.trigger(EVENT_AUDIO_PLAY_STARTED);
    });
    audio.addEventListener('ended', () => eventSource.trigger(EVENT_AUDIO_TRACK_ENDED));

    function loadUrl(url: string) {
        console.log('Loading url: ' + url);
        audio.src = url;
        audio.load();
    }

    let currentUrls: string[] = [];
    audio.addEventListener('error', event => {
        console.error(`Error loading audio from ${audio.src}: ${event}`);
        if (currentUrls.length > 0) {
            loadUrl(currentUrls.shift()!);
        } else {
            console.log('No more urls to try');
            eventSource.trigger(EVENT_AUDIO_ERROR, event);
        }
    });

    return {
        on: eventSource.on,
        load(urls: string | string[]) {
            initAudio();
            loadingTrack = true;
            currentUrls = Array.isArray(urls) ? urls : [urls];
            loadUrl(currentUrls.shift()!);
        },
        play(offset = 0) {
            loadingTrack = false;
            audio.currentTime = offset;
            audio.play();
        },
        stop() {
            audio.pause();
        },
        getVolume(): number {
            const gainValue = audioGain ? audioGain.gain.value : initialAudioGainValue;
            return convertGainToVolume(gainValue ?? 1);
        },
        setVolume(volume: number) {
            const gainValue = convertVolumeToGain(volume);
            if (audioGain) {
                audioGain.gain.value = gainValue;
            } else {
                initialAudioGainValue = gainValue;
            }
        },
        getData(): Uint8Array {
            const dataArray = new Uint8Array(BUFFER_LENGTH);
            if (analyser) {
                analyser.getByteFrequencyData(dataArray);
            }
            return dataArray;
        }
    };
}
