import type {Millis, SiteMapXml, Url} from "./types.mjs";
import path from "path";
import fs from "fs/promises";
import {clock} from "./clock.mjs";
import {config} from "./config.mjs";
import {log} from "./log.mjs";
import {DataService} from "./dataService.mjs";

const SITEMAP_FILE_PATH = path.join(process.cwd(), 'public', 'sitemap.xml'),
    ENCODING = 'utf-8';

export class SiteMapService {
    private dataService: DataService;

    constructor(dataService: DataService) {
        this.dataService = dataService;
    }

    async getSitemapXml(): Promise<SiteMapXml> {
        try {
            const stats = await fs.stat(SITEMAP_FILE_PATH);
            const fileAgeInMs = clock.nowMillis() - stats.mtime.getTime() as Millis;
            const maxAgeInMs = config.sitemapMaxAgeHours * 60 * 60 * 1000 as Millis;

            if (fileAgeInMs < maxAgeInMs) {
                const existingContent = await fs.readFile(SITEMAP_FILE_PATH, ENCODING);
                return existingContent as SiteMapXml;
            }

        } catch (error) {
            // File doesn't exist, generate it
        }

        log.info(`Regenerating ${SITEMAP_FILE_PATH}...`);

        const shows = await this.dataService.getShows(),
            showsWithSummaries = shows.filter(show => show.hasSummaries),
            episodes = await Promise.all(showsWithSummaries.map(show => this.dataService.getEpisodesForShow(show.id)));

        const listenToUrls = shows.map(show => `${config.publicUrlPrefix}/listen-to/${show.id}` as Url),
            showUrls = showsWithSummaries.map(show => `${config.publicUrlPrefix}/episodes/${encodeURIComponent(show.id)}` as Url),
            episodeUrls = episodes.flat().flatMap(episode => `${config.publicUrlPrefix}/episode/${episode.id}` as Url),
            searchPageUrl = `${config.publicUrlPrefix}/search` as Url,
            urlElements = [searchPageUrl, ...listenToUrls, ...showUrls, ...episodeUrls].map(url => `<url><loc>${url}</loc></url>\n`);

        const xml = [
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
            ...urlElements,
            '</urlset>'
        ].join('') as SiteMapXml;

        try {
            await fs.writeFile(SITEMAP_FILE_PATH, xml, ENCODING);
            log.info(`${SITEMAP_FILE_PATH} generation complete.`);
        } catch (error) {
            log.error(`Error writing sitemap file: ${error}`);
        }

        return xml;
    }
}