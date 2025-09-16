import {log} from "./log.mjs";
import {clock, type Millis} from "./clock.mjs";
import axios from 'axios';
import type {WebClientConfig} from "./types.mjs";

type WebRequest = {
    url: string;
    resolve: (data: any) => void;
    reject: (response: any) => void;
}

type RequestQueue = {
    push(url: string): Promise<{ [key: string]: any }>;
}

function buildRequestQueue(config: WebClientConfig) {
    const pendingRequests: WebRequest[] = [];
    let lastRequestMillis = 0 as Millis, running = false, interval;

    function ensureRequestProcessorIsRunning(){
        if (!running) {
            log.debug('Starting request processor');
            running = true;

            function processNext() {
                const nextRequestPermittedTs = lastRequestMillis + config.minRequestIntervalMillis as Millis,
                    timeUntilNextRequestPermitted = Math.max(0, nextRequestPermittedTs - clock.nowMillis()) as Millis;

                setTimeout(() => {
                    const {url, resolve, reject} = pendingRequests.shift();
                    log.debug(`Requesting ${url}...`);
                    axios.get(url)
                        .then(response => {
                            log.debug(`Request for ${url} succeeded: ${response.status} - ${response.statusText}`);
                            resolve(response.data)
                        })
                        .catch(response => {
                            log.error(`Request for ${url} failed: ${response.status} - ${response.statusText}`);
                            reject(response);
                        })
                        .finally(() => {
                            lastRequestMillis = clock.nowMillis();
                            if (pendingRequests.length === 0) {
                                log.debug('Request queue is empty, shutting down processor');
                                running = false;
                            } else {
                                processNext();
                            }
                        });
                }, timeUntilNextRequestPermitted);
            }

            processNext();
        }
    }

    return {
        push(url: string) {
            return new Promise((resolve, reject) => {
                pendingRequests.push({url, resolve, reject});
                ensureRequestProcessorIsRunning();
            });
        }
    };
}

export class WebClient {
    requestQueue: RequestQueue;

    constructor(config: WebClientConfig) {
        this.requestQueue = buildRequestQueue(config);
    }
    async get(url: string): Promise<{ [key: string]: any }> {
        return this.requestQueue.push(url);
    }
}