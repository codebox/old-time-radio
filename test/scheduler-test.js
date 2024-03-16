"use strict";

let shows, playlists, showIndexes, timeNow;

const proxyquire = require('proxyquire'),
    scheduler = proxyquire('../src/scheduler.js', {
        './configHelper.js': {
            getShows(){
                return shows;
            }
        },
        './cache.js': {
            memoize(fn){
                return fn;
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

    function givenAShow(name, channels, index, playlists, isCommercial=false) {
        shows.push({channels, index, name, playlists, isCommercial});
    }

    function givenAPlaylist(name, server, dir, files) { // files: [{name, length}]
        playlists[name] = files.map(f => {
            const url = `https://${server}/${dir}/${f.name}`;
            return {
                archivalUrl: url + '/archive',
                length: f.length,
                commercial: false,
                name: f.name,
                url
            };
        });
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

    describe("getScheduleForChannel", () => {
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
                {name: 'p4_4', length: 4 * 60},
                {name: 'p4_5', length: 5 * 60},
                {name: 'p4_6', length: 6 * 60}
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

        describe("Single Show", () => {
            it("Zero offset, duration exactly matches playlist length", async () => {
                givenAShow('show1', ['channel1'], 0, ['playlist1']);
                givenTimeOffsetIs(0);

                schedule = await scheduler.getScheduleForChannel('channel1', 60 * 60);

                thenScheduleUrlsAre('https://server1/dir1/p1_1', 'https://server1/dir1/p1_2', 'https://server1/dir1/p1_3');
                thenScheduleOffsetIs(0);
            });

            it("Zero offset, duration shorter than playlist length", async () => {
                givenAShow('show1', ['channel1'], 0, ['playlist1']);
                givenTimeOffsetIs(0);

                schedule = await scheduler.getScheduleForChannel('channel1', 50 * 60);

                thenScheduleUrlsAre('https://server1/dir1/p1_1', 'https://server1/dir1/p1_2', 'https://server1/dir1/p1_3');
                thenScheduleOffsetIs(0);
            });

            it("Zero offset, duration longer than playlist length", async () => {
                givenAShow('show1', ['channel1'], 0, ['playlist1']);
                givenTimeOffsetIs(0);

                schedule = await scheduler.getScheduleForChannel('channel1', 70 * 60);

                thenScheduleUrlsAre('https://server1/dir1/p1_1', 'https://server1/dir1/p1_2', 'https://server1/dir1/p1_3', 'https://server1/dir1/p1_1');
                thenScheduleOffsetIs(0);
            });

            it("Offset within first show", async () => {
                givenAShow('show1', ['channel1'], 0, ['playlist1']);
                givenTimeOffsetIs(20 * 60);

                schedule = await scheduler.getScheduleForChannel('channel1', 60 * 60);

                thenScheduleUrlsAre('https://server1/dir1/p1_1', 'https://server1/dir1/p1_2', 'https://server1/dir1/p1_3', 'https://server1/dir1/p1_1');
                thenScheduleOffsetIs(20 * 60);
            });

            it("Offset within later show", async () => {
                givenAShow('show1', ['channel1'], 0, ['playlist1']);
                givenTimeOffsetIs(50 * 60);

                schedule = await scheduler.getScheduleForChannel('channel1', 60 * 60);

                thenScheduleUrlsAre('https://server1/dir1/p1_3', 'https://server1/dir1/p1_1', 'https://server1/dir1/p1_2', 'https://server1/dir1/p1_3');
                thenScheduleOffsetIs(10 * 60);
            });

            it("Offset wraps whole playlist", async () => {
                givenAShow('show1', ['channel1'], 0, ['playlist1']);
                givenTimeOffsetIs(60 * 60 + 20 * 60);

                schedule = await scheduler.getScheduleForChannel('channel1', 60 * 60);

                thenScheduleUrlsAre('https://server1/dir1/p1_1', 'https://server1/dir1/p1_2', 'https://server1/dir1/p1_3', 'https://server1/dir1/p1_1');
                thenScheduleOffsetIs(20 * 60);
            });
        });

        describe("Multiple Shows", () => {
            it("interleaved correctly", async () => {
                givenAShow('show1', ['channel1'], 0, ['playlist1', 'playlist2']); // 7 items, 80 mins
                givenAShow('show2', ['channel1'], 1, ['playlist3']); // 4 items, 122 mins

                schedule = await scheduler.getScheduleForChannel('channel1', (80 + 122) * 60);

                thenScheduleUrlsAre(
                    'https://server1/dir1/p1_1',
                    'https://server3/dir3/p3_1',
                    'https://server1/dir1/p1_2',
                    'https://server1/dir1/p1_3',
                    'https://server3/dir3/p3_2',
                    'https://server2/dir2/p2_1',
                    'https://server2/dir2/p2_2',
                    'https://server3/dir3/p3_3',
                    'https://server2/dir2/p2_3',
                    'https://server2/dir2/p2_4',
                    'https://server3/dir3/p3_4');
                thenScheduleOffsetIs(0);
            });

            it("commercials added correctly", async () => {
                givenAShow('show1', ['channel1'], 0, ['playlist1', 'playlist2']);
                givenAShow('show2', ['channel1'], 1, ['playlist3']);
                givenAShow('show3', ['channel1'], 2, ['playlist4'], true);

                schedule = await scheduler.getScheduleForChannel('channel1', (80 + 122) * 60);

                thenScheduleUrlsAre(
                    'https://server1/dir1/p1_1',
                    'https://server4/dir4/p4_1',
                    'https://server3/dir3/p3_1',
                    'https://server4/dir4/p4_2',
                    'https://server1/dir1/p1_2',
                    'https://server4/dir4/p4_3',
                    'https://server1/dir1/p1_3',
                    'https://server4/dir4/p4_4',
                    'https://server3/dir3/p3_2',
                    'https://server4/dir4/p4_5',
                    'https://server2/dir2/p2_1',
                    'https://server4/dir4/p4_6',
                    'https://server2/dir2/p2_2',
                    'https://server4/dir4/p4_1',
                    'https://server3/dir3/p3_3')
                thenScheduleOffsetIs(0);
            });

            fit("show balanced correctly", async () => {//1-3 2-4 3-4 4-6 5-3 6-3
                givenAShow('show1', ['channel1'], 0, ['playlist1', 'playlist2', 'playlist3', 'playlist4']); // 17 items
                givenAShow('show2', ['channel1'], 1, ['playlist5']); // 3 items

                schedule = await scheduler.getScheduleForChannel('channel1', (223 + 180) * 60);
console.log(schedule.list.map(s => s.url))
                thenScheduleUrlsAre(
                    'https://server1/dir1/p1_1',
                    'https://server1/dir1/p1_2',
                    'https://server5/dir5/p5_1',
                    'https://server1/dir1/p1_3',
                    'https://server2/dir2/p2_1',
                    'https://server2/dir2/p2_2',
                    'https://server5/dir5/p5_2',
                    'https://server2/dir2/p2_3',
                    'https://server2/dir2/p2_4',
                    'https://server3/dir3/p3_1',
                    'https://server5/dir5/p5_3',
                    'https://server3/dir3/p3_2',
                    'https://server3/dir3/p3_3',
                    'https://server3/dir3/p3_4',
                    'https://server5/dir5/p5_1', // playlist 5 is repeated
                    'https://server4/dir4/p4_1',
                    'https://server4/dir4/p4_2',
                    'https://server4/dir4/p4_3',
                    'https://server5/dir5/p5_2',
                    'https://server4/dir4/p4_4',
                    'https://server4/dir4/p4_5',
                    'https://server4/dir4/p4_6',
                    'https://server5/dir5/p5_3'
                );
                thenScheduleOffsetIs(0);
            });

        });

    });

});
