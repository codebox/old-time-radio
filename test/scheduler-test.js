"use strict";

let shows, playlists, showIndexes, parsedNames, timeNow;

const proxyquire = require('proxyquire'),
    scheduler = proxyquire('../src/scheduler.js', {
        './channelData.js': {
            getShows(){
                return shows;
            }
        },
        './playlistData.js': {
            getPlaylist(name) {
                return playlists[name];
            }
        },
        './channelCodes.js': {
            buildShowIndexesFromChannelCode(channelCodeOrName) {
                return showIndexes[channelCodeOrName];
            }
        },
        './nameParser.js': {
            parseName(playlistName, fileMetadata) {
                return `parsed_${fileMetadata.name}_${playlistName}`;
            }
        },
        './clock.js': {
            now() {
                return timeNow;
            }
        }
    });

describe("schedule", () => {
    let schedule;

    beforeEach(() => {
        shows = [];
        playlists = {};
        showIndexes = {};
        timeNow = 1595199600; // 2020-07-20 00:00:00
    });

    function givenAShow(name, channels, index, playlists) {
        shows.push({channels, index, name, playlists});
    }

    function givenAPlaylist(name, server, dir, files) { // files: [{name, length}]
        playlists[name] = {server, dir, files};
    }

    function givenTimeOffsetIs(offset) {
        timeNow += offset;
    }

    function thenScheduleUrlsAre(...expectedUrls) {
        expect(schedule.list.map(o => o.url)).toEqual(expectedUrls);
    }

    function thenScheduleOffsetIs(expectedOffset) {
        expect(schedule.initialOffset).toBe(expectedOffset);
    }

    fdescribe("getScheduleForChannel", () => {
        beforeEach(() => {
            givenAPlaylist('playlist1', 'server1', 'dir1', [
                {name: 'p1_1', length: 30 * 60},
                {name: 'p1_2', length: 10 * 60},
                {name: 'p1_3', length: 20 * 60}
            ]);
            givenAPlaylist('playlist2', 'server2', 'dir2', [
                {name: 'p2_1', length: 5 * 60},
                {name: 'p2_2', length: 5 * 60},
                {name: 'p2_3', length: 5 * 60},
                {name: 'p2_4', length: 5 * 60}
            ]);
            givenAPlaylist('playlist3', 'server3', 'dir3', [
                {name: 'p3_1', length: 60 * 60},
                {name: 'p3_2', length: 1 * 60},
                {name: 'p3_3', length: 60 * 60},
                {name: 'p3_4', length: 1 * 60}
            ]);
            givenAPlaylist('playlist4', 'server4', 'dir4', [
                {name: 'p4_1', length: 1 * 60},
                {name: 'p4_2', length: 2 * 60},
                {name: 'p4_3', length: 3 * 60},
                {name: 'p4_3', length: 4 * 60},
                {name: 'p4_3', length: 5 * 60},
                {name: 'p4_3', length: 6 * 60}
            ]);
            givenAPlaylist('playlist5', 'server5', 'dir5', [
                {name: 'p5_1', length: 30 * 60},
                {name: 'p5_2', length: 30 * 60},
                {name: 'p5_3', length: 30 * 60}
            ]);
            givenAPlaylist('playlist6', 'server6', 'dir6', [
                {name: 'p6_1', length: 20 * 60},
                {name: 'p6_2', length: 25 * 60},
                {name: 'p6_3', length: 35 * 60}
            ]);
        });

        describe("Single Channel", () => {
            it("Zero offset, matching duration", () => {
                givenAShow('show1', ['channel1'], 0, ['playlist1']);
                givenTimeOffsetIs(0);

                schedule = scheduler.getScheduleForChannel('channel1', 60 * 60);

                thenScheduleUrlsAre('https://server1/dir1/p1_1', 'https://server1/dir1/p1_2', 'https://server1/dir1/p1_3');
                thenScheduleOffsetIs(0);
            });

            it("Zero offset, duration shorter", () => {
                givenAShow('show1', ['channel1'], 0, ['playlist1']);
                givenTimeOffsetIs(0);

                schedule = scheduler.getScheduleForChannel('channel1', 50 * 60);

                thenScheduleUrlsAre('https://server1/dir1/p1_1', 'https://server1/dir1/p1_2', 'https://server1/dir1/p1_3');
                thenScheduleOffsetIs(0);
            });

            it("Zero offset, duration longer", () => {
                givenAShow('show1', ['channel1'], 0, ['playlist1']);
                givenTimeOffsetIs(0);

                schedule = scheduler.getScheduleForChannel('channel1', 70 * 60);

                thenScheduleUrlsAre('https://server1/dir1/p1_1', 'https://server1/dir1/p1_2', 'https://server1/dir1/p1_3', 'https://server1/dir1/p1_1');
                thenScheduleOffsetIs(0);
            });

            it("Small offset", () => {
                givenAShow('show1', ['channel1'], 0, ['playlist1']);
                givenTimeOffsetIs(20 * 60);

                schedule = scheduler.getScheduleForChannel('channel1', 60 * 60);

                thenScheduleUrlsAre('https://server1/dir1/p1_1', 'https://server1/dir1/p1_2', 'https://server1/dir1/p1_3', 'https://server1/dir1/p1_1');
                thenScheduleOffsetIs(20 * 60);
            });

            it("Larger offset", () => {
                givenAShow('show1', ['channel1'], 0, ['playlist1']);
                givenTimeOffsetIs(50 * 60);

                schedule = scheduler.getScheduleForChannel('channel1', 60 * 60);

                thenScheduleUrlsAre('https://server1/dir1/p1_3', 'https://server1/dir1/p1_1', 'https://server1/dir1/p1_2', 'https://server1/dir1/p1_3');
                thenScheduleOffsetIs(10 * 60);
            });

            it("Large offset", () => {
                givenAShow('show1', ['channel1'], 0, ['playlist1']);
                givenTimeOffsetIs(60 * 60 + 20 * 60);

                schedule = scheduler.getScheduleForChannel('channel1', 60 * 60);

                thenScheduleUrlsAre('https://server1/dir1/p1_1', 'https://server1/dir1/p1_2', 'https://server1/dir1/p1_3', 'https://server1/dir1/p1_1');
                thenScheduleOffsetIs(20 * 60);
            });
        });
    });

});
