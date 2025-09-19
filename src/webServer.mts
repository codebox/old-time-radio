import express from "express";
import {config} from "./config.mjs";
import {log} from "./log.mjs";
import {Service} from "./service.mjs";
import type {ChannelId, SearchText, ShowId} from "./types.mjs";
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

        this.app.use(config.web.paths.search, (req, res) => {
            res.sendFile('public/search.html', {root:'./'});
        });

        this.app.get(`${config.web.paths.listenTo}/:show`, (req, res) => {
            res.sendFile('public/index.html', {root:'./'});
        });

        this.app.get(config.web.paths.api.shows, (req, res) => {
            this.service.getShows().then((shows) => {
                res.json(shows);
            }).catch((err) => {
                log.error(`Error fetching shows: ${err}`, err);
                res.status(500).send('Internal Server Error');
            })
        });

        this.app.get(config.web.paths.api.channels, (req, res) => {
            this.service.getChannels().then((channelIds) => {
                res.json(channelIds);
            }).catch((err) => {
                log.error(`Error fetching channels: ${err}`, err);
                res.status(500).send('Internal Server Error');
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
            }).catch((err) => {
                log.error(`Error fetching schedule for channel ${channelId}: ${err}`, err);
                res.status(500).send('Internal Server Error');
            });
        });

        this.app.get(config.web.paths.api.generate + ":ids", (req, res) => {
            const ids = req.params.ids.split(',').map(s => Number(s)) as ShowId[];
            try{
                res.status(200).json(this.service.getCodeForShowIds(ids));
            } catch (err: any) {
                log.error(`Error generating channel code for ids ${ids}: ${err}`, err);
                res.status(400).send('Invalid show IDs');
            }
        });

        this.app.get(config.web.paths.api.playingNow, (req, res) => {
            const channels = (req.query.channels as string || '').split(',').filter(c => c) as ChannelId[];
            this.service.getPlayingNowAndNext(channels)
                .then(result => res.status(200).json(result))
                .catch(err => {
                    log.error(`Error fetching playing now and next for channels ${channels}: ${err}`, err);
                    res.status(500).send('Internal Server Error');
                });
        });

        this.app.get(config.web.paths.api.search + ':searchText', (req, res) => {
            const searchText = req.params.searchText as SearchText;
            if (searchText.length < 3) {
                res.status(400).send('Search text must be at least 3 characters');
                return;
            }
            this.service.search(searchText).then((results) => {
                res.json(results);
            }).catch((err) => {
                log.error(`Error searching: ${err}`, err);
                res.status(500).send('Internal Server Error');
            })
        });

        this.app.get("/sitemap.xml", (req, res) => {
            this.service.getSitemapXml().then(xml => {
                res.set('Content-Type', 'text/xml');
                res.send(xml);
            }).catch(err => {
                log.error(`Error generating sitemap: ${err}`, err);
                res.status(500).send('Internal Server Error');
            });
        });
    }

    start() {
        this.setupEndpointHandlers();
        this.app.listen(config.web.port, () => {
            log.info(`Initialisation complete, listening on port ${config.web.port}...`);
        });
    }
}