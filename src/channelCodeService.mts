import type {ChannelCode, ShowIndex} from "./types.mjs";

const TOO_BIG_ID = 200,
    SHOWS_PER_CHAR = 6,
    CHAR_MAP = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_';

function numToString(n: number) {
    console.assert(n<64, n.toString());
    return CHAR_MAP.charAt(n);
}

function stringToNum(s: string) {
    console.assert(s.length === 1, s);
    const n = CHAR_MAP.indexOf(s);
    if (n < 0) {
        throw new Error(`Invalid character in channel code: '${s}'`);
    }
    return n;
}

export class ChannelCodeService {
    getCodeForShowIndexes(showIndexes: ShowIndex[]): ChannelCode {
        const numericIds = showIndexes.map(Number).filter(n=>!isNaN(n)),
            uniqueNumericIds = new Set(numericIds);

        const maxId = numericIds.length ? Math.max(...numericIds) : 0;
        if (maxId > TOO_BIG_ID) {
            throw new Error('Id is too large: ' + maxId);
        }
        const groupTotals = new Array(Math.ceil((maxId+1) / SHOWS_PER_CHAR)).fill(0);

        for (let i=0; i <= maxId; i++) {
            const groupIndex = Math.floor(i / SHOWS_PER_CHAR);
            if (uniqueNumericIds.has(i)) {
                groupTotals[groupIndex] += Math.pow(2, i - groupIndex * SHOWS_PER_CHAR);
            }
        }
        return groupTotals.map(numToString).join('') as ChannelCode;
    }

    getShowIndexesFromCode(channelCode: ChannelCode) {
        const numbers: number[] = [];
        channelCode.split('').forEach((c, charIndex) => {
            const num = stringToNum(c);
            numbers.push(...[num & 1, num & 2, num & 4, num & 8, num & 16, num & 32].map((n,i) => n ? i + charIndex * SHOWS_PER_CHAR : null).filter(n => n !== null));
        });
        return numbers as ShowIndex[];
    }

}