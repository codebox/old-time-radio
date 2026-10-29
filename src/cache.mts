import {promises as fs} from "fs";
import * as path from "path";
import { LRUCache } from 'lru-cache'
import {log} from "./log.mjs";
import {config} from "./config.mjs";
import {deepEquals} from "./utils.mjs";
import type {Millis, Seconds} from "./types.mjs";
import {clock} from "./clock.mjs";

export class Cache<K,V> {
    private cacheName: string;
    private diskCache: DiskCache<K,V>;
    private lruCache: LRUCache<K,V>;
    private fetch: (key: K) => Promise<V>;
    private isFresh: (key: K) => Promise<boolean>;
    private pendingFetches: Map<K, Promise<V>> = new Map();

    constructor(cacheName: string, fetch: (key: K) => Promise<V>, maxItems: number, diskCacheMaxAge?: Seconds) {
        this.cacheName = cacheName;
        this.fetch = fetch;

        if (diskCacheMaxAge) {
            this.diskCache = new DiskCache<K,V>(path.join(config.cacheBaseDir, cacheName), diskCacheMaxAge as Seconds);
            this.isFresh = key => this.diskCache.isFresh(key);

        } else {
            this.isFresh = () => Promise.resolve(true);
        }

        this.lruCache = new LRUCache<K,V>({
            max: maxItems,
            dispose: (value, key, reason) => {
                log.debug(`Disposing item for [${key}] from ${this.cacheName} cache, reason=${reason}`);
            },
        });
    }

    /* Saves a freshly-fetched value to the disk cache (fire-and-forget). Deliberately NOT done for
    values that were loaded from the disk cache itself - re-saving those would bump their timestamps
    and make stale entries look fresh. */
    private persist(key: K, value: V) {
        if (this.diskCache) {
            this.diskCache.set(key, value).then(didUpdate => {
                if (didUpdate) {
                    log.debug(`Saved item for [${key}] to ${this.cacheName} disk cache`);
                }
            }).catch((error: { message: string; }) => {
                log.error(`Failed to save item for [${key}] to ${this.cacheName} disk cache: ${error.message}`);
            })
        }
    }

    /* Fetches a new value for the key and stores it in the cache. Concurrent calls for the same key
    share a single fetch rather than each triggering their own. */
    private fetchAndStore(key: K): Promise<V> {
        let pending = this.pendingFetches.get(key);
        if (!pending) {
            pending = this.fetch(key)
                .then(newValue => {
                    this.lruCache.set(key, newValue);
                    this.persist(key, newValue);
                    return newValue;
                })
                .finally(() => this.pendingFetches.delete(key));
            this.pendingFetches.set(key, pending);
        }
        return pending;
    }

    /* Kicks off a background refresh of a stale entry. The stale value continues to be served until
    the refresh completes; if the refresh fails the stale value keeps being served and we try again
    on the next access. */
    private refreshStaleItem(key: K) {
        log.debug(`Cached value for key [${key}] in ${this.cacheName} cache is stale, refreshing in background`);
        this.fetchAndStore(key).catch((error: Error) => {
            log.warn(`Failed to refresh stale item for key [${key}] in ${this.cacheName} cache, continuing to serve stale value: ${error.message}`);
        });
    }

    async get(key: K): Promise<V> {
        if (this.lruCache.has(key)) {
            log.debug(`Cache hit for key [${key}] in ${this.cacheName} memory cache`);
            if (!await this.isFresh(key)) {
                this.refreshStaleItem(key);
            }
            return this.lruCache.get(key);

        } else if (this.diskCache) {
            if (await this.diskCache.has(key)) {
                log.debug(`Cache hit for key [${key}] in ${this.cacheName} disk cache`);
                const value = await this.diskCache.get(key);
                this.lruCache.set(key, value);
                if (!await this.isFresh(key)) {
                    this.refreshStaleItem(key);
                }
                return value;
            }
        }

        log.debug(`${this.cacheName} cache miss for key [${key}], fetching new value`);
        return this.fetchAndStore(key);
    }

    async set(key: K, value: V) {
        log.debug(`Setting value for key [${key}] in ${this.cacheName} cache`);
        this.lruCache.set(key, value);
        this.persist(key, value);
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
            try {
                const fileStats = await fs.stat(this.getFilePath(key)),
                    modifiedTime = fileStats.mtimeMs as Millis;

                this.fileModificationTimes.set(key, modifiedTime);
            } catch (error) {
                // no disk file yet (e.g. the first write is still in flight) - the value must
                // have been fetched very recently so treat it as fresh
                return true;
            }
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
            // the entry was still refreshed, so bump its timestamps - otherwise an entry whose
            // refetched value happens to be identical would look permanently stale
            const now = clock.nowMillis(),
                timestamp = new Date(now);
            this.fileModificationTimes.set(key, now);
            await fs.utimes(this.getFilePath(key), timestamp, timestamp);
            return false;
        } else {
            await fs.writeFile(this.getFilePath(key), JSON.stringify(value));
            this.fileModificationTimes.set(key, clock.nowMillis());
            return true;
        }
    }

    async remove(key: K) {
        this.fileModificationTimes.delete(key);
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
        this.fileModificationTimes.clear();
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