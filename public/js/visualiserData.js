function buildVisualiserData(dataSource) {
    "use strict";
    const MAX_FREQ_DATA_VALUE = 255;

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

    function shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    let bucketNonZeroTimestamps = [], bucketShuffleIndexes = [];

    return {
        get() {
            /*
             'dataSource' is a function which returns an array of values representing the audio being played at the current instant
             the length of the array is config.audio.fftWindowSize / 2 (i.e. 512)
             each value in the array is an integer in the range 0-255 representing the volume of a given frequency bucket in the audio sample
             */
            return dataSource();
        },

        getBuckets(max, p=1) {
            return sortDataIntoBuckets(max, p);
        },

        getActiveBuckets(max, activityThresholdMillis=5000, p=1) {
            const allBuckets = this.getBuckets(max, p),
                now = Date.now();

            if (bucketNonZeroTimestamps.length !== allBuckets.length) {
                bucketNonZeroTimestamps = new Array(allBuckets.length).fill(0)
            }

            allBuckets.forEach((value, i) => {
                if (value) {
                    bucketNonZeroTimestamps[i] = now;
                }
            });

            return allBuckets.filter((value, i) => {
                return (now - bucketNonZeroTimestamps[i]) < activityThresholdMillis;
            });
        },

        getActiveBucketsShuffled(max, activityThresholdMillis=5000, p=1) {
            const activeBuckets = this.getActiveBuckets(max, activityThresholdMillis, p);
            if (bucketShuffleIndexes.length !== activeBuckets.length) {
                bucketShuffleIndexes = shuffle(Array.from(Array(activeBuckets.length).keys()));
            }
            const shuffled = [];
            bucketShuffleIndexes.forEach((newIndex, oldIndex) => {
                shuffled[newIndex] = activeBuckets[oldIndex];
            });
            return shuffled;
        }
    }
}