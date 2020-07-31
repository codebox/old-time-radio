const audioPlayer = (() => {
    "use strict";
    const audio = new Audio(),
        SMOOTHING = 0.8,
        FFT_WINDOW_SIZE = 1024,
        BUFFER_LENGTH = FFT_WINDOW_SIZE / 2;

    function isIOS(){
        "use strict";
        return /iPad|iPhone|iPod/.test(navigator.platform)
            || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    }

    /*
    iOS won't start playing the audio until it can play the file through, even though it fires the 'canplay' event
    some time before that.
    */
    const CAN_PLAY_EVENT = isIOS() ? 'canplaythrough' : 'canplay';

    let onAudioEndedHandler = () => {},
        analyser, audioInitialised;

    function initAudio() {
        if (!audioInitialised) {
            audio.crossOrigin = "anonymous";
            if (window.AudioContext) {
                // webkitAudioContext doesn't work for this on latest iOS
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

    let dummyData;
    function buildDummyData() {
        "use strict";
        function fillRange(startIndex, count) {
            for (let i = startIndex; i < startIndex + count; i++) {
                data[i] = 255;
            }
        }
        const data = new Array(510).fill(0);
        fillRange(0, 15);
        fillRange(100, 15);
        fillRange(200, 15);
        return data;
    }

    return {
        load(url, offset = 0) {
            return new Promise((onLoaded, onError) => {
                function removeHandlers() {
                    audio.removeEventListener(CAN_PLAY_EVENT, onAudioLoaded);
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
                audio.addEventListener(CAN_PLAY_EVENT, onAudioLoaded);
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
            if (analyser) {
                const dataArray = new Uint8Array(BUFFER_LENGTH);
                analyser.getByteFrequencyData(dataArray);
                return dataArray;
            } else {
                if (!dummyData) {
                    dummyData = buildDummyData();
                }
                return dummyData;
            }
        }
    };
})();
