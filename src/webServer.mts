
import {config} from "./config.mjs";
import {log} from "./log.mjs";
import {Service} from "./service.mjs";
import express from "express";
import type {
    ApiChannelCodeGenerateResponse,
    ApiChannelScheduleResponse, ApiChannelsResponse, ApiPlayingNowResponse,
    ApiShowsResponse,
    ChannelId,
    EpisodeId,
    Seconds,
    ShowId,
    ShowName,
    SearchText, ShowNumber, SearchViewData, ShowsViewData, EpisodesViewData, EpisodeViewData, Episode,
    SearchResultsViewData
} from "./types.mjs";

export class WebServer {
    private app: express.Application;
    private service: Service;

    constructor() {
        this.app = express();
        this.service = new Service();
    }

    private setupEndpointHandlers() {
        this.app.set('view engine', 'ejs')

        this.app.use((req, res, next) => {
            log.debug(`Request: ${req.method} ${req.path}`);
            next();
        });

        this.app.use(express.static('public'));
        this.app.use("/listen-to", express.static('public'));

        this.app.get("/", async (req, res) => {
            res.render('index', {root:'./'});
        });

        this.app.get("/listen-to/:show", async (req, res) => {
            res.render('index', {root:'./'});
        });


        // Main site API calls
        this.app.get("/api/shows", async (req, res) => {
            const shows = await this.service.getShows(),
                response = shows as ApiShowsResponse;
            res.json(response);
        });

        this.app.get("/api/channels", async (req, res) => {
            const channels = await this.service.getChannelNames(),
                response = channels as ApiChannelsResponse;
            res.json(response);
        });

        this.app.get("/api/channel/:channel", async (req, res) => {
            const channelId = req.params.channel as ChannelId,
                length = Number(req.query.length) as Seconds,
                schedule = await this.service.getScheduleForChannel(channelId, length),
                response = schedule as ApiChannelScheduleResponse;

            res.json(response);
        });

        this.app.get("/api/channel/generate/:nums", async (req, res) => {
            const showNumbers = req.params.nums.split(',').map(s => Number(s)) as ShowNumber[],
                channelCode = await this.service.getChannelCodeForShowNumbers(showNumbers),
                response = channelCode as ApiChannelCodeGenerateResponse;
            //TODO validate showIds
            res.json(response);
        });

        this.app.get("/api/playing-now", async (req, res) => {
            const channelIds = (req.query.channels as string || '').split(',').filter(c => c) as ChannelId[],
                playingNowAndNext = await this.service.getPlayingNowAndNext(channelIds),
                response = playingNowAndNext as ApiPlayingNowResponse;

            res.json(response)
        });

        // Search pages
        this.app.get("/search", (req, res) => {
            const exampleSearch = config.getRandomSearchExample(),
                goodMatchThreshold = config.searchGoodMatchThreshold,
                viewData = {goodMatchThreshold, exampleSearch} as SearchViewData;

            res.render('search', viewData);
        });

        this.app.get("/search/:searchText", (req, res) => {
            const searchText = req.params.searchText as SearchText,
                exampleSearch = config.getRandomSearchExample(),
                goodMatchThreshold = config.searchGoodMatchThreshold,
                viewData = {searchText, goodMatchThreshold, exampleSearch} as SearchViewData;

            res.render('search', viewData);
        });

        this.app.get("/shows", async (req, res) => {
            const shows = await this.service.getShows(),
                links = shows.map(show => ({
                    text: `${show.name} (${show.episodeCount})`,
                    url: `/episodes/${show.id}`
                }));
            links.sort((a, b) => a.text.localeCompare(b.text));

            const viewData = { links } as ShowsViewData;

            res.render('shows', viewData);
        });

        function episodeToEpisodeViewData(episode: Episode): EpisodeViewData {
            return {
                id: episode.id,
                similarity: 1,
                show: episode.show,
                episode: episode.title,
                summary: episode.summarySmall
            } as EpisodeViewData;
        }

        this.app.get("/episodes/:show", async (req, res) => {
            const showId = req.params.show as ShowId,
                episodes = (await this.service.getEpisodesForShow(showId)).map(episodeToEpisodeViewData),
                showName = episodes[0].show,
                viewData = { episodes, showName } as EpisodesViewData;

            res.render('episodes', viewData);
        });

        this.app.get("/episode/:episodeId", async (req, res) => {
            const episodeId = req.params.episodeId as EpisodeId,
                episode = await this.service.getEpisode(episodeId),
                viewData = episodeToEpisodeViewData(episode);

            res.render('episode', viewData);
        });

        // Search API calls
        this.app.get("/api/search/:searchText", async (req, res) => {
            const searchText = req.params.searchText as SearchText;
            if (searchText.length < 3) {
                res.status(400).send('Search text must be at least 3 characters');
                return;
            }

            const searchResults = await this.service.search(searchText),
                summaries = searchResults.map(searchResult => ({
                    id: searchResult.id,
                    similarity: searchResult.similarity,
                    show: searchResult.metadata.show,
                    episode: searchResult.metadata.episode,
                    summary: searchResult.metadata.summary_small
                } as EpisodeViewData)),
                viewData = { summaries } as SearchResultsViewData;

            res.render('partials/episode-summaries', viewData);
        });

        this.app.get("/api/episode/:episodeId", async (req, res) => {
            const episodeId = req.params.episodeId as EpisodeId,
                episode = await this.service.getEpisode(episodeId),
                viewData = episodeToEpisodeViewData(episode);

            res.render('partials/episode-details', viewData);
        });

        this.app.get("/sitemap.xml", async (req, res) => {
            const siteMapXml = await this.service.getSitemapXml()

            res.set('Content-Type', 'text/xml');
            res.send(siteMapXml);
        });

    }

    start() {
        this.setupEndpointHandlers();
        this.app.listen(config.webPort, () => {
            log.info(`Initialisation complete, listening on port ${config.webPort}...`);
        });
    }
}