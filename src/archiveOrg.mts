import type {ArchiveOrgMetadata} from "./types.mjs";
import {WebClient} from "./webClient.mjs";
import {log} from "./log.mjs";

export class ArchiveOrg {
    private webClient: WebClient;

    constructor() {
        this.webClient = new WebClient();
    }

    async get(playlistId: string): Promise<ArchiveOrgMetadata> {
        const url = `https://archive.org/metadata/${playlistId}`;
        try {
            log.debug(`Fetching ${url}...`);
            return await this.webClient.get(url) as ArchiveOrgMetadata;
        } catch (err) {
            throw new Error(`Failed to fetch ${url}: ${err}`);
        }
    }

}

export const archiveOrg = new ArchiveOrg();