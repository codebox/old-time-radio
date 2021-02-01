function addSpacesBeforeCapitals(txt) {
    "use strict";
    return txt.replace('_','').replace(/([A-Z])/g, ' $1').replace(/([^0-9])([0-9])/g, '$1 $2').trim();
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
        regex: /Dragnet_([-0-9]+)_ep([0-9]+)_(.*).mp3/i,
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
        regex: /Philip_Marlowe_([-0-9]+)_(ep)?([0-9]+)_([A-Za-z0-9_]+).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                number = match[3],
                title = match[4].replace(/_/g, ' ');
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
    },
    {
        ids: ['TheAdventuresOfSuperman_201805'],
        regex: /([-0-9 )]+)(.*).mp3/i,
        getName(match) {
            "use strict";
            let title = match[2];
            if (!title.includes(' ')) {
                title = addSpacesBeforeCapitals(title);
            }
            return `The Adventures of Superman - ${title}`;
        }
    },
    {
        ids: ['OTRR_Boston_Blackie_Singles'],
        regex: /BostonBlackie([-0-9]+)([0-9]{3})(.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = addSpacesBeforeCapitals(match[3]),
                number = match[2];
            return `Boston Blackie - Episode ${number}: ${title} [${date}]`;
        }
    },
    {
        ids: ['OTRR_Falcon_Singles'],
        regex: /TheFalcon([-0-9]{8})([0-9]{3})Tcot(.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = addSpacesBeforeCapitals(match[3]),
                number = match[2];
            return `The Falcon - Episode ${number}: ${title} [${date}]`;
        }
    },
    {
        ids: ['OTRR_Falcon_Singles'],
        regex: /The Falcon ([-0-9]+) \(([0-9]{3})\) (.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = match[3].replace('TCOT ', ''),
                number = match[2];
            return `The Falcon - Episode ${number}: ${title} [${date}]`;
        }
    },
    {
        ids: ['OTRR_X_Minus_One_Singles'],
        regex: /XMinusOne([-0-9]{8})([0-9]{3})(.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = addSpacesBeforeCapitals(match[3]),
                number = match[2];
            return `X Minus One - Episode ${number}: ${title} [${date}]`;
        }
    },
    {
        ids: ['OTRR_Fort_Laramie_Singles'],
        regex: /Fort_Laramie_([-0-9]+)_ep([0-9]+)_(.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = match[3].replace(/_+/g, ' '),
                number = match[2];
            return `Fort Laramie - Episode ${number}: ${title} [${date}]`;
        }
    },
    {
        ids: ['TalesOfTheTexasRangers'],
        regex: /Texas_Rangers_([0-9_]+)_([0-9]+)_(.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = match[3].replace(/_+/g, ' '),
                number = match[2];
            return `Tales of the Texas Rangers - Episode ${number}: ${title} [${date}]`;
        }
    },
    {
        ids: ['OTRR_The_Six_Shooter_Singles'],
        regex: /([-0-9]+) Ep ([0-9]+) (.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = match[3],
                number = match[2];
            return `The Six-Shooter - Episode ${number}: ${title} [${date}]`;
        }
    },
    {
        ids: ['OTRR_Molle_Mystery_Theatre_Singles'],
        regex: /Molle_([-0-9]+)_(.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = match[2].replace(/_+/g, ' ');
            return `Molle Mystery Theatre: ${title} [${date}]`;
        }
    },
    {
        ids: ['OTRR_Blue_Beetle_Singles'],
        regex: /BlueBeetle_([-0-9]+)_([-0-9]+)_(.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = addSpacesBeforeCapitals(match[3].replace('_Pt_','').replace('1-2','')),
                number = match[2];
            return `Blue Beetle - Episode ${number}: ${title} [${date}]`;
        }
    },
    {
        ids: ['PatNovakForHire'],
        regex: /([-0-9]+)-(.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = addSpacesBeforeCapitals(match[2]);
            return `Pat Novak For Hire: ${title} [${date}]`;
        }
    },
    {
        ids: ['OTRR_Planet_Man_Ver2_Singles'],
        regex: /Planet_Man_50-xx-xx_ep([0-9]+)_(.*).mp3/i,
        getName(match) {
            "use strict";
            const title = match[2].replace(/_+/g, ' '),
                number = match[1];
            return `Planet Man - Episode ${number}: ${title}`;
        }
    },
    {
        ids: ['OTRR_Mystery_House_Singles'],
        regex: /MysteryHouse([-0-9]{8})([0-9]+)(.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = addSpacesBeforeCapitals(match[3]),
                number = match[2];
            return `Mystery House - Episode ${number}: ${title} [${date}]`;
        }
    },
    {
        ids: ['otr_2000Plus'],
        regex: /([-0-9]+)_([0-9]+)-(.*)2000Plus-(.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = addSpacesBeforeCapitals(match[4]),
                number = match[2];
            return `2000 Plus - Episode ${number}: ${title} [${date}]`;
        }
    },
    {
        ids: ['Exploring_Tomorrow'],
        regex: /ET_([-0-9]+)_([0-9]+)_(.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = match[3].replace(/_+/g, ' '),
                number = match[2];
            return `Exploring Tomorrow - Episode ${number}: ${title} [${date}]`;
        }
    },
    {
        ids: ['OurMissBrooks'],
        regex: /Omb([-0-9]+)([0-9]{3})(.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = addSpacesBeforeCapitals(match[3]),
                number = match[2];
            return `Our Miss Brooks - Episode ${number}: ${title} [${date}]`;
        }
    },
    {
        ids: ['Great_Gildersleeve'],
        regex: /gild.([0-9\.]+)_(.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = match[2].replace(/_+/g, ' ');
            return `The Great Gildersleeves - ${title} [${date}]`;
        }
    },
    {
        ids: ['OTRR_Harold_Peary_Show_Singles'],
        regex: /Harold_Peary_([-0-9]+)_ep([0-9]+)_(.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = match[3].replace(/_+/g, ' '),
                number = match[2];
            return `The Harold Peary Show - Episode ${number}: ${title} [${date}]`;
        }
    },
    {
        ids: ['OTRR_Jack_Benny_Singles_1932-1934'],
        regex: /JB ([-0-9]+) (.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = match[2].replace(/_+/g, ' ');
            return `Jack Benny - ${title} [${date}]`;
        }
    },
    {
        ids: ['OTRR_Harris_Faye_Singles'],
        regex: /PhilHarris([-0-9]{8})([0-9]+)(.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = addSpacesBeforeCapitals(match[3]),
                number = match[2];
            return `The Phil Harris-Alice Faye Show ${number}: ${title} [${date}]`;
        }
    },
    {
        ids: ['FibberMcgeeAndMollyHq'],
        regex: /([0-9]+)-([0-9]+)-(.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = addSpacesBeforeCapitals(match[3]),
                number = match[2];
            return `Fibber McGee and Molly HQ - Episode ${number}: ${title} [${date}]`;
        }
    },
    {
        ids: ['otr_escape'],
        regex: /Escape.([0-9\.]+)_(.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = match[2].replace(/_/g, ' ');
            return `Escape - ${title} [${date}]`;
        }
    },
    {
        ids: ['otr_escape'],
        regex: /esca_([0-9]+)_(.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = addSpacesBeforeCapitals(match[2]);
            return `Escape - ${title} [${date}]`;
        }
    },
    {
        ids: ['TheLivesOfHarryLime'],
        regex: /Harry_Lime_([-0-9]+)_([0-9]+)_(.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = match[3].replace(/_/g, ' '),
                number = match[2];
            return `The Lives of Harry Lime ${number} - ${title} [${date}]`;
        }
    },
    {
        ids: ['TheSaintVincentPriceOTR'],
        regex: /The_Saint_([0-9]+)_(.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = match[2].replace(/_/g, ' ');
            return `The Saint - ${title} [${date}]`;
        }
    },
    {
        ids: ['OTRR_Broadway_Is_My_Beat_Singles'],
        regex: /BIMB ([-0-9]+) \(([0-9]+)\) (.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = match[3],
                number = match[2];
            return `Broadway Is My Beat ${number} - ${title} [${date}]`;
        }
    },
    {
        ids: ['BoldVenture57Episodes'],
        regex: /BoldVenture([0-9]{6})([0-9]{2})(.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = addSpacesBeforeCapitals(match[3]),
                number = match[2];
            return `BoldVenture ${number} - ${title} [${date}]`;
        }
    },
    {
        ids: ['OTRR_Inner_Sanctum_Mysteries_Singles'],
        regex: /Inner Sanctum +([-0-9]+) (.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = match[2];
            return `Inner Sanctum Mysteries - ${title} [${date}]`;
        }
    },
    {
        ids: ['LightsOutoldTimeRadio'],
        regex: /LightsOut-([-0-9]+)(.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = addSpacesBeforeCapitals(match[2]);
            return `Lights Out - ${title} [${date}]`;
        }
    },
    {
        ids: ['TheMysteriousTraveler'],
        regex: /([-0-9]{8})([0-9]{3})(.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = addSpacesBeforeCapitals(match[3]),
                number = match[2];
            return `The Mysterious Traveler ${number} - ${title} [${date}]`;
        }
    },
    {
        ids: ['otr_abbottandcostello'],
        regex: /([0-9]{6})(_-)?_([A-Za-z].*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = match[3].replace(/_/g, ' ').trim();
            return `Abbott and Costello - ${title} [${date}]`;
        }
    },
    {
        ids: ['OTRR_New_Adventures_of_Nero_Wolfe_Singles'],
        regex: /nanw_([-0-9]+)_ep([0-9]+)_(.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = match[3].replace(/_/g, ' '),
                number = match[2];
            return `New Adventures of Nero Wolfe ${number} - ${title} [${date}]`;
        }
    },
    {
        ids: ['OTRR_Black_Museum_Singles'],
        regex: /BlackMuseum-([0-9]+)-(.*).mp3/i,
        getName(match) {
            "use strict";
            const title = addSpacesBeforeCapitals(match[2]),
                number = match[1];
            return `The Black Museum ${number} - ${title}`;
        }
    },
    {
        ids: ['MyFavoriteHusband'],
        regex: /My_Favorite_Husband_([_0-9]{8})_(.{4})_(.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = match[3].replace(/_/g, ' '),
                number = match[2];
            return `My Favorite Husband ${number} - ${title} [${date}]`;
        }
    },
    {
        ids: ['CommandPerformance'],
        regex: /CP_([-0-9]*)_ep(.{3})-(.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = match[3].replace(/__/g, ', ').replace(/_/g, ' '),
                number = match[2];
            return `Command Performance ${number} - ${title} [${date}]`;
        }
    },
    {
        ids: ['OTRR_Whistler_Singles'],
        regex: /Whistler_([-0-9]*)_ep([0-9]{3})_(.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = match[3].replace(/_/g, ' '),
                number = match[2];
            return `The Whistler ${number} - ${title} [${date}]`;
        }
    },
    {
        ids: ['OTRR_Calling_All_Cars_Singles'],
        regex: /Calling_All_Cars_([-0-9]+)_ep([0-9]{3})_(.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = match[3].replace(/_/g, ' '),
                number = match[2];
            return `Calling All Cars ${number} - ${title} [${date}]`;
        }
    },
    {
        ids: ['OTRR_Weird_Circle_Singles'],
        regex: /Weird_Circle_4x-xx-xx_ep([0-9]{2})_?(.*).mp3/i,
        getName(match) {
            "use strict";
            const title = match[2].replace(/_/g, ' '),
                number = match[1];
            return `Weird Circle ${number} - ${title}`;
        }
    },
    {
        ids: ['The_Hermits_Cave'],
        regex: /HermitsCave_400000_([0-9]{2})_(.*).mp3/i,
        getName(match) {
            "use strict";
            const title = match[2].replace(/_/g, ' '),
                number = match[1];
            return `The Hermit's Cave ${number} - ${title}`;
        }
    },
    {
        ids: ['HopalongCassidy'],
        regex: /Hopalong_Cassidy_([0-9]{6})_([0-9]{4})_(.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = match[3].replace(/_/g, ' '),
                number = match[2];
            return `Hopalong Cassidy ${number} - ${title} [${date}]`;
        }
    },
    {
        ids: ['CBSMTFantasy1', 'cbsmtfs2', 'cbsmtfs3', 'cbsmtfs4', 'cbsmtfs5', 'cbsmtfs6', 'cbsmtfs7', 'cbsmtfs8'],
        regex: /([0-9]{2})(.*).mp3/i,
        getName(match) {
            "use strict";
            const title = addSpacesBeforeCapitals(match[2]);
            return `CBS Radio Mystery Theater - ${title}`;
        }
    },
    {
        ids: ['theoldonesarehardtokill_20191104_1301'],
        regex: /([0-9]+)\.(.*).mp3/i,
        getName(match) {
            "use strict";
            const title = match[2].trim();
            return `CBS Radio Mystery Theater - ${title}`;
        }
    },
    {
        ids: ['CbsRadioMysteryTheater1975Page1'],
        regex: /Cbsrmt([0-9]{6})([0-9]+)(.*)(_wuwm)(.*).mp3/i,
        getName(match) {
            "use strict";
            const title = addSpacesBeforeCapitals(match[3]);
            return `CBS Radio Mystery Theater - ${title}`;
        }
    },
    {
        ids: ['CbsRadioMysteryTheater1976Page1', 'CbsRadioMysteryTheater1976Page2', 'CbsRadioMysteryTheater1976Page3', 'CbsRadioMysteryTheater1976Page4', 'CbsRadioMysteryTheater1976Page5'],
        regex: /Cbsrmt([0-9]{6})([0-9]+)(.*).mp3/i,
        getName(match) {
            "use strict";
            const title = addSpacesBeforeCapitals(match[3]);
            return `CBS Radio Mystery Theater - ${title}`;
        }
    },
    {
        ids: ['OTRR_Richard_Diamond_Private_Detective_Singles'],
        regex: /Richard Diamond ([-0-9]{8}) \(([0-9]+)\) (.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = match[3],
                number = match[2];
            return `Richard Diamond, Private Detective ${number} - ${title} [${date}]`;
        }
    },
    {
        ids: ['OTRR_Ranger_Bill_Singles'],
        regex: /Ranger_Bill_(.{8})_ep([0-9x]{3})_(.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                hasDate = (date !== 'xx-xx-xx'),
                title = match[3].replace(/_/g, ' '),
                number = match[2],
                hasNumber = (number !== 'xxx');

            return `Ranger Bill ${hasNumber ? number + ' ' : ''}- ${title}${hasDate ? ' [' + date + ']' : ''}`;
        }
    },
    {
        ids: ['OTRR_Let_George_Do_It_Singles'],
        regex: /LGDI - \[HSG_Synd.#([0-9]+)\] - (.*).mp3/i,
        getName(match) {
            "use strict";
            const title = match[2],
                number = match[1];

            return `Let George Do It ${number} - ${title}`;
        }
    },
    {
        ids: ['OTRR_Let_George_Do_It_Singles'],
        regex: /LGDI (.{8}) \(([0-9]{3})\) (.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = match[3],
                number = match[2];

            return `Let George Do It ${number} - ${title} [${date}]`;
        }
    },
    {
        ids: ['FatherKnowsBest45Episodes'],
        regex: /Fkb([-0-9]{10})([0-9]{3})(.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = addSpacesBeforeCapitals(match[3]),
                number = match[2];

            return `Father Knows Best ${number} - ${title} [${date}]`;
        }
    },
    {
        ids: ['OTRR_Secrets_Of_Scotland_Yard_Singles'],
        regex: /SecretsOfScotlandYard(.{8})_(.{3})_(.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = addSpacesBeforeCapitals(match[3]),
                number = match[2];

            return `Secrets of Scotland Yard - ${title}`;
        }
    },
    {
        ids: ['OTRR_Mr_District_Attorney_Singles'],
        regex: /Mr_District_Attorney_(.{8})_(.{3})_(.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                hasDate = !date.includes('x'),
                title = match[3].replace(/_/g, ' '),
                number = match[2],
                hasNumber = !number.includes('x');

            return `Mr District Attorney ${hasNumber ? number + ' ' : ''}- ${title}${hasDate ? ' [' + date + ']' : ''}`;
        }
    },
    {
        ids: ['TheLifeOfRiley'],
        regex: /Lor([-0-9]{10})([0-9]{3})(.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = addSpacesBeforeCapitals(match[3]),
                number = match[2];

            return `The Life of Riley ${number} - ${title} [${date}]`;
        }
    },
    {
        ids: ['OTRR_Lux_Radio_Theater_Singles'],
        regex: /LuxRadioTheatre([-0-9]{8})([0-9]+)(.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = addSpacesBeforeCapitals(match[3]),
                number = match[2];

            return `Lux Radio Theatre ${number} - ${title} [${date}]`;
        }
    },
    {
        ids: ['OTRR_Lux_Radio_Theater_Singles'],
        regex: /Lux_Radio_Theatre_([-0-9]{8})_([0-9]+R?)_(.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = match[3].replace(/_/g, ' '),
                number = match[2];

            return `Lux Radio Theatre ${number} - ${title} [${date}]`;
        }
    },
    {
        ids: ['otr_campbellplayhouse'],
        regex: /([0-9]{6})_(.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = addSpacesBeforeCapitals(match[2]);

            return `Campbell Playhouse - ${title} [${date}]`;
        }
    },
    {
        ids: ['otr_campbellplayhouse'],
        regex: /CampbellPlayhouse([-0-9]{8})(.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = addSpacesBeforeCapitals(match[2]);

            return `Campbell Playhouse - ${title} [${date}]`;
        }
    },
    {
        ids: ['otr_campbellplayhouse'],
        regex: /([a-zA-Z]+).mp3/i,
        getName(match) {
            "use strict";
            const title = addSpacesBeforeCapitals(match[1]);

            return `Campbell Playhouse - ${title}`;
        }
    },
    {
        ids: ['OrsonWelles-MercuryTheater-1938Recordings'],
        regex: /MercuryTheater([-0-9]{8})(.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = addSpacesBeforeCapitals(match[2]);

            return `Mercury Theatre - ${title} [${date}]`;
        }
    },
    {
        ids: ['OTRR_On_Stage_Singles_201901'],
        regex: /On Stage ([-0-9]{8}) \(([0-9]+)\) (.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = match[3],
                number = match[2];

            return `On Stage ${number} - ${title} [${date}]`;
        }
    },
    {
        ids: ['ScreenGuildTheater'],
        regex: /Sgt_([-0-9]{8})_ep([0-9]+)_(.*).mp3/i,
        getName(match) {
            "use strict";
            const date = match[1],
                title = match[3].replace(/_/g, ' '),
                number = match[2];

            return `Screen Guild Theater ${number} - ${title} [${date}]`;
        }
    }
];

module.exports.parseName = (playlistId, metadata) => {
    "use strict";
    const matchingParsers = parsers.filter(p => p.ids.includes(playlistId));

    if (matchingParsers.length) {
        const matches = matchingParsers.map(parser => {
            if (parser.regex) {
                const match = metadata.name.match(parser.regex);
                if (match) {
                    return parser.getName(match);
                }

            } else {
                return parser.getName(metadata);
            }
        }).filter(o => o);
        if (matches.length) {
             // console.log(playlistId, 'OK', matches[0]);
            return matches[0];
        }
    }
     // console.log(playlistId, 'NOMATCH', metadata.name);
    return metadata.title || metadata.name;
};