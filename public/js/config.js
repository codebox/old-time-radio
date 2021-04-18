const config = {
    audio : {
        smoothing: 0.8,
        fftWindowSize: 1024
    },
    visualiser: {
        fadeOutIntervalMillis: 2000,
        sineWaves: {
            bucketCount: 20,
            waveSpeed: 0.5,
            minWaveLightness: 10
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
            'Build your own channel with your favourite shows, click the menu ↗'
        ],
        charPrintIntervalMillis: 40,
        tempMessageDurationMillis: 5000,
        tempMessageIntervalMillis: 60 * 1000
    }
};