function addSpacesBeforeCapitals(txt) {
    "use strict";
    return txt.replace('_','').replace(/([A-Z])/g, ' $1').trim();
}
function toTitleCase(txt) {
    return txt
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.substr(1))
        .join(' ');
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
    },
    {
        ids: ['Dragnet_OTR'],
        regex: /Dragnet_([-0-9]+)_ep([0-9]+)_([A-Za-z0-9_]+).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = match[3].replace(/_/g, ' '),
                number = match[2];
            return `Dragnet - Episode ${number}: ${title} [${date}]`;
        }
    },
    {
        ids: ['Speed_Gibson_Of_The_International_Secret_Police'],
        getName(metadata) {
            "use strict";
            return `Speed Gibson of the International Secret Police - Episode ${metadata.title}`;
        }
    },
    {
        ids: ['OTRR_Dark_Fantasy_Singles'],
        regex: /Dark Fantasy ([-0-9]+) \(([0-9]+)\) (.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = match[3],
                number = match[2];
            return `Dark Fantasy - Episode ${number}: ${title} [${date}]`;
        }
    },
    {
        ids: ['otr_iloveamystery'],
        regex: /([-0-9]+)_([A-Za-z0-9]+)_(.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = addSpacesBeforeCapitals(match[2]);
            return `I Love a Mystery - ${title} [${date}]`;
        }
    },
    {
        ids: ['SUSPENSE', 'SUSPENSE2', 'SUSPENSE3', 'SUSPENSE4', 'SUSPENSE5', 'SUSPENSE6', 'SUSPENSE7', 'SUSPENSE8', 'SUSPENSE9', 'SUSPENSE_FINAL'],
        regex: /([-0-9]+)(.*).MP3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = addSpacesBeforeCapitals(match[2].replace(/_/g,''));
            return `Suspense - ${title} [${date}]`;
        }
    },
    {
        ids: ['OTRR_Philip_Marlowe_Singles'],
        regex: /Philip_Marlowe_([-0-9]+)_ep([0-9]+)_([A-Za-z0-9_]+).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                number = match[2],
                title = match[3].replace(/_/g, ' ');
            return `The Adventures of Philip Marlowe - Episode ${number}: ${title} [${date}]`;
        }
    },
    {
        ids: ['sherlockholmes_otr'],
        getName(metadata) {
            "use strict";
            return `The New Adventures of Sherlock Holmes - ${metadata.title}`;
        }
    },
    {
        ids: ['GUNSMOKE01', 'GUNSMOKE02', 'GUNSMOKE03', 'GUNSMOKE04', 'GUNSMOKE05'],
        regex: /Gunsmoke_([-0-9]+)_(.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = match[2].replace(/_/g, ' ');
            return `Gunsmoke - ${title} [${date}]`;
        }
    },
    {
        ids: ['The_Lone_Ranger_Page_01', 'The_Lone_Ranger_Page_02', 'The_Lone_Ranger_Page_03'],
        getName(metadata) {
            "use strict";
            const match = metadata.name.match(/Lone_Ranger_([-0-9]+)_ep([0-9]+)_(.*).mp3/i);

            if (match) {
                const date = match[1],
                    title = match[3].replace(/_/g, ' ');
                return `The Lone Ranger - ${title} [${date}]`;
            } else {
                return `The Lone Ranger - ${metadata.title}`;
            }
        }
    },
    {
        ids: ['HaveGunWillTravel_OldTimeRadio'],
        regex: /HaveGunWillTravel([0-9]+)(.*).mp3/i,
        getName(match) {
            "use strict";
            const title = addSpacesBeforeCapitals(match[2].replace('64kb', ''));
            return `Have Gun, Will Travel - ${title}`;
        }
    },
    {
        ids: ['Tarzan1951'],
        regex: /TARZ.([\.0-9]+)_(.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = toTitleCase(match[2].replace(/_+/g, ' '));
            return `Tarzan - ${title} [${date}]`;
        }
    },
    {
        ids: ['OTRR_Tarzan_Singles_TotA'],
        regex: /([0-9]+) ([0-9]+) (.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                number = match[2],
                title = match[3];
            return `Tarzan of the Apes ${number} - ${title} [${date}]`;
        }
    },
    {
        ids: ['Old_Radio_Adverts_01'],
        getName() {
            "use strict";
            return `Commercial`;
        }
    }
];

module.exports.parseName = (showId, metadata) => {
    "use strict";
    const parser = parsers.find(p => p.ids.includes(showId));

    if (parser) {
        if (parser.regex) {
            const match = metadata.name.match(parser.regex);
            if (match) {
                return parser.getName(match);
            }

        } else {
            return parser.getName(metadata);
        }
    }
    return metadata.title || metadata.name;
};