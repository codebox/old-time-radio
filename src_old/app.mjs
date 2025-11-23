import { WebServer } from "./webServer.mjs";
import { config, configHelper } from "./config.mjs";
import { shows } from "./shows.mjs";
import { log } from "./log.mjs";
import { scheduler } from "./scheduler.mjs";
const webServer = new WebServer();
function updateCaches() {
    log.debug("Updating caches...");
    return Promise.all(configHelper.getShows().map(show => shows.getEpisodesForShow(show.id)))
        .then(() => shows.refetchStaleItems())
        .then(() => scheduler.clearCache())
        .then(() => log.debug("shows cache updated successfully"))
        .catch(error => log.error(`Error updating shows cache: ${error.message}`));
}
setInterval(updateCaches, config.caches.showsCacheRefetchIntervalHours * 60 * 60 * 1000);
updateCaches().then(() => {
    webServer.start();
});
//# sourceMappingURL=app.mjs.map