"use strict";
const cacheBuilder = require('../src/cache.js'),
    config = require('../config.json'),
    fs = require('fs').promises;

describe("cache", () => {
    let sourceIds;
    function source(id) {
        sourceIds.push(id);
        return Promise.resolve(`result=${id}`);
    }

    beforeEach(async () => {
        await fs.rmdir('cache/test', {recursive: true})
        sourceIds = [];
    });

    describe("with no expiry time", () => {
        let cache;

        beforeEach(() => {
            cache = cacheBuilder.buildCache("test", source);
        });

        it("source only called once per id", async () => {
            expect(sourceIds).toEqual([]);

            expect(await cache.get('a')).toBe('result=a');
            expect(sourceIds).toEqual(['a']);

            expect(await cache.get('a')).toBe('result=a');
            expect(sourceIds).toEqual(['a']);

            expect(await cache.get('b')).toBe('result=b');
            expect(sourceIds).toEqual(['a','b']);

            expect(await cache.get('a')).toBe('result=a');
            expect(sourceIds).toEqual(['a', 'b']);

            expect(await cache.get('b')).toBe('result=b');
            expect(sourceIds).toEqual(['a', 'b']);
        });
    });

    describe("items expire correctly", () => {
        let cache;

        beforeEach(() => {
            config.caches.expirySeconds.test = 2;
            cache = cacheBuilder.buildCache("test", source);
        });

        it("source only called once per id", async done => {
            expect(sourceIds).toEqual([]);

            expect(await cache.get('a')).toBe('result=a');
            expect(sourceIds).toEqual(['a']);

            expect(await cache.get('a')).toBe('result=a');
            expect(sourceIds).toEqual(['a']);

            setTimeout(async () => {
                expect(await cache.get('a')).toBe('result=a');
                expect(sourceIds).toEqual(['a', 'a']);
                done();
            }, 3000);
        });
    });

    describe("can memoize function", () => {
        let callCounter;

        function add(...nums) {
            callCounter += 1;
            return Promise.resolve(nums.reduce((a,b) => a + b, 0));
        }

        beforeEach(() => {
            callCounter = 0;
        });

        afterEach(async () => {
            await fs.rmdir('cache/no_params', {recursive: true});
            await fs.rmdir('cache/with_params', {recursive: true});
        });

        it("with no parameters", async () => {
            const addMemo = cacheBuilder.memoize(add, "no_params");
            expect(callCounter).toBe(0);
            expect(await addMemo()).toEqual(0);
            expect(callCounter).toBe(1);
            expect(await addMemo()).toEqual(0);
            expect(callCounter).toBe(1);
        });

        it("with parameters", async () => {
            const addMemo = cacheBuilder.memoize(add, "with_params");

            expect(callCounter).toBe(0);
            expect(await addMemo(1)).toEqual(1);
            expect(callCounter).toBe(1);
            expect(await addMemo(2)).toEqual(2);
            expect(callCounter).toBe(2);
            expect(await addMemo(1)).toEqual(1);
            expect(callCounter).toBe(2);
            expect(await addMemo(2)).toEqual(2);
            expect(callCounter).toBe(2);
            expect(await addMemo(1,2,3)).toEqual(6);
            expect(callCounter).toBe(3);
            expect(await addMemo(1,2,3)).toEqual(6);
            expect(callCounter).toBe(3);
            expect(await addMemo(5,6)).toEqual(11);
            expect(callCounter).toBe(4);
        });
    });
});
