function addSpacesBeforeCapitals(txt) {
    "use strict";
    return txt.replace('_','').replace(/([A-Z])/g, ' $1').trim();
}

const parsers = [
    {
        ids: ['OTRR_Dimension_X_Singles'],
        regex: /Dimension_X_([-0-9]+)_+([0-9]+)_+(.*).mp3/,
        getName(match) {
            "use strict";
            const date = match[1],
                number = match[2],
                title = addSpacesBeforeCapitals(match[3]);
            return `Dimension X ${number} - ${title} [${date}]`;
        }
    },
    {
        ids: ['OTRR_Space_Patrol_Singles'],
        getName(metadata) {
            "use strict";
            return `Space Patrol - ${metadata.title}`;
        }
    },
    {
        ids:['SpaceCadet', 'SpaceCadet2'],
        regex: /([-0-9]+)_([A-Za-z0-9_]+).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = match[2].replace(/_/g, ' ').replace(' 64kb','');
            return `Tom Corbett, Space Cadet - ${title} [${date}]`;
        }
    },
    {
        ids: ['Flash_Gordon1935'],
        regex: /Flash_Gordon_([-0-9]+)_([0-9]+)_([A-Za-z_]+).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                number = match[2],
                title = match[3].replace(/_/g, ' ');
            return `Flash Gordon - Episode ${number}: ${title} [${date}]`;
        }
    },
    {
        ids: ['otr_buckrogers'],
        regex: /BuckRogers-Ep([0-9]+)-([-0-9]+).mp3/i,
        getName(match) {
            "use strict";
            const date = match[2],
                number = match[1];
            return `Buck Rogers - Episode ${number} [${date}]`;
        }
    },
    {
        ids: ['superman_otr'],
        regex: /Superman_([0-9]+)_([0-9]+)_([A-Za-z0-9_]+).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = match[3].replace(/_/g, ' '),
                number = match[2];
            return `The Adventures of Superman - Episode ${number}: ${title}... [${date}]`;
        }
    },
    {
        ids: ['TheGreenHornet'],
        regex: /Thegreenhornet-([0-9]{6})(.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = addSpacesBeforeCapitals(match[2]);
            return `The Green Hornet - ${title} [${date}]`;
        }
    }
];


function log(s) {
    "use strict";
    console.log(s)
    return s;
}
module.exports.parseName = (showId, metadata) => {
    "use strict";
    const parser = parsers.find(p => p.ids.includes(showId));

    if (parser) {
        if (parser.regex) {
            const match = metadata.name.match(parser.regex);
            if (match) {
                return log(parser.getName(match));
            }

        } else {
            return log(parser.getName(metadata));
        }
    }
    return metadata.title || metadata.name;
};