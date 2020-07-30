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
            if (window.AudioContext) {
                // webkitAudioContext doesn't work
                const audioCtx = new window.AudioContext(),
                    audioSrc = audioCtx.createMediaElementSource(audio);
                analyser = audioCtx.createAnalyser();
                analyser.fftSize = FFT_WINDOW_SIZE;
                analyser.smoothingTimeConstant = SMOOTHING;

                audioSrc.connect(analyser);
                analyser.connect(audioCtx.destination);
            }
            audioInitialised = true;
        }
    }
    return {
        load(url, offset = 0) {
            return new Promise((onLoaded, onError) => {
                function removeHandlers() {
                    audio.removeEventListener('canplay', onAudioLoaded);
                    audio.removeEventListener('err', onAudioLoaded);
                }

                function onAudioLoaded() {
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
                audio.currentTime = offset;
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
            initAudio();
            if (analyser) {
                const dataArray = new Uint8Array(BUFFER_LENGTH);
                analyser.getByteFrequencyData(dataArray);
                return dataArray;
            } else {
                return [];
            }
        }
    };
})();
