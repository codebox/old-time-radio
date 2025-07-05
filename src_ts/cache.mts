import {promises as fs} from "fs";
import path from "path";
import { LRUCache } from 'lru-cache'
import {log} from "./log.mjs";
import type {Seconds} from "./clock.mjs";
import {config} from "./config.mjs";
import {clock, type Millis} from "./clock.mjs";
import {deepEquals} from "./utils.mjs";

export class Cache<K,V> {
    private cacheName: string;
    private diskCache: DiskCache<K,V>;
    private lruCache: LRUCache<K,V>;
    private fetch: (key: K) => Promise<V>;
    private isFresh: (key: K) => Promise<boolean>;

    constructor(cacheName: string, fetch: (key: K) => Promise<V>, maxItems: number, diskCacheMaxAge?: Seconds) {
        this.cacheName = cacheName;
        this.fetch = fetch;

        if (diskCacheMaxAge) {
            this.diskCache = new DiskCache<K,V>(path.join(config.caches.baseDirectory, cacheName), diskCacheMaxAge as Seconds);
            this.isFresh = key => this.diskCache.isFresh(key);

        } else {
            this.isFresh = () => Promise.resolve(true);
        }

        this.lruCache = new LRUCache<K,V>({
            max: maxItems,
            onInsert: (value, key) => {
                log.debug(`Added item for [${key}] to ${this.cacheName} memory cache`);
                if (this.diskCache) {
                    this.diskCache.set(key, value).then(didUpdate => {
                        if (didUpdate) {
                            log.debug(`Saved item for [${key}] to ${this.cacheName} disk cache`);
                        }
                    }).catch((error: { message: string; }) => {
                        log.error(`Failed to save item for [${key}] to ${this.cacheName} disk cache: ${error.message}`);
                    })
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
            if (!await this.isFresh(key as K)) {
                staleKeys.push(key as K);
            }
        }

        log.debug(`Found ${staleKeys.length} stale items in ${this.cacheName} cache`);
        for (const key of staleKeys) {
            log.debug(`Refetching stale item for key [${key}] in ${this.cacheName} cache`);
            try {
                const newValue = await this.fetch(key);
                this.lruCache.set(key, newValue);

            } catch (error) {
                log.error(`Failed to refetch item for key [${key}] in ${this.cacheName} cache: ${(error as Error).message}`);
            }
        }
    }

    async get(key: K): Promise<V> {
        if (this.lruCache.has(key)) {
            log.debug(`Cache hit for key [${key}] in ${this.cacheName} memory cache`);
            return this.lruCache.get(key);

        } else if (this.diskCache) {
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

    async set(key: K, value: V) {
        log.debug(`Setting value for key [${key}] in ${this.cacheName} cache`);
        this.lruCache.set(key, value);
    }

    async remove(key: K) {
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

class DiskCache<K,V> {
    private cacheDir: string;
    private maxAge: Seconds;
    private fileModificationTimes: Map<K, Millis> = new Map();

    constructor(cacheDir: string, maxAge: Seconds) {
        this.cacheDir = cacheDir;
        this.maxAge = maxAge;
    }

    private async ensureCacheDir() {
        await fs.mkdir(this.cacheDir, { recursive: true });
    }

    private getFilePath(key: K) {
        return path.join(this.cacheDir, `${key}.json`);
    }

    async get(key: K): Promise<V> {
        if (await this.has(key)) {
            try {
                const data = await fs.readFile(this.getFilePath(key), 'utf8');
                return JSON.parse(data);
            } catch (error) {
                const err = error as NodeJS.ErrnoException;
                if (err.code === 'ENOENT') {
                    return null;
                }
                throw err;
            }
        } else {
            return null;
        }
    }

    async isFresh(key: K): Promise<boolean> {
        if (!this.fileModificationTimes.has(key)) {
            const fileStats = await fs.stat(this.getFilePath(key)),
                modifiedTime = fileStats.mtimeMs as Millis;

            this.fileModificationTimes.set(key, modifiedTime);
        }

        const currentTime = clock.nowMillis() as Millis,
            modifiedTime = this.fileModificationTimes.get(key) as Millis,
            modifiedSecondsAgo = (currentTime - modifiedTime) / 1000 as Seconds;

        return modifiedSecondsAgo <= this.maxAge;
    }

    async has(key: K): Promise<boolean> {
        try {
            await fs.access(this.getFilePath(key));
            return true;
        } catch (error) {
            return false;
        }
    }

    async set(key: K, value: V) {
        await this.ensureCacheDir();
        const currentValue = await this.get(key);
        if (deepEquals(value, currentValue)) {
            log.debug(`Disk cache value for key [${key}] is unchanged, skipping write`);
            return false;
        } else {
            await fs.writeFile(this.getFilePath(key), JSON.stringify(value));
            this.fileModificationTimes.set(key, clock.nowMillis());
            return true;
        }
    }

    async remove(key: K) {
        try {
            await fs.unlink(this.getFilePath(key));
        } catch (error) {
            const err = error as NodeJS.ErrnoException;
            if (err.code !== 'ENOENT') {
                throw err;
            }
        }
    }

    async clear() {
        try {
            const files = await fs.readdir(this.cacheDir);
            await Promise.all(
                files.filter(f => f.endsWith('.json'))
                    .map(f => fs.unlink(path.join(this.cacheDir, f)))
            );
        } catch (error) {
            throw new Error(`Failed to clear disk cache: ${(error as Error).message}`);
        }
    }
}