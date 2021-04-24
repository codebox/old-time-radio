function buildVisualiser(dataFactory) {
    "use strict";
    const BACKGROUND_COLOUR = 'black';

    let isStarted, elCanvas, ctx, width, height, fadeOutTimeout, visualiserId;

    function updateCanvasSize() {
        width = elCanvas.width = elCanvas.offsetWidth;
        height = elCanvas.height = elCanvas.offsetHeight;
    }

    function clearCanvas() {
        ctx.fillStyle = BACKGROUND_COLOUR;
        ctx.fillRect(0, 0, width, height);
    }

    function makeRgb(v) {
        return `rgb(${v},${v},${v})`;
    }

    const timelapseHistory = [], timelapseData = dataFactory.audioDataSource()
        .withBucketCount(100)
        .withRedistribution(1.5)
        .withShuffling()
        .withFiltering(5000)
        .build();
    function timelapse() {
        const maxHistory = 20,
            historyLag = 5,
            minWidth = 0.3 * width,
            maxWidth = 0.9 * width,
            barWidthFraction = 0.2,
            borderY = 50,
            rowGap = (height - 2 * borderY) / (maxHistory - 1),
            dataBuckets = timelapseData.get();

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
            });
        });
    }

    const experimentalDataSource = dataFactory.audioDataSource().withBucketCount(10).withRedistribution(2).build();
    function experimental() {
        const xBorderWidth = 50,
            yBorderWidth = 20,
            maxHeight = height - 2 * yBorderWidth,
            dataBuckets = experimentalDataSource.get(),
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

    const phonographConfig = config.visualiser.phonograph,
        phonographDataSource = dataFactory.audioDataSource()
            .withBucketCount(phonographConfig.bucketCount)
            .withRedistribution(phonographConfig.bucketSpread)
            .withFiltering(phonographConfig.silenceThresholdMillis)
            .withShuffling()
            .build();

    const phonograph = (() => {
        let startTs = Date.now(), snapshots = [], lastSnapshotTs = Date.now();

        const phonographConfig = config.visualiser.phonograph,
            minRadius = phonographConfig.minRadius,
            gapTotal = phonographConfig.gapTotal,
            snapshotStartColour = phonographConfig.snapshotStartColour,
            snapshotStopColour = phonographConfig.snapshotStopColour;

        return () => {
            const cx = width / 2,
                cy = height / 2,
                maxRadius = Math.min(height, width) / 2,
                now = Date.now();

            clearCanvas();

            const dataBuckets = phonographDataSource.get();

            const anglePerBucket = Math.PI * 2 / dataBuckets.length;

            const offset = Math.PI * 2 * (now - startTs) * phonographConfig.offsetRate,
                createNewSnapshot = now - lastSnapshotTs > phonographConfig.snapshotIntervalMillis,
                snapshotData = [],
                gradient = ctx.createRadialGradient(cx, cy, minRadius / 2, cx, cy, maxRadius);

            gradient.addColorStop(0, makeRgb(phonographConfig.gradientStartColour));
            gradient.addColorStop(1, makeRgb(phonographConfig.gradientStopColour));

            if (createNewSnapshot) {
                lastSnapshotTs = now;
            }

            const snapshotFadeOutDistance = maxRadius * phonographConfig.snapshotFadeOutFactor;

            snapshots.forEach(snapshot => {
                const v = Math.max(0, snapshotStopColour + snapshotStartColour * (1 - snapshot.distance / snapshotFadeOutDistance));
                const snapshotGradient = ctx.createRadialGradient(cx, cy, minRadius / 2, cx, cy, snapshotFadeOutDistance);
                snapshotGradient.addColorStop(0, makeRgb(0));
                snapshotGradient.addColorStop(1, makeRgb(v));
                ctx.beginPath();
                ctx.strokeStyle = 'black';
                ctx.fillStyle = snapshotGradient;
                snapshot.data.forEach(data => {
                    ctx.moveTo(cx, cy);
                    ctx.arc(cx, cy, data.radius + snapshot.distance, data.startAngle, data.endAngle);
                    ctx.lineTo(cx, cy);
                });
                ctx.fill();
                ctx.stroke();
            });

            dataBuckets.forEach((value, i) => {
                const startAngle = offset + anglePerBucket * i + gapTotal / dataBuckets.length,
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

            snapshots.forEach(s => s.distance += phonographConfig.snapshotSpeed);
            snapshots = snapshots.filter(s => s.distance < snapshotFadeOutDistance);

            if (createNewSnapshot) {
                snapshots.push({
                    distance: 0,
                    data: snapshotData
                });
            }
        };
    })();


    const oscillographDataSource = dataFactory.audioDataSource()
            .withBucketCount(config.visualiser.oscillograph.bucketCount)
            .withFiltering(5000)
            .build();
    function oscillograph() {
        const WAVE_SPEED = config.visualiser.oscillograph.waveSpeed,
            PADDING = width > 500 ? 50 : 25,
            MIN_WAVE_LIGHTNESS = config.visualiser.oscillograph.minWaveLightness,
            TWO_PI = Math.PI * 2,
            startX = PADDING,
            endX = width - PADDING;

        const dataBuckets = oscillographDataSource.get();

        clearCanvas();
        dataBuckets.forEach((v, i) => {
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

    const circularDataSource = dataFactory.audioDataSource()
        .withBucketCount(30)
        .withRedistribution(1.5)
        .withShuffling()
        .withFiltering(5000)
        .build();

    function circular() {
        const dataBuckets = circularDataSource.get();

        clearCanvas();
        const minRadius = 100,
            bucketCount = dataBuckets.length,
            angleDiff = Math.PI * 2 / bucketCount,
            cx = width / 2,
            cy = height / 2,
            maxRadius = 150;//Math.min(width, height) / 2;

        ctx.fillStyle = 'white';
        dataBuckets.forEach((value, i) => {
            const radius = minRadius + (maxRadius - minRadius) * value,
                angle = i * angleDiff,
                x = cx + Math.sin(angle) * radius,
                y = cy + Math.cos(angle) * radius;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.arc(x, y, 5, 0, 2 * Math.PI, false);
            ctx.fill();
        });
    }

    const visualiserLookup = {
        "None": () => {},
        "Circular": circular,
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

