import express from "express";
import {config} from "./config.mjs";
import {log} from "./log.mjs";
import {Service} from "./service.mjs";
import type {ChannelId, ShowId} from "./types.mjs";
import type {Seconds} from "./clock.mjs";

export class WebServer {
    private app: express.Application;
    private service: Service;

    constructor() {
        this.app = express();
        this.service = new Service();
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

        this.app.get(config.web.paths.api.shows, (req, res) => {
            this.service.getShows().then((shows) => {
                res.json(shows);
            });
        });

        this.app.get(config.web.paths.api.channels, (req, res) => {
            this.service.getChannels().then((channelIds) => {
                res.json(channelIds);
            });
        });

        this.app.get(config.web.paths.api.channel + ':channel', (req, res) => {
            const channelId = req.params.channel as ChannelId,
                length = Number(req.query.length) as Seconds;
            this.service.getScheduleForChannel(channelId, length).then(schedule => {
                if (schedule) {
                    res.status(200).json(schedule);
                } else {
                    res.status(400).send('Unknown channel');
                }
            });
        });

        this.app.get(config.web.paths.api.generate + ":ids", (req, res) => {
            const ids = req.params.ids.split(',').map(s => Number(s)) as ShowId[];
            res.status(200).json(this.service.getCodeForShowIds(ids));
        });

        this.app.get(config.web.paths.api.playingNow, (req, res) => {
            const channels = (req.query.channels as string || '').split(',').filter(c => c) as ChannelId[];
            this.service.getPlayingNowAndNext(channels).then(result => res.status(200).json(result));
        });

        this.app.get("/sitemap.xml", (req, res) => {
            this.service.getSitemapXml().then(xml => {
                res.set('Content-Type', 'text/xml');
                res.send(xml);
            });
        });

        // this.app.use((error, req, res, next) => {
        //
        // });
    }

    start() {
        this.setupEndpointHandlers();
        this.app.listen(config.web.port, () => {
            log.info(`Initialisation complete, listening on port ${config.web.port}...`);
        });
    }
}