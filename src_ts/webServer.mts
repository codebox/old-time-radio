import express from "express";
import {config} from "./config.mjs";
import {log} from "./log.mjs";


export class WebServer {
    private app: express.Application;

    constructor() {
        this.app = express();
    }

    private setupEndpointHandlers() {
        this.app.use((req, res, next) => {
            log.debug(`Request: ${req.method} ${req.path}`);
            next();
        });

        this.app.use(express.static(config.web.paths.static));

        this.app.use(config.web.paths.listenTo, express.static(config.web.paths.static));

        this.app.get(`${config.web.paths.listenTo}/:show`, (req, res) => {
            res.sendFile('public/index.html',{root:'./'});
        });

// [{channels:["future"], index: 1, isCommercial: false, name: "X Minus One"}, ...]
        this.app.get(config.web.paths.api.shows, (req, res) => {

        });

// ["future", "action", ...]
        this.app.get(config.web.paths.api.channels, (req, res) => {

        });

// {initialOffset: 123.456, list: [{archivalUrl: "http://...", length: 1234.56, name: "X Minus One - Episode 079", url: "http://...", commercial: false}, ...]}
        this.app.get(config.web.paths.api.channel + ':channel', (req, res) => {

        });

// "1g0000g000000"
        this.app.get(config.web.paths.api.generate + ":indexes", (req, res) => {

        });

// [{channelId: 'action', initialOffset: 123.456, list: [{archivalUrl: "http://...", length: 1234.56, name: "X Minus One - Episode 079", url: "http://...", commercial: false}, ...]}, ...]
        this.app.get(config.web.paths.api.playingNow, (req, res) => {

        });

        this.app.get("/sitemap.xml", (req, res) => {

        });

        // this.app.use((error, req, res, next) => {
        //
        // });
    }

    start() {

    }
}