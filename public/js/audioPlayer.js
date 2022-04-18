function buildAudioPlayer(maxVolume, eventSource) {
    "use strict";
    const audio = new Audio(),
        SMOOTHING = config.audio.smoothing,
        FFT_WINDOW_SIZE = config.audio.fftWindowSize,
        BUFFER_LENGTH = FFT_WINDOW_SIZE / 2;

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

    /* 'Volume' describes the user-value (0-10) which is saved in browser storage and indicated by the UI
    volume control. 'Gain' describes the internal value used by the WebAudio API (0-1). */
    function convertVolumeToGain(volume) {
        return Math.pow(volume / maxVolume, 2);
    }
    function convertGainToVolume(gain) {
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
    audio.addEventListener('ended', () => eventSource.trigger(EVENT_AUDIO_TRACK_ENDED, event));
    audio.addEventListener('error', () => eventSource.trigger(EVENT_AUDIO_ERROR, event));

    audio.addEventListener('pause', () => {
        /* This can be triggered by unplugging headphones when audio is playing causing the browser to halt playback.
        * We need to know when this happens so we can keep the UI in the correct state. */
        eventSource.trigger(EVENT_AUDIO_PLAY_STOPPED);
    });

    return {
        on: eventSource.on,
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
            audio.src = null;
        },
        getVolume() {
            const gainValue = audioGain ? audioGain.gain.value : initialAudioGainValue;
            return convertGainToVolume(gainValue);
        },
        setVolume(volume) {
            const gainValue = convertVolumeToGain(volume);
            if (audioGain) {
                audioGain.gain.value = gainValue;
            } else {
                initialAudioGainValue = gainValue;
            }
        },
        getData() {
            const dataArray = new Uint8Array(BUFFER_LENGTH);
            if (analyser) {
                analyser.getByteFrequencyData(dataArray);
            }
            return dataArray;
        }
    };
}