import {WebServer} from "./webServer.mjs";

const webServer = new WebServer();

function updateArchiveOrgCache(){
    return Promise.resolve(); //TODO
}

updateArchiveOrgCache().then(() => {
    webServer.start();
});