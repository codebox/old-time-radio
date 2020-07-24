const audioPlayer = (() => {
    "use strict";
    const audio = new Audio(),
        VOLUME_NORMAL = 1,
        VOLUME_MUTED = 0,
        SMOOTHING = 0.8,
        FFT_WINDOW_SIZE = 1024,
        BUFFER_LENGTH = FFT_WINDOW_SIZE / 2;

    let onAudioEndedHandler = () => {},
        analyser;


    return {
        init() {
            audio.crossOrigin = "anonymous";

            const audioCtx = new (window.AudioContext || window.webkitAudioContext)(),
                audioSrc = audioCtx.createMediaElementSource(audio);

            analyser = audioCtx.createAnalyser();
            analyser.fftSize = FFT_WINDOW_SIZE;
            analyser.smoothingTimeConstant = SMOOTHING;

            audioSrc.connect(analyser);
            analyser.connect(audioCtx.destination);
        },
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

                audio.src = url;
                audio.currentTime = offset;
            });
        },
        onAudioEnded(handler) {
            audio.removeEventListener('ended', onAudioEndedHandler);
            audio.addEventListener('ended', onAudioEndedHandler = handler);
        },
        play() {
            audio.volume = VOLUME_NORMAL;
            audio.play();
        },
        stop() {
            audio.pause();
        },
        mute() {
            audio.volume = VOLUME_MUTED;
        },
        unmute() {
            audio.volume = VOLUME_NORMAL;
        },
        getData() {
            const dataArray = new Uint8Array(BUFFER_LENGTH);
            analyser.getByteFrequencyData(dataArray);
            return dataArray;
        }
    };
})();
