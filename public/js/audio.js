const audioPlayer = (() => {
    "use strict";
    const audio = new Audio(),
        SMOOTHING = 0.8,
        FFT_WINDOW_SIZE = 1024,
        BUFFER_LENGTH = FFT_WINDOW_SIZE / 2;

    let onAudioEndedHandler = () => {},
        analyser, audioInitialised;

    function initAudio() {
        if (!audioInitialised) {
            audio.crossOrigin = "anonymous";
            const AudioContext = window.AudioContext || window.webkitAudioContext,
                audioCtx = new AudioContext(),
                audioSrc = audioCtx.createMediaElementSource(audio);
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = FFT_WINDOW_SIZE;
            analyser.smoothingTimeConstant = SMOOTHING;

            audioSrc.connect(analyser);
            analyser.connect(audioCtx.destination);
            audioInitialised = true;
        }
    }

    return {
        load(url, offset = 0) {
            return new Promise((onLoaded, onError) => {
                function removeHandlers() {
                    audio.removeEventListener('canplay', onAudioLoaded);
                    audio.removeEventListener('error', onAudioLoaded);
                }

                function onAudioLoaded() {
                    audio.currentTime = offset;
                    removeHandlers();
                    onLoaded();
                }
                function onAudioError() {
                    removeHandlers();
                    onError();
                }
                audio.addEventListener('canplay', onAudioLoaded);
                audio.addEventListener('error', onAudioError);

                initAudio();
                audio.src = url;
                audio.load();
            });
        },
        onAudioEnded(handler) {
            audio.removeEventListener('ended', onAudioEndedHandler);
            audio.addEventListener('ended', onAudioEndedHandler = handler);
        },
        play() {
            audio.play();
        },
        stop() {
            audio.pause();
        },
        getData() {
            const dataArray = new Uint8Array(BUFFER_LENGTH);
            analyser.getByteFrequencyData(dataArray);
            return dataArray;
        }
    };
})();
