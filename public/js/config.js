const config = {
    audio : {
        smoothing: 0.8,
        fftWindowSize: 1024
    },
    visualiser: {
        fadeOutIntervalMillis: 2000,
        oscillograph: {
            bucketCount: 20,
            waveSpeed: 0.5,
            minWaveLightness: 10
        },
        phonograph: {
            bucketCount: 100,
            bucketSpread: 1.2,
            minRadius: 30,
            silenceThresholdMillis: 5 * 1000,
            gapTotal: Math.PI,
            offsetRate: 1 / 100000,
            snapshotIntervalMillis: 1000,
            gradientStartColour: 10,
            gradientStopColour: 255,
            snapshotStartColour: 100,
            snapshotStopColour: 0,
            snapshotSpeed: 1,
            snapshotFadeOutFactor: 2
        },
        spirograph: {
            bucketCount: 100,
            bucketSpread: 1.5,
            silenceThresholdMillis: 5 * 1000,
            rotationBaseValue: 0.0005,
            alphaCycleRate: 600,
            aspectRatio: 0.5,
            rotationFactor: 1 / 3,
            maxRadiusSize: 0.5,
            minRadiusSize: 0.25,
            historySize: 10,
            backgroundLoop: {
                minRadiusFactor: 0.5,
                maxRadiusFactor: 2,
                minAlpha: 0.05,
                maxAlpha: 0.15,
                offset: 0
            },
            foregroundLoop: {
                minAlpha: 0.1,
                maxAlpha: 0.4,
                offset: 0.5
            }
        }
    },
    sleepTimer: {
        fadeOutDelta: 0.02,
        fadeOutIntervalMillis: 100,
        intervals: [90,60,45,30,15]
    },
    schedule: {
        refreshIntervalMillis: 5000,
        lengthInSeconds: 12 * 60 * 60
    },
    messages: {
        canned: [
            'All audio hosted by The Internet Archive. Find more at http://archive.org',
            'To check the channel schedules, click the menu ↗',
            'Streaming shows from the Golden Age of Radio, 24 hours a day',
            'Volume too loud? You can turn it down, click the menu ↗',
            'Please support The Internet Archive by donating at http://archive.org/donate',
            'Build your own channel with your favourite shows, click the menu ↗',
            'To change the visualiser or turn it off, click the menu ↗'
        ],
        charPrintIntervalMillis: 40,
        tempMessageDurationMillis: 5000,
        tempMessageIntervalMillis: 60 * 1000
    }
};