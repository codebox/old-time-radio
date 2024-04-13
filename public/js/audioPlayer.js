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

            audioCtx.onstatechange = () => {
                // needed to allow audio to continue to play on ios when screen is locked
                if (audioCtx.state === 'interrupted') {
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

    function loadUrl(url) {
        console.log('Loading url: ' + url);
        audio.src = url;
        audio.load();
    }

    let currentUrls;
    audio.addEventListener('error', event => {
        console.error(`Error loading audio from ${audio.src}: ${event}`);
        if (currentUrls.length > 0) {
            loadUrl(currentUrls.shift());
        } else {
            console.log('No more urls to try');
            eventSource.trigger(EVENT_AUDIO_ERROR, event)
        }
    });

    return {
        on: eventSource.on,
        load(urls) {
            initAudio();
            loadingTrack = true;
            currentUrls = Array.isArray(urls) ? urls : [urls];
            loadUrl(currentUrls.shift());
        },
        play(offset=0) {
            loadingTrack = false;
            audio.currentTime = offset;
            audio.play();
        },
        stop() {
            audio.pause();
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