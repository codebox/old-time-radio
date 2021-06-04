"use strict";

function promiseBatcher(concurrency, allPromises) {
    /*
        promiseBatcher(2, [0,1,2,3,4,5])
        'concurrency' determines the number of promises that execute at one time
        divide list of promises into this many batches then each batch becomes a chain of promises that run sequentially
        [0,1,2] [3,4,5] --> run 0+3 then 1+4 then 2+5
     */
    const batchesOfPromises = [], batchSize = Math.ceil(allPromises.length / concurrency);
    let i=0;

    while (i < allPromises.length) {
        batchesOfPromises.push(allPromises.slice(i, i+=batchSize));
    }

    function promiseChain(promises) {
        return promises.reduce((prev, p) => {
            return prev.then(results => {
                return p.then(result => [...results, result]);
            });
        }, Promise.resolve([]));
    }

    return Promise.all(batchesOfPromises.map(promiseChain));
}

module.exports.go = () => {
    function makePromise(i) {
        return new Promise(success => {
            setTimeout(() => {
                console.log('resolving',i)
                success('promise ' + i);
            }, 3000);
        });
    }

    // https://stackoverflow.com/questions/43082934/how-to-execute-promises-sequentially-passing-the-parameters-from-an-array
    const allPromises = [...Array(10).keys()].map(makePromise);

    promiseBatcher(3, allPromises).then(r => console.log('done',r))
};