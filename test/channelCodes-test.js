"use strict";
const channelCodes = require('../src/channelCodes.js');

describe("channelCodes", () => {
    describe("buildChannelCodeFromShowIndexes", () => {
        function expectIndexes(indexes) {
            return {
                toGiveCode(expectedCode) {
                    expect(channelCodes.buildChannelCodeFromShowIndexes(indexes)).toBe(expectedCode);
                },
                toThrowError(msg) {
                    expect(() => channelCodes.buildChannelCodeFromShowIndexes(indexes)).toThrowError(msg);
                }
            };
        }

        it("gives correct codes for valid indexes", () => {
            expectIndexes([]).toGiveCode('0');
            expectIndexes([0]).toGiveCode('1');
            expectIndexes([1]).toGiveCode('2');
            expectIndexes([0,1]).toGiveCode('3');
            expectIndexes([1,0]).toGiveCode('3');
            expectIndexes([0,1,0,0,1]).toGiveCode('3');
            expectIndexes([0,1,2,3,4,5]).toGiveCode('_');
            expectIndexes([0,1,2,3,4,5,6]).toGiveCode('_1');
            expectIndexes([200]).toGiveCode('0000000000000000000000000000000004');
            expectIndexes([0,10,100,200]).toGiveCode('1g00000000000000g00000000000000004');
        });

        it("ignores invalid values", () => {
            expectIndexes(['not a number']).toGiveCode('0');
            expectIndexes([true, false, -Infinity, undefined, 0, '', 1, 'x', null, NaN]).toGiveCode('3');
        });

        it("throws error if index is too large", () => {
            expectIndexes([201]).toThrowError('Index is too large: 201');
            expectIndexes([Infinity]).toThrowError('Index is too large: Infinity');
        });
    });

    describe("buildShowIndexesFromChannelCode", () => {
        function expectCode(code) {
            return {
                toGiveIndexes(expectedIndexes) {
                    expect(channelCodes.buildShowIndexesFromChannelCode(code)).toEqual(expectedIndexes);
                },
                toThrowError(msg) {
                    expect(() => channelCodes.buildShowIndexesFromChannelCode(code)).toThrowError(msg);
                }
            };
        }

        it("gives correct indexes for valid codes", () => {
            expectCode('').toGiveIndexes([]);
            expectCode('0').toGiveIndexes([]);
            expectCode('1').toGiveIndexes([0]);
            expectCode('2').toGiveIndexes([1]);
            expectCode('3').toGiveIndexes([0,1]);
            expectCode('_').toGiveIndexes([0,1,2,3,4,5]);
            expectCode('_1').toGiveIndexes([0,1,2,3,4,5,6]);
            expectCode('0000000000000000000000000000000004').toGiveIndexes([200]);
            expectCode('1g00000000000000g00000000000000004').toGiveIndexes([0,10,100,200]);
        });

        it("throws error if code contains invalid values", () => {
            expectCode('1%2').toThrowError("Invalid character in channel code: '%'");
            expectCode(' 12').toThrowError("Invalid character in channel code: ' '");
            expectCode(' ').toThrowError("Invalid character in channel code: ' '");
        });

    });

});
