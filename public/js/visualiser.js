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

    const timelapse = (() => {
        const history = [], audioData = dataFactory.audioDataSource()
            .withBucketCount(100)
            .withRedistribution(1.5)
            .withShuffling()
            .withFiltering(5000)
            .build();

        return () => {
            const maxHistory = 20,
                historyLag = 5,
                minWidth = 0.3 * width,
                maxWidth = 0.9 * width,
                barWidthFraction = 0.2,
                borderY = 50,
                rowGap = (height - 2 * borderY) / (maxHistory - 1),
                dataBuckets = audioData.get();

            history.push(dataBuckets);
            if (history.length > maxHistory * historyLag) {
                history.shift();
            }
            clearCanvas();
            history.filter((row, rowIndex) => (maxHistory * historyLag - rowIndex) % historyLag === 0).forEach((row, rowIndex) => {
                const rowWidth = minWidth + (maxWidth - minWidth) * rowIndex / (maxHistory - 1),
                    rowScale = rowWidth / maxWidth,
                    rowXStart = (width - rowWidth) / 2,
                    rowBarAndGapWidth = rowWidth / row.length,
                    rowBarWidth = rowBarAndGapWidth * barWidthFraction,
                    rowMaxHeight = 100 * rowScale,
                    rowYBase = borderY + rowGap * rowIndex,
                    colourPart = Math.round(255 * (0.2 + 0.8 * rowIndex / (maxHistory - 1)));

                ctx.fillStyle = makeRgb(colourPart);
                row.forEach((value, valIndex) => {
                    const x = rowXStart + valIndex * rowBarAndGapWidth,
                        y = rowYBase - rowMaxHeight * value,
                        w = rowBarWidth,
                        h = rowMaxHeight * value || 1;
                    ctx.fillRect(x, y, w, h);
                });
            });
        }
    })();

    const experimental = (() => {
        const audioData = dataFactory.audioDataSource()
            .withBucketCount(10)
            .withRedistribution(2)
            .build();

        return () => {
            const xBorderWidth = 50,
                yBorderWidth = 20,
                maxHeight = height - 2 * yBorderWidth,
                dataBuckets = audioData.get(),
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
        };
    })();

    const phonograph = (() => {
        const phonographConfig = config.visualiser.phonograph,
            minRadius = phonographConfig.minRadius,
            gapTotal = phonographConfig.gapTotal,
            snapshotStartColour = phonographConfig.snapshotStartColour,
            snapshotStopColour = phonographConfig.snapshotStopColour,
            audioData = dataFactory.audioDataSource()
                .withBucketCount(phonographConfig.bucketCount)
                .withRedistribution(phonographConfig.bucketSpread)
                .withFiltering(phonographConfig.silenceThresholdMillis)
                .withShuffling()
                .build();

        let startTs = Date.now(), snapshots = [], lastSnapshotTs = Date.now();

        return () => {
            const cx = width / 2,
                cy = height / 2,
                maxRadius = Math.min(height, width) / 2,
                now = Date.now();

            clearCanvas();

            const dataBuckets = audioData.get();

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

    const oscillograph = (() => {
        const audioData = dataFactory.audioDataSource()
            .withBucketCount(config.visualiser.oscillograph.bucketCount)
            .withFiltering(5000)
            .build();

        return () => {
            const WAVE_SPEED = config.visualiser.oscillograph.waveSpeed,
                PADDING = width > 500 ? 50 : 25,
                MIN_WAVE_LIGHTNESS = config.visualiser.oscillograph.minWaveLightness,
                TWO_PI = Math.PI * 2,
                startX = PADDING,
                endX = width - PADDING;

            const dataBuckets = audioData.get();

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
    })();

    const spirograph = (() => {
        const audioData = dataFactory.audioDataSource()
            .withBucketCount(100)
            .withRedistribution(1.5)
            .withShuffling()
            .withFiltering(5000)
            .build(),
        history = [];
        let t = 0;
        return () => {
            const dataBuckets = audioData.get();

            clearCanvas();
            const bucketCount = dataBuckets.length,
                angleDiff = Math.PI * 2 / bucketCount,
                cx = width / 2,
                cy = height / 2,
                minRadius = 50,
                maxRadius = 200,
                rotBase = 0.001;

            history.push(dataBuckets);
            if (history.length > 10) {
                history.shift();
            }

            let c = 0, d;
            t+=1;
            history.forEach(p => {
                c += 1 / history.length;
                ctx.strokeStyle = `rgba(255,255,255,${c/4}`;
                d = 1;
                p.forEach((value, i) => {
                    const xRadius = minRadius + (maxRadius - minRadius) * value;
                    ctx.beginPath();
                    ctx.ellipse(cx, cy, xRadius, xRadius / 2, (angleDiff * i + t * rotBase * (i+1) + c * value) * d, 0, Math.PI * 2);
                    ctx.stroke();
                    d *= -1;
                });

            })
        };
    })();

    const visualiserLookup = {
        "None": () => {},
        "Spirograph": spirograph,
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

