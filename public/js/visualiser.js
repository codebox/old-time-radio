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

    const timelapseHistory = [];
    function timelapse() {
        const maxHistory = 20,
            historyLag = 5,
            minWidth = 0.3 * width,
            maxWidth = 0.9 * width,
            barWidthFraction = 0.2,
            borderY = 50,
            rowGap = (height - 2 * borderY) / (maxHistory - 1),
            dataBuckets = sortDataIntoBuckets(100, 1.5);

        timelapseHistory.push(dataBuckets);
        if (timelapseHistory.length > maxHistory * historyLag) {
            timelapseHistory.shift();
        }
        clearCanvas();
        timelapseHistory.filter((row, rowIndex) => (maxHistory * historyLag - rowIndex) % historyLag === 0).forEach((row, rowIndex) => {
            const rowWidth = minWidth + (maxWidth - minWidth) * rowIndex / (maxHistory - 1),
                rowScale = rowWidth / maxWidth,
                rowXStart = (width - rowWidth) / 2,
                rowBarAndGapWidth = rowWidth / row.length,
                rowBarWidth = rowBarAndGapWidth * barWidthFraction,
                rowMaxHeight = 100 * rowScale,
                rowYBase = borderY + rowGap * rowIndex,
                colourPart = Math.round(255 * (0.2 + 0.8 * rowIndex / (maxHistory - 1)));

            ctx.fillStyle = `rgb(${colourPart}, ${colourPart}, ${colourPart})`;
            row.forEach((value, valIndex) => {
                const x = rowXStart + valIndex * rowBarAndGapWidth,
                    y = rowYBase - rowMaxHeight * value,
                    w = rowBarWidth,
                    h = rowMaxHeight * value || 1;
                ctx.fillRect(x, y, w, h);
                // ctx.strokeStyle = 'black';
                // ctx.rect(x,y,w,h);
                // ctx.stroke();
            });
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

    let startTs = Date.now(), dataBucketNonZeroTimestamps, dataBucketShuffleIndexes, snapshots = [], lastSnapshotTs = Date.now();
    function phonograph() {
        function shuffleBuckets(buckets) {
            const shuffled = [];
            dataBucketShuffleIndexes.forEach((newIndex, oldIndex) => {
                shuffled[newIndex] = buckets[oldIndex];
            });
            return shuffled;
        }
        const cx = width / 2,
            cy = height / 2,
            maxBucketCount = config.visualiser.phonograph.bucketCount,
            minRadius = config.visualiser.phonograph.minRadius,
            maxRadius = Math.min(height, width) / 2,
            unshuffledBuckets = sortDataIntoBuckets(maxBucketCount, config.visualiser.phonograph.bucketSpread),
            bucketCount = unshuffledBuckets.length;
            if (!dataBucketShuffleIndexes) {
                dataBucketShuffleIndexes = Array.from(Array(bucketCount).keys());
                for (let i = bucketCount - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [dataBucketShuffleIndexes[i], dataBucketShuffleIndexes[j]] = [dataBucketShuffleIndexes[j], dataBucketShuffleIndexes[i]];
                }
            }

            const dataBuckets = shuffleBuckets(unshuffledBuckets),
            now = Date.now();

        if (!dataBucketNonZeroTimestamps) {
            dataBucketNonZeroTimestamps = new Array(bucketCount).fill(0);
        }
        clearCanvas();

        dataBuckets.forEach((value, i) => {
            if (value) {
                dataBucketNonZeroTimestamps[i] = now;
            }
        });

        const dataBucketsToDisplay = dataBuckets.filter((value, i) => {
            return (now - dataBucketNonZeroTimestamps[i]) < config.visualiser.phonograph.silenceThresholdMillis;
        });

        const gapTotal = config.visualiser.phonograph.gapTotal;
        const anglePerBucket = Math.PI * 2 / dataBucketsToDisplay.length;

        const offset = Math.PI * 2 * (Date.now() - startTs) * config.visualiser.phonograph.offsetRate,
            createNewSnapshot = now - lastSnapshotTs > config.visualiser.phonograph.snapshotIntervalMillis,
            snapshotData = [],
            gradient = ctx.createRadialGradient(cx,cy,minRadius/2, cx,cy,maxRadius);

        function makeRgb(v) {
            return `rgb(${v},${v},${v})`;
        }
        gradient.addColorStop(0, makeRgb(config.visualiser.phonograph.gradientStartColour));
        gradient.addColorStop(1, makeRgb(config.visualiser.phonograph.gradientStopColour));

        if (createNewSnapshot) {
            lastSnapshotTs = now;
        }

        const snapshotStartColour = config.visualiser.phonograph.snapshotStartColour,
            snapshotStopColour = config.visualiser.phonograph.snapshotStopColour,
            snapshotFadeOutDistance = maxRadius * config.visualiser.phonograph.snapshotFadeOutFactor;
        snapshots.forEach(snapshot => {
            const v = Math.max(0, snapshotStopColour + snapshotStartColour * (1 - snapshot.distance / snapshotFadeOutDistance));
            const snapshotGradient = ctx.createRadialGradient(cx,cy,minRadius/2, cx,cy,maxRadius*2);
            snapshotGradient.addColorStop(0, makeRgb(0));
            snapshotGradient.addColorStop(1, makeRgb(v));
            ctx.beginPath();
            ctx.strokeStyle = 'black';
            ctx.fillStyle = snapshotGradient;
            snapshot.data.forEach(data => {
                ctx.moveTo(cx, cy);
                ctx.arc(cx, cy, data.radius + snapshot.distance, data.startAngle , data.endAngle );
                ctx.lineTo(cx, cy);
            });
            ctx.fill();
            ctx.stroke();
        });

        dataBucketsToDisplay.forEach((value, i) => {
            const startAngle = offset + anglePerBucket * i + gapTotal / dataBucketsToDisplay.length,
                endAngle = offset + anglePerBucket * (i + 1),
                radius = minRadius + value * (maxRadius - minRadius);

            ctx.fillStyle = gradient;

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, radius, startAngle, endAngle);
            ctx.lineTo(cx, cy);
            ctx.fill();

            if (createNewSnapshot) {
                snapshotData.unshift({radius, startAngle, endAngle});
            }
        });

        snapshots.forEach(s => s.distance += config.visualiser.phonograph.snapshotSpeed);
        snapshots = snapshots.filter(s => s.distance < snapshotFadeOutDistance);

        if (createNewSnapshot) {
            snapshots.push({
                distance: 0,
                data: snapshotData
            });
        }

    }

    function oscillograph() {
        const WAVE_SPEED = config.visualiser.oscillograph.waveSpeed,
            PADDING = width > 500 ? 50 : 25,
            MIN_WAVE_LIGHTNESS = config.visualiser.oscillograph.minWaveLightness,
            TWO_PI = Math.PI * 2,
            startX = PADDING,
            endX = width - PADDING;

        const dataBuckets = sortDataIntoBuckets(config.visualiser.oscillograph.bucketCount);

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
        "Oscillograph": oscillograph,
        "Time Lapse": timelapse,
        "Phonograph": phonograph,
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

