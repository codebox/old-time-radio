const config = require('../config.json'),
    log = require('./log.js'),
    service = require('./service.js'),
    express = require('express'),
    app = express();

const port = config.web.port;

app.use((req, res, next) => {
    "use strict";
    log.debug(`Request: ${req.method} ${req.path}`);
    next();
});

app.use(express.static(config.web.paths.static));

app.get(config.web.paths.api.shows, (req, res) => {
    "use strict";
    res.status(200).json(service.getShows());
});

app.get(config.web.paths.api.channels, (req, res) => {
    "use strict";
    res.status(200).json(service.getChannels());
});


app.get(config.web.paths.api.channel + ':channel', (req, res) => {
    const channelId = req.params.channel,
        length = req.query.length,
        schedule = service.getScheduleForChannel(channelId, length);

    if (schedule) {
        res.status(200).json(schedule);
    } else {
        res.status(400).send('Unknown channel');
    }
});

app.get(config.web.paths.api.generate + ":indexes", (req, res) => {
    "use strict";
    const indexes = req.params.indexes.split(',').map(s => Number(s));
    res.status(200).json(service.getCodeForShowIndexes(indexes));
});

app.use((error, req, res, next) => {
    "use strict";
    log.error(error.stack);
    res.status(500).json({'error':''})
});

app.listen(port, () => log.info(`Initialisation complete, listening on port ${port}...`));
