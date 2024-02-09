function buildVisualiserDataFactory(dataSource) {
    "use strict";

    const MAX_FREQ_DATA_VALUE = 255;
    const clock = buildClock();

    function sortDataIntoBuckets(data, bucketCount, p=1) {
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
             of the less common high frequency values (they just get squashed into fewer buckets, giving less 'dead space' in the visualisation).

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

        const indexes = bucketIndexes(data.length, bucketCount, p);

        let currentIndex = 0;
        return indexes.map(maxIndexForThisBucket => {
            const v = data.slice(currentIndex, maxIndexForThisBucket+1).reduce((total, value) => total + value, 0),
                w = maxIndexForThisBucket - currentIndex + 1;
            currentIndex = maxIndexForThisBucket+1;
            return v / (w * MAX_FREQ_DATA_VALUE);
        });
    }

    function sortArrayUsingIndexes(arr, indexes) {
        const filteredIndexes = indexes.filter(i => i < arr.length);
        return arr.map((v,i) => {
            return arr[filteredIndexes[i]];
        });
    }

    function buildAudioDataSource(bucketCount, redistribution, activityThresholdMillis, shuffleBuckets) {
        const shuffledIndexes = shuffle(Array.from(Array(bucketCount).keys())),
            activityTimestamps = new Array(bucketCount).fill(0);

        return {
            get() {
                const rawData = dataSource(),
                    now = clock.nowMillis();
                let bucketedData;

                if (bucketCount) {
                    bucketedData = sortDataIntoBuckets(rawData, bucketCount, redistribution);
                } else {
                    bucketedData = rawData.map(v => v / MAX_FREQ_DATA_VALUE);
                }

                if (shuffleBuckets) {
                    bucketedData = sortArrayUsingIndexes(bucketedData, shuffledIndexes);
                }

                if (activityThresholdMillis) {
                    bucketedData.forEach((value, i) => {
                        if (value) {
                            activityTimestamps[i] = now;
                        }
                    });
                    bucketedData = bucketedData.filter((v,i) => {
                        return now - activityTimestamps[i] < activityThresholdMillis;
                    });
                }

                return bucketedData;
            }
        };
    }

    return {
        audioDataSource() {
            let bucketCount, redistribution = 1, activityThresholdMillis, shuffleBuckets;

            return {
                withBucketCount(count) {
                    bucketCount = count;
                    return this;
                },
                withRedistribution(p) {
                    redistribution = p;
                    return this;
                },
                withFiltering(threshold) {
                    activityThresholdMillis = threshold;
                    return this;
                },
                withShuffling() {
                    shuffleBuckets = true;
                    return this;
                },
                build() {
                    return buildAudioDataSource(bucketCount, redistribution, activityThresholdMillis, shuffleBuckets);
                }
            }
        }
    };
}