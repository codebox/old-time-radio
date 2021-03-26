function buildAudioPlayer(maxVolume) {
    "use strict";
    const audio = new Audio(),
        SMOOTHING = 0.8,
        FFT_WINDOW_SIZE = 1024,
        BUFFER_LENGTH = FFT_WINDOW_SIZE / 2,
        eventTarget = new EventTarget();

    let analyser, audioInitialised, audioGain, loadingTrack, initialAudioGainValue;

    function initAudio() {
        if (!audioInitialised) {
            audio.crossOrigin = "anonymous";
            const AudioContext = window.AudioContext || window.webkitAudioContext,
                audioCtx = new AudioContext(),
                audioSrc = audioCtx.createMediaElementSource(audio);
            audioGain = audioCtx.createGain();
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = FFT_WINDOW_SIZE;
            analyser.smoothingTimeConstant = SMOOTHING;

            // need this if volume is set before audio is initialised
            if (initialAudioGainValue) {
                audioGain.gain.value = initialAudioGainValue;
            }

            audioSrc.connect(audioGain);
            audioGain.connect(analyser);
            analyser.connect(audioCtx.destination);
            audioInitialised = true;
        }
    }

    function trigger(eventName, eventData) {
        console.log('EVENT audio' + eventName);
        const event = new Event(eventName);
        event.data = eventData;
        eventTarget.dispatchEvent(event);
    }

    audio.addEventListener('canplaythrough', () => {
        if (loadingTrack) {
            trigger(EVENT_AUDIO_TRACK_LOADED);
        }
    });
    audio.addEventListener('ended', () => trigger(EVENT_AUDIO_TRACK_ENDED, event));
    audio.addEventListener('error', () => trigger(EVENT_AUDIO_ERROR, event));

    return {
        on(eventName, handler) {
            eventTarget.addEventListener(eventName, handler);
        },
        load(url) {
            initAudio();
            loadingTrack = true;
            audio.src = url;
            audio.load();
        },
        play(offset=0) {
            loadingTrack = false;
            audio.currentTime = offset;
            audio.play();
        },
        stop() {
            audio.pause();
        },
        setVolume(volume) {
            const gainValue = Math.pow(volume / maxVolume, 2);
            if (audioGain) {
                audioGain.gain.value = gainValue;
            } else {
                initialAudioGainValue = gainValue;
            }
        }
    };
}