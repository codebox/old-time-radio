"use strict";
const cacheBuilder = require('../src/cache.js'),
    fs = require('fs').promises;

describe("cache", () => {
    let sourceIds;
    function source(id) {
        console.log('source')
        sourceIds.push(id);
        return Promise.resolve(`result=${id}`);
    }

    beforeEach(async () => {
        await fs.rmdir('cache/test', {recursive: true})
        sourceIds = [];
    });

    describe("with no expiry time", () => {
        let cache;

        beforeEach(async () => {
            cache = cacheBuilder.buildCache("test", source);
            await cache.init();
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

});
