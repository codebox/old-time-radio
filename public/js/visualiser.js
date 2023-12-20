function buildVisualiser(dataFactory) {
    "use strict";
    const BACKGROUND_COLOUR = 'black';

    let isStarted, elCanvas, ctx, width, height, fadeOutTimeout, visualiserId;

    function updateCanvasSize() {
        const ratio = window.devicePixelRatio || 1;
        elCanvas.width = (width = elCanvas.offsetWidth) * ratio;
        elCanvas.height = (height = elCanvas.offsetHeight) * ratio;
        ctx.scale(ratio, ratio);
    }

    function clearCanvas() {
        ctx.fillStyle = BACKGROUND_COLOUR;
        ctx.fillRect(0, 0, width, height);
    }

    function makeRgb(v) {
        return `rgb(${v},${v},${v})`;
    }

    const clock = buildClock();

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

        let startTs = clock.nowMillis(), snapshots = [], lastSnapshotTs = clock.nowMillis();

        return () => {
            const cx = width / 2,
                cy = height / 2,
                maxRadius = Math.min(height, width) / 2,
                now = clock.nowMillis();

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
        const spirographConfig = config.visualiser.spirograph,
            audioData = dataFactory.audioDataSource()
                .withBucketCount(spirographConfig.bucketCount)
                .withRedistribution(spirographConfig.bucketSpread)
                .withShuffling()
                .withFiltering(spirographConfig.silenceThresholdMillis)
                .build(),
            history = [],
            rotBase = spirographConfig.rotationBaseValue,
            alphaCycleRate = spirographConfig.alphaCycleRate,
            aspectRatio = spirographConfig.aspectRatio,
            rotationFactor = spirographConfig.rotationFactor,
            maxRadiusSize = spirographConfig.maxRadiusSize,
            minRadiusSize = spirographConfig.minRadiusSize,
            historySize = spirographConfig.historySize,
            backgroundLoop = spirographConfig.backgroundLoop,
            foregroundLoop = spirographConfig.foregroundLoop,
            backgroundAlphaCalc = buildAlphaCalc(backgroundLoop),
            foregroundAlphaCalc = buildAlphaCalc(foregroundLoop);

        let t = 0;

        function buildAlphaCalc(config) {
            const {minAlpha, maxAlpha, offset} = config;
            return (age, value) => {
                const f = (offset + t / alphaCycleRate + value * age) % 1;
                return minAlpha + (maxAlpha - minAlpha) * f;
            };
        }

        function drawHistory(cx, cy, minRadius, maxRadius, alphaCalc, angleDiff, initialDirection) {
            let age = 0;
            history.forEach(p => {
                age += 1 / history.length;
                let direction = initialDirection;
                p.forEach((value, i) => {
                    const xRadius = minRadius + (maxRadius - minRadius) * value;
                    let alpha = alphaCalc(age, value);
                    ctx.strokeStyle = `rgba(255,255,255,${alpha}`;
                    ctx.beginPath();
                    ctx.ellipse(cx, cy, xRadius, xRadius * aspectRatio, (angleDiff * i + t * rotBase * (i+1) + age * value * rotationFactor) * direction, 0, Math.PI * 2);
                    ctx.stroke();
                    direction *= -1;
                });
            })
        }

        return () => {
            const dataBuckets = audioData.get();

            clearCanvas();
            const bucketCount = dataBuckets.length,
                angleDiff = Math.PI * 2 / bucketCount,
                cx = width / 2,
                cy = height / 2,
                smallestDimension = Math.min(height, width),
                bgMaxRadius = maxRadiusSize * smallestDimension * backgroundLoop.maxRadiusFactor,
                bgMinRadius = minRadiusSize * smallestDimension * backgroundLoop.minRadiusFactor,
                fgMaxRadius = maxRadiusSize * smallestDimension,
                fgMinRadius = minRadiusSize * smallestDimension;

            history.push(dataBuckets);
            if (history.length > historySize) {
                history.shift();
            }

            t+=1;
            drawHistory(cx, cy, bgMinRadius, bgMaxRadius, backgroundAlphaCalc, angleDiff, -1);
            drawHistory(cx, cy, fgMinRadius, fgMaxRadius, foregroundAlphaCalc, angleDiff,  1);
        };
    })();

    const visualiserLookup = {
        "None": () => {},
        "Spirograph": spirograph,
        "Oscillograph": oscillograph,
        "Phonograph": phonograph
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
            ctx = elCanvas.getContext('2d', { alpha: false });
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

