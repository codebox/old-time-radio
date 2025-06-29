import {WebServer} from "./webServer.mjs";
import {config, configHelper} from "./config.mjs";
import {shows} from "./shows.mjs";

const webServer = new WebServer();

function prepopulateCaches(){
    return Promise.all(configHelper.getShows().map(show => shows.getEpisodesForShow(show.id))).then(() => {
        shows.refetchStaleItems();
    });
}

prepopulateCaches().then(() => {
    webServer.start();
});