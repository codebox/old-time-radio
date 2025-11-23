import { WebClient } from "./webClient.mjs";
import { log } from "./log.mjs";
import { config } from './config.mjs';
export class ArchiveOrg {
    webClient;
    constructor() {
        this.webClient = new WebClient(config.webClients.archiveOrg);
    }
    async get(playlistId) {
        const url = `https://archive.org/metadata/${playlistId}`;
        try {
            log.debug(`Fetching ${url}...`);
            return await this.webClient.get(url);
        }
        catch (err) {
            throw new Error(`Failed to fetch ${url}: ${err}`);
        }
    }
}
export const archiveOrg = new ArchiveOrg();
//# sourceMappingURL=archiveOrg.mjs.map