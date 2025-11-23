import express from "express";
import {config, configHelper} from "./config.mjs";
import {log} from "./log.mjs";
import {Service} from "./service.mjs";
import type {
    ChannelId,
    EpisodeId,
    EpisodeName,
    OtrDataEpisodeId, OtrDocument,
    PlaylistId,
    SearchText, ShortEpisodeSummary,
    ShowId,
    ShowName, Url
} from "./types.mjs";
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

        this.app.set('view engine', 'ejs')

        this.app.use(express.static(config.web.paths.static));

        this.app.use(config.web.paths.listenTo, express.static(config.web.paths.static));

        this.app.get(config.web.paths.search, (req, res) => {
            const exampleSearch = configHelper.getRandomSearchExample(),
                goodMatchThreshold = config.search.goodMatchThreshold;
            res.render('search', { searchText: undefined, goodMatchThreshold, exampleSearch });
        });

        this.app.get(`${config.web.paths.search}/:searchText`, (req, res) => {
            const searchText = req.params.searchText as SearchText,
                exampleSearch = configHelper.getRandomSearchExample(),
                goodMatchThreshold = config.search.goodMatchThreshold;
            res.render('search', { searchText, goodMatchThreshold, exampleSearch });
        });

        this.app.get(config.web.paths.shows, (req, res) => {
            this.service.getShowsForSearch().then(showCounts => {
                const links = Object.entries(showCounts).map(([showName, episodeCount]) => ({
                    text: `${showName} (${episodeCount})`,
                    url: `${config.web.paths.episodes}/${encodeURIComponent(showName)}`
                }));
                links.sort((a, b) => a.text.localeCompare(b.text));
                res.render('shows', { links });
            })
        });

        this.app.get(`${config.web.paths.episodes}/:show`, (req, res) => {
            const showName = req.params.show as ShowName;
            this.service.getEpisodesForShow(showName).then(episodes => {
                const episodeSummaries = episodes.map(ep => ({
                    id: ep.id,
                    show: '',
                    episode: ep.episode,
                    summary: ep.summarySmall,
                    url: ep.url,
                    similarity: 1
                }));
                res.render('episodes', { episodes: episodeSummaries, showName });
            })
        });

        this.app.get(`${config.web.paths.episode}/:episodeId`, (req, res) => {
            const episodeId = req.params.episodeId as OtrDataEpisodeId;
            this.service.getEpisodeDetails(episodeId).then(otrDocument => {
                res.render('episode', {episode: otrDocument});
            })
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
                res.render('partials/episode-summaries', {summaries: results});
            }).catch((err) => {
                log.error(`Error searching: ${err}`, err);
                res.status(500).send("Sorry, search isn't working at the moment");
            })
        });

        this.app.get(`${config.web.paths.api.episode}/:episodeId`, (req, res) => {
            const episodeId = req.params.episodeId as OtrDataEpisodeId;
            this.service.getEpisodeDetails(episodeId).then((otrDocument) => {
                res.render('partials/episode-details', { document: otrDocument });
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