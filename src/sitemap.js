const config = require('../config.json');

module.exports.getSitemapXml = shows => {
    "use strict";
    const urlPrefix = config.web.paths.listenTo,
        urlElements = shows
            .map(show => show.descriptiveId)
            .map(id => `<url><loc>${urlPrefix}${id}</loc></url>`);

    return [
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...urlElements,
        '</urlset>'
    ].join('');
};