import {WebServer} from "./webServer.mjs";
import {log} from "./log.mjs";

const webServer = new WebServer();

function updateArchiveOrgCache(){
    return Promise.resolve(); //TODO
}

updateArchiveOrgCache().then(() => {
    webServer.start();
});