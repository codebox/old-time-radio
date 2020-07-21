const buildChannelManager = require('../src/channel.js').buildChannelManager;
const urlPrefixes = ['http://myserver.com/otr/'];

function file(name, length) {
    "use strict";
    return {file: name, length};
}

const SHOWS = [
    {
        id: 's1',
        files: [file('s1f1',20), file('s1f2',30), file('s1f3',15), file('s1f4',15)],
        urlPrefixes
    },
    {
        id: 's2',
        files: [file('s2f1',15), file('s2f2',1), file('s2f3',9)],
        urlPrefixes
    },
    {
        id: 's3',
        files: [file('s3f1',400), file('s3f2',10)],
        urlPrefixes
    },
    {
        id: 's4',
        files: [file('s4f1',10)],
        urlPrefixes
    }
],
    CHANNEL_ID = 'myChannel';

describe("channel", () => {
    let timeOffset = 0,
        playlistLength = 60 * 60,
        channelManager;

    function givenPlaylistLength(seconds) {
        "use strict";
        playlistLength = seconds;
    }
    function givenTimeOffset(seconds) {
        "use strict";
        timeOffset = seconds;
    }
    function initChannelManager() {
        "use strict";
        channelManager = buildChannelManager({
            now() {
                return timeOffset + 1595199600;
            }
        }, playlistLength);
        channelManager.addChannel(CHANNEL_ID, SHOWS);
    }
    function assertPlaylist(offset, items) {
        "use strict";
        const playlist = channelManager.getPlaylist(CHANNEL_ID);
        expect(playlist.list).toEqual(items.map(a => {
            return {url: `http://myserver.com/otr/${a[0]}`, length: a[1]};
        }));
        expect(playlist.initialOffset).toBe(offset);
    }

    it("returns correct playlist if no offset", function() {
        givenPlaylistLength(525);
        givenTimeOffset(0);
        initChannelManager();

        assertPlaylist(0, [
            ['s1f1', 20], ['s2f1', 15], ['s1f2', 30], ['s3f1', 400], ['s2f2', 1],
            ['s1f3', 15], ['s1f4', 15], ['s2f3', 9], ['s3f2', 10], ['s4f1', 10]]
        );
    });

    it("returns correct playlist if offset applies", function() {
        givenPlaylistLength(60);
        givenTimeOffset(10);
        initChannelManager();

        assertPlaylist(10, [
            ['s1f1', 20], ['s2f1', 15], ['s1f2', 30], ['s3f1', 400]]
        );
    });

    it("returns correct playlist if offset falls on start boundary", function() {
        givenPlaylistLength(400);
        givenTimeOffset(35);
        initChannelManager();

        assertPlaylist(0, [
            ['s1f2', 30], ['s3f1', 400]]
        );
    });

    it("returns correct playlist if length falls on end boundary", function() {
        givenPlaylistLength(431);
        givenTimeOffset(35);
        initChannelManager();

        assertPlaylist(0, [
            ['s1f2', 30], ['s3f1', 400], ['s2f2', 1]]
        );
    });

    it("returns correct playlist if single item covers whole duration", function() {
        givenPlaylistLength(100);
        givenTimeOffset(70);
        initChannelManager();

        assertPlaylist(5, [
            ['s3f1', 400]]
        );
    });

    it("returns correct playlist if wrap-around occurs", function() {
        givenPlaylistLength(526);
        givenTimeOffset(0);
        initChannelManager();

        assertPlaylist(0, [
            ['s1f1', 20], ['s2f1', 15], ['s1f2', 30], ['s3f1', 400], ['s2f2', 1],
            ['s1f3', 15], ['s1f4', 15], ['s2f3', 9], ['s3f2', 10], ['s4f1', 10],
            ['s1f1', 20]]
        );
    });

    it("returns correct playlist if offset applies and wrap-around occurs", function() {
        givenPlaylistLength(526);
        givenTimeOffset(70);
        initChannelManager();

        assertPlaylist(5, [
            ['s3f1', 400], ['s2f2', 1], ['s1f3', 15], ['s1f4', 15], ['s2f3', 9],
            ['s3f2', 10], ['s4f1', 10], ['s1f1', 20], ['s2f1', 15], ['s1f2', 30],
            ['s3f1', 400]]
        );
    });
});
