function buildVisualiser(dataSource) {
    "use strict";
    const BACKGROUND_COLOUR = 'black',
        MAX_FREQ_DATA_VALUE = 255;

    /*
        dataSource is a function which returns an array of values representing the audio being played at the current instant
        the length of the array is config.audio.fftWindowSize / 2 (i.e. 512)
        each value in the array is an integer in the range 0-255 representing the volume of a given frequency bucket in the audio sample
     */
    let isStarted, elCanvas, ctx, width, height, fadeOutTimeout, visualiserId;

    function updateCanvasSize() {
        width = elCanvas.width = elCanvas.offsetWidth;
        height = elCanvas.height = elCanvas.offsetHeight;
    }

    function clearCanvas() {
        ctx.fillStyle = BACKGROUND_COLOUR;
        ctx.fillRect(0, 0, width, height);
    }

    function sortDataIntoBuckets(bucketCount, p=1) {
        function bucketIndexes(valueCount, bucketCount, p) {
            /*
             Each time we sample the audio we get 512 separate values, each one representing the volume for a certain part of the
             audio frequency range. In order to visualise this data nicely we usually want to aggregate the data into 'buckets' before
             displaying it (for example, if we want to display a frequency bar graph we probably don't want it to have 512 bars).
             The simplest way to do this is by dividing the range up into equal sized sections (eg aggregating the 512 values
             into 16 buckets of size 32), however for the audio played by this site this tends to give lop-sided visualisations because
             low frequencies are much more common.

             This function calculates a set of bucket sizes which distribute the frequency values in a more interesting way, spreading the
             low frequency values over a larger number of buckets, so they are more prominent in the visualisation, without discarding any
             of the less common high frequency values (they just get squashed into fewer buckets, giving less 'dead space' in the visualisaton).

             The parameter 'p' determines how much redistribution is performed. A 'p' value of 1 gives uniformly sized buckets (ie no
             redistribution), as 'p' is increased more and more redistribution is performed.

             Note that the function may return fewer than the requested number of buckets. Bucket sizes are calculated as floating-point values,
             but since non-integer bucket sizes make no sense, these values get rounded up and then de-duplicated which may result in some getting
             discarded.
             */
            "use strict";
            let unroundedBucketSizes;

            if (p===1) {
                unroundedBucketSizes = new Array(bucketCount).fill(valueCount / bucketCount);

            } else {
                const total = (1 - Math.pow(p, bucketCount)) / (1 - p);
                unroundedBucketSizes = new Array(bucketCount).fill(0).map((_,i) => valueCount * Math.pow(p, i) / total);
            }

            let total = 0, indexes = unroundedBucketSizes.map(size => {
                return Math.floor(total += size);
            });

            return [...new Set(indexes)]; // de-duplicate indexes
        }

        const data = dataSource(),
            indexes = bucketIndexes(data.length, bucketCount, p);

        let currentIndex = 0;
        return indexes.map(maxIndexForThisBucket => {
            const v = data.slice(currentIndex, maxIndexForThisBucket+1).reduce((total, value) => total + value, 0),
                w = maxIndexForThisBucket - currentIndex + 1;
            currentIndex = maxIndexForThisBucket+1;
            return v / (w * MAX_FREQ_DATA_VALUE);
        });
    }

    function experimental() {
        const maxBucketCount = 10,
            xBorderWidth = 50,
            yBorderWidth = 20,
            maxHeight = height - 2 * yBorderWidth,
            dataBuckets = sortDataIntoBuckets(maxBucketCount,2),
            bucketCount = dataBuckets.length,
            barSeparation = 5,
            barWidth = (width - 2 * xBorderWidth - (bucketCount-1) * barSeparation) / bucketCount;

        let xBarStart = xBorderWidth;
        clearCanvas();
        ctx.fillStyle = 'white';
        dataBuckets.forEach((value, i) => {
            const x = xBarStart,
                y = yBorderWidth + maxHeight * (1 - value),
                w = barWidth,
                h = maxHeight * value;
            ctx.fillRect(x, y, w, h);
            xBarStart += (barSeparation + barWidth);
        });
    }

    function sineWaves() {
        const WAVE_SPEED = config.visualiser.sineWaves.waveSpeed,
            PADDING = width > 500 ? 50 : 25,
            MIN_WAVE_LIGHTNESS = config.visualiser.sineWaves.minWaveLightness,
            TWO_PI = Math.PI * 2,
            startX = PADDING,
            endX = width - PADDING;

        const dataBuckets = sortDataIntoBuckets(config.visualiser.sineWaves.bucketCount);

        clearCanvas();
        dataBuckets.filter(v=>v).forEach((v, i) => {
            function calcY(x) {
                const scaledX = TWO_PI * (x - startX) / (endX - startX);
                return (height / 2) + Math.sin(scaledX * (i + 1)) * v * height / 2;
            }

            ctx.strokeStyle = `hsl(0,0%,${Math.floor(MIN_WAVE_LIGHTNESS + (100 - MIN_WAVE_LIGHTNESS) * (1 - v))}%)`;
            ctx.beginPath();
            let first = true;

            for (let x = startX; x < endX; x++) {
                const y = height - calcY(x - step * (i + 1));
                if (first) {
                    ctx.moveTo(x, y);
                    first = false;
                }
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        });

        step = (step + WAVE_SPEED);
    }

    const visualiserLookup = {
        "None": () => {},
        "Sine Waves": sineWaves,
        "Experimental": experimental
    };

    let step = 0;
    function paint() {
        "use strict";
        if (isStarted) {
            visualiserLookup[visualiserId]();
        }

        requestAnimationFrame(paint);
    }

    return {
        init(_elCanvas) {
            elCanvas = _elCanvas;
            ctx = elCanvas.getContext('2d');
            updateCanvasSize();
            clearCanvas();
            paint();
        },
        getVisualiserIds() {
            return Object.keys(visualiserLookup);
        },
        setVisualiserId(id) {
            clearCanvas();
            visualiserId = id;
        },
        setDataSource(source) {
            dataSource = source;
        },
        start() {
            if (fadeOutTimeout) {
                clearTimeout(fadeOutTimeout);
                fadeOutTimeout = null;
            }
            isStarted = true;
        },
        stop(delayMillis = 0) {
            if (!fadeOutTimeout) {
                fadeOutTimeout = setTimeout(() => {
                    isStarted = false;
                    clearCanvas();
                }, delayMillis);
            }
        },
        onResize() {
            return updateCanvasSize;
        }
    };
}

