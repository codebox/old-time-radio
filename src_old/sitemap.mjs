import { config } from "./config.mjs";
import * as fs from "fs/promises";
import * as path from "path";
import { log } from "./log.mjs";
import { otrData } from "./otrData.mjs";
import { clock } from "./clock.mjs";
const SITEMAP_FILE_PATH = path.join(process.cwd(), 'public', 'sitemap.xml'), ENCODING = 'utf-8';
export async function getSitemapXml(shows) {
    "use strict";
    try {
        const stats = await fs.stat(SITEMAP_FILE_PATH);
        const fileAgeInMs = clock.nowMillis() - stats.mtime.getTime();
        const maxAgeInMs = config.sitemap.maxAgeHours * 60 * 60 * 1000;
        if (fileAgeInMs < maxAgeInMs) {
            const existingContent = await fs.readFile(SITEMAP_FILE_PATH, ENCODING);
            return existingContent;
        }
    }
    catch (error) {
        // File doesn't exist, generate it
    }
    log.info(`Regenerating ${SITEMAP_FILE_PATH}...`);
    const otrDataShows = Object.keys(await otrData.getShows()), episodes = await Promise.all(otrDataShows.map(showName => otrData.getEpisodeDetailsForShow(showName)));
    const listenToUrls = shows.map(show => `${config.web.paths.publicUrlPrefix}${config.web.paths.listenTo}/${show.descriptiveId}`), showUrls = otrDataShows.map(showName => `${config.web.paths.publicUrlPrefix}${config.web.paths.episodes}/${encodeURIComponent(showName)}`), episodeUrls = episodes.flat().flatMap(episode => `${config.web.paths.publicUrlPrefix}${config.web.paths.episode}/${episode.id}`), searchPageUrl = `${config.web.paths.publicUrlPrefix}${config.web.paths.search}`, urlElements = [searchPageUrl, ...listenToUrls, ...showUrls, ...episodeUrls].map(url => `<url><loc>${url}</loc></url>\n`);
    const xml = [
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...urlElements,
        '</urlset>'
    ].join('');
    try {
        await fs.writeFile(SITEMAP_FILE_PATH, xml, ENCODING);
        log.info(`${SITEMAP_FILE_PATH} generation complete.`);
    }
    catch (error) {
        log.error(`Error writing sitemap file: ${error}`);
    }
    return xml;
}
//# sourceMappingURL=sitemap.mjs.map