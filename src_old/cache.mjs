import { promises as fs } from "fs";
import path from "path";
import { LRUCache } from 'lru-cache';
import { log } from "./log.mjs";
import { config } from "./config.mjs";
import { clock } from "./clock.mjs";
import { deepEquals } from "./utils.mjs";
export class Cache {
    cacheName;
    diskCache;
    lruCache;
    fetch;
    isFresh;
    constructor(cacheName, fetch, maxItems, diskCacheMaxAge) {
        this.cacheName = cacheName;
        this.fetch = fetch;
        if (diskCacheMaxAge) {
            this.diskCache = new DiskCache(path.join(config.caches.baseDirectory, cacheName), diskCacheMaxAge);
            this.isFresh = key => this.diskCache.isFresh(key);
        }
        else {
            this.isFresh = () => Promise.resolve(true);
        }
        this.lruCache = new LRUCache({
            max: maxItems,
            onInsert: (value, key) => {
                log.debug(`Added item for [${key}] to ${this.cacheName} memory cache`);
                if (this.diskCache) {
                    this.diskCache.set(key, value).then(didUpdate => {
                        if (didUpdate) {
                            log.debug(`Saved item for [${key}] to ${this.cacheName} disk cache`);
                        }
                    }).catch((error) => {
                        log.error(`Failed to save item for [${key}] to ${this.cacheName} disk cache: ${error.message}`);
                    });
                }
            },
            dispose: (value, key, reason) => {
                log.debug(`Disposing item for [${key}] from ${this.cacheName} cache, reason=${reason}`);
            },
        });
    }
    async refetchStaleItems() {
        const staleKeys = [];
        for (const key of this.lruCache.keys()) {
            if (!await this.isFresh(key)) {
                staleKeys.push(key);
            }
        }
        log.debug(`Found ${staleKeys.length} stale items in ${this.cacheName} cache`);
        for (const key of staleKeys) {
            log.debug(`Refetching stale item for key [${key}] in ${this.cacheName} cache`);
            try {
                const newValue = await this.fetch(key);
                this.lruCache.set(key, newValue);
            }
            catch (error) {
                log.error(`Failed to refetch item for key [${key}] in ${this.cacheName} cache: ${error.message}`);
            }
        }
    }
    async get(key) {
        if (this.lruCache.has(key)) {
            log.debug(`Cache hit for key [${key}] in ${this.cacheName} memory cache`);
            return this.lruCache.get(key);
        }
        else if (this.diskCache) {
            if (await this.diskCache.has(key)) {
                log.debug(`Cache hit for key [${key}] in ${this.cacheName} disk cache`);
                const value = await this.diskCache.get(key);
                this.lruCache.set(key, value);
                return value;
            }
        }
        log.debug(`${this.cacheName} cache miss for key [${key}], fetching new value`);
        const newValue = await this.fetch(key);
        log.debug(`Fetched new value for [${key}], saving to ${this.cacheName} cache`);
        this.lruCache.set(key, newValue); // gets saved to diskCache in onInsert
        return newValue;
    }
    async set(key, value) {
        log.debug(`Setting value for key [${key}] in ${this.cacheName} cache`);
        this.lruCache.set(key, value);
    }
    async remove(key) {
        log.debug(`Removing key [${key}] from ${this.cacheName} cache`);
        this.lruCache.delete(key);
    }
    async clear() {
        if (this.diskCache) {
            await this.diskCache.clear();
        }
        this.lruCache.clear();
    }
}
class DiskCache {
    cacheDir;
    maxAge;
    fileModificationTimes = new Map();
    constructor(cacheDir, maxAge) {
        this.cacheDir = cacheDir;
        this.maxAge = maxAge;
    }
    async ensureCacheDir() {
        await fs.mkdir(this.cacheDir, { recursive: true });
    }
    getFilePath(key) {
        return path.join(this.cacheDir, `${key}.json`);
    }
    async get(key) {
        if (await this.has(key)) {
            try {
                const data = await fs.readFile(this.getFilePath(key), 'utf8');
                return JSON.parse(data);
            }
            catch (error) {
                const err = error;
                if (err.code === 'ENOENT') {
                    return null;
                }
                throw err;
            }
        }
        else {
            return null;
        }
    }
    async isFresh(key) {
        if (!this.fileModificationTimes.has(key)) {
            const fileStats = await fs.stat(this.getFilePath(key)), modifiedTime = fileStats.mtimeMs;
            this.fileModificationTimes.set(key, modifiedTime);
        }
        const currentTime = clock.nowMillis(), modifiedTime = this.fileModificationTimes.get(key), modifiedSecondsAgo = (currentTime - modifiedTime) / 1000;
        return modifiedSecondsAgo <= this.maxAge;
    }
    async has(key) {
        try {
            await fs.access(this.getFilePath(key));
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async set(key, value) {
        await this.ensureCacheDir();
        const currentValue = await this.get(key);
        if (deepEquals(value, currentValue)) {
            log.debug(`Disk cache value for key [${key}] is unchanged, skipping write`);
            return false;
        }
        else {
            await fs.writeFile(this.getFilePath(key), JSON.stringify(value));
            this.fileModificationTimes.set(key, clock.nowMillis());
            return true;
        }
    }
    async remove(key) {
        try {
            await fs.unlink(this.getFilePath(key));
        }
        catch (error) {
            const err = error;
            if (err.code !== 'ENOENT') {
                throw err;
            }
        }
    }
    async clear() {
        try {
            const files = await fs.readdir(this.cacheDir);
            await Promise.all(files.filter(f => f.endsWith('.json'))
                .map(f => fs.unlink(path.join(this.cacheDir, f))));
        }
        catch (error) {
            throw new Error(`Failed to clear disk cache: ${error.message}`);
        }
    }
}
//# sourceMappingURL=cache.mjs.map