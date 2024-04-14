"use strict";

const log = require('./log.js');
const {configHelper} = require("./configHelper");

function addSpacesBeforeCapitals(txt) {
    return txt.replace('_','').replace(/([A-Z])/g, ' $1').replace(/([^0-9])([0-9])/g, '$1 $2').replace(/ +/g, ' ').trim();
}

function replaceUnderscores(txt) {
    return txt.replace(/_/g, ' ');
}

function capitalise(txt) {
    const skipWords = ['a', 'of', 'the', 'and', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from'];
    return txt.split(/\s+/).map((word, i) => {
        if (i !== 0 && skipWords.includes(word)) {
            return word;
        }
        return word.charAt(0).toUpperCase() + word.slice(1)
    }).join(' ');
}

function insertHyphens(txt) {
    const txtWithoutHyphens = txt.replace(/-/g, '');
    if (txtWithoutHyphens.length === 8) {
        return txtWithoutHyphens.substring(0, 4) + '-' + txtWithoutHyphens.substring(4, 6) + '-' + txtWithoutHyphens.substring(6, 8);
    }
    return txt;
}

function remove(txtToRemove) {
    return replace(txtToRemove, '');
}

function replace(txtToRemove, replacementText) {
    return txt => txt.replaceAll(txtToRemove, replacementText);
}

function toArray(value) {
    return Array.isArray(value) ? value : [value];
}

const nameConfig = [
    {
        playlistIds: 'OTRR_Dimension_X_Singles',
        regex: /Dimension_X_(?<date>[-0-9]+)_+(?<num>[0-9]+)_+(?<title>.*)/,
        transforms: {
            title: addSpacesBeforeCapitals
        }
    },
    {
        playlistIds: 'OTRR_Space_Patrol_Singles',
    },
    {
        playlistIds: ['SpaceCadet', 'SpaceCadet2'],
        regex: /(?<date>[-0-9]+)_(?<title>[A-Za-z0-9_]+)/,
        transforms: {
            title: [replaceUnderscores, remove(' 64kb')]
        }
    },
    {
        playlistIds: ['Flash_Gordon1935'],
        regex: /Flash_Gordon_(?<date>[-0-9]+)_(?<num>[0-9]+)_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores
        }
    },
    {
        playlistIds: ['otr_buckrogers'],
        regex: /BuckRogers-Ep(?<num>[0-9]+)-(?<title>[-0-9]+)/,
    },
    {
        playlistIds: ['TheGreenHornet'],
        regex: /Thegreenhornet-(?<date>[0-9]{6})(?<title>.*)/,
        transforms: {
            title: addSpacesBeforeCapitals
        }
    },
    {
        playlistIds: ['Dragnet_OTR'],
        regex: /Dragnet_(?<date>[-0-9]+)_ep(?<num>[0-9]+)_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores
        }
    },
    {
        playlistIds: ['Speed_Gibson_Of_The_International_Secret_Police'],
    },
    {
        playlistIds: ['OTRR_Dark_Fantasy_Singles'],
        regex: /Dark Fantasy (?<date>[-0-9]+) \((?<num>[0-9]+)\) (?<title>.*)/,
    },
    {
        playlistIds: ['otr_iloveamystery'],
        regex: /(?<date>[-0-9]+)_(?<title>[A-Za-z0-9]+)_(.*)/,
        transforms: {
            title: addSpacesBeforeCapitals
        }
    },
    {
        playlistIds: ['SUSPENSE', 'SUSPENSE2', 'SUSPENSE3'],
        regex: /(?<date>[-0-9]+)(?<title>.*)/,
        transforms: {
            title: [addSpacesBeforeCapitals, remove('_')]
        }
    },
    {
        playlistIds: ['OTRR_Philip_Marlowe_Singles'],
        regex: /Philip_Marlowe_(?<date>[-0-9]+)_(ep)?(?<num>[0-9]+)_(?<title>[A-Za-z0-9_]+)/,
        transforms: {
            title: replaceUnderscores
        }
    },
    {
        playlistIds: ['sherlockholmes_otr'],
    },
    {
        playlistIds: ['GUNSMOKE01', 'GUNSMOKE02', 'GUNSMOKE03', 'GUNSMOKE04', 'GUNSMOKE05'],
        regex: /Gunsmoke_(?<dater>[-0-9]+)_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores
        }
    },
    {
        playlistIds: ['The_Lone_Ranger_Page_01', 'The_Lone_Ranger_Page_02', 'The_Lone_Ranger_Page_03'],
        regex: /Lone_Ranger_(?<date>[-0-9]+)(.*?)[-_](?<title>.*)/,
        transforms: {
            title: replaceUnderscores
        }
    },
    {
        playlistIds: ['HaveGunWillTravel_OldTimeRadio'],
        regex: /HaveGunWillTravel(?<date>[0-9]{6})(?<num>[0-9]+)(?<title>.*)/,
        transforms: {
            title: addSpacesBeforeCapitals
        }
    },
    {
        playlistIds: ['OTRR_Tarzan_Singles_TLotJ'],
        regex: /Tarzan - Lord Of The Jungle (?<date>[-0-9x]+) \((?<num>[0-9x]+)\) (?<title>.*)/,
    },
    {
        playlistIds: ['OTRR_Tarzan_Singles_TatFoT'],
        showName: 'Tarzan and the Fires of Tohr',
        regex: /Tarzan - The Fires Of Tohr (?<date>[-0-9x]+) \((?<num>[0-9x]+)\) (?<title>.*)([0-9]+)/,
    },
    {
        playlistIds: ['OTRR_Tarzan_Singles_TatDoA'],
        showName: 'Tarzan and the Diamond of Asher',
        regex: /Tarzan - The Diamond Of Asher (?<date>[-0-9x]+) \((?<num>[0-9x]+)\) (?<title>.*)/,
    },
    {
        playlistIds: ['OTRR_Tarzan_Singles_TotA'],
        showName: 'Tarzan of the Apes',
        regex: /(?<date>[0-9]+) (?<num>[0-9]+) (?<title>.*)/,
    },
    {
        playlistIds: ['Old_Radio_Adverts_01'],
        displayName: 'Commercial',
    },
    {
        playlistIds: ['TheAdventuresOfSuperman_201805'],
        regex: /(?<date>[0-9-]+) - (?<num>[-0-9]+)\) (?<title>.*)/,
    },
    {
        playlistIds: ['TheAdventuresOfSuperman_201805'],
        regex: /(?<date>[0-9-]{10})(?<num>[0-9]{2})(?<title>.*)/,
        transforms: {
            title: [addSpacesBeforeCapitals]
        }
    },
    {
        playlistIds: ['OTRR_Boston_Blackie_Singles'],
        regex: /BostonBlackie(?<date>[-0-9]+)(?<num>[0-9]{3})(?<title>.*)/,
        transforms: {
            title: [addSpacesBeforeCapitals]
        }
    },
    {
        playlistIds: ['OTRR_Falcon_Singles'],
        regex: /TheFalcon(?<date>[-0-9]{8})(?<num>[0-9]{3})Tcot(?<title>.*)/,
        transforms: {
            title: [addSpacesBeforeCapitals]
        }
    },
    {
        playlistIds: ['OTRR_Falcon_Singles'],
        regex: /The Falcon (?<date>[-0-9]+) \((?<num>[0-9]{3})\) (?<title>.*)/,
        transforms: {
            title: [remove('TCOT ')]
        }
    },
    {
        playlistIds: ['OTRR_X_Minus_One_Singles'],
        regex: /XMinusOne(?<date>[-0-9]{8})(?<num>[0-9x]{3})(?<title>.*)/,
        transforms: {
            title: [addSpacesBeforeCapitals]
        }
    },
    {
        playlistIds: ['OTRR_Fort_Laramie_Singles'],
        regex: /Fort_Laramie_(?<date>[-0-9]+)_ep(?<num>[0-9]+)_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores
        }
    },
    {
        playlistIds: ['TalesOfTheTexasRangers'],
        regex: /Texas_Rangers_(?<date>[0-9_]+)_(?<num>[0-9]+)_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores
        }
    },
    {
        playlistIds: ['OTRR_The_Six_Shooter_Singles'],
        regex: /(?<date>[-0-9]+) Ep (?<num>[0-9]+) (?<title>.*)/,
    },
    {
        playlistIds: ['OTRR_Molle_Mystery_Theatre_Singles'],
        regex: /Molle_(?<date>[-0-9]+)_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores
        }
    },
    {
        playlistIds: ['OTRR_Blue_Beetle_Singles'],
        regex: /BlueBeetle_(?<date>[-0-9]+)_(?<num>[-0-9]+)_(?<title>.*)/,
        transforms: {
            title: [remove('1-2'), remove('_Pt_'), addSpacesBeforeCapitals]
        }
    },
    {
        playlistIds: ['OTRR_Blue_Beetle_Singles'],
        regex: /Blue Beetle, The (?<date>[0-9x-]+) \((?<num>[0-9]+)\) (?<title>.*)/,
    },
    {
        playlistIds: ['PatNovakForHire'],
        regex: /(?<date>[-0-9]+)-(?<title>.*)/,
        transforms: {
            title: addSpacesBeforeCapitals
        }
    },
    {
        playlistIds: ['OTRR_Planet_Man_Ver2_Singles'],
        regex: /Planet_Man_50-xx-xx_ep(?<num>[0-9]+)_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores
        }
    },
    {
        playlistIds: ['OTRR_Mystery_House_Singles'],
        regex: /MysteryHouse(?<date>[-0-9x]{8})(?<num>[0-9x]+)(?<title>.*)/,
        transforms: {
            title: addSpacesBeforeCapitals
        }
    },
    {
        playlistIds: ['otr_2000Plus'],
        regex: /(?<date>[-0-9x]+)_(?<num>[0-9x]+)-(.*)2000Plus-(?<title>.*)/,
        transforms: {
            title: addSpacesBeforeCapitals
        }
    },
    {
        playlistIds: ['Exploring_Tomorrow'],
        regex: /ET_(?<date>[-0-9]+)_(?<num>[0-9]+)_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores
        }
    },
    {
        playlistIds: ['OurMissBrooks'],
        regex: /Omb(?<date>[-0-9]+)(?<num>[0-9]{3})(?<title>.*)/,
        transforms: {
            title: addSpacesBeforeCapitals
        }
    },
    {
        playlistIds: ['Great_Gildersleeve'],
        regex: /gild.(?<date>[0-9\.]+)_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores
        }
    },
    {
        playlistIds: ['OTRR_Harold_Peary_Show_Singles'],
        regex: /Harold_Peary_(?<date>[-0-9]+)_ep(?<num>[0-9]+)_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores
        }
    },
    {
        playlistIds: ["OTRR_Jack_Benny_Singles_1932-1934", "OTRR_Jack_Benny_Singles_1934-1935", "OTRR_Jack_Benny_Singles_1935-1936", "OTRR_Jack_Benny_Singles_1936-1937", "OTRR_Jack_Benny_Singles_1937-1938", "OTRR_Jack_Benny_Singles_1938-1939", "OTRR_Jack_Benny_Singles_1939-1940", "OTRR_Jack_Benny_Singles_1940-1941", "OTRR_Jack_Benny_Singles_1941-1942", "OTRR_Jack_Benny_Singles_1942-1943", "OTRR_Jack_Benny_Singles_1943-1944", "OTRR_Jack_Benny_Singles_1944-1945", "OTRR_Jack_Benny_Singles_1945-1946", "OTRR_Jack_Benny_Singles_1946-1947", "OTRR_Jack_Benny_Singles_1947-1948", "OTRR_Jack_Benny_Singles_1948-1949", "OTRR_Jack_Benny_Singles_1949-1950", "OTRR_Jack_Benny_Singles_1950-1951", "OTRR_Jack_Benny_Singles_1951-1952", "OTRR_Jack_Benny_Singles_1952-1953", "OTRR_Jack_Benny_Singles_1953-1954", "OTRR_Jack_Benny_Singles_1954-1955"],
        regex: /JB (?<date>[-0-9]+) (?<title>.*)/,
        transforms: {
            title: replaceUnderscores
        }
    },
    {
        playlistIds: ["OTRR_Harris_Faye_Singles"],
        regex: /PhilHarris(?<date>[-0-9]{8})(?<num>[0-9]+)(?<title>.*)/,
        transforms: {
            title: addSpacesBeforeCapitals
        }
    },
    {
        playlistIds: ["FibberMcgeeAndMollyHq"],
        regex: /(?<date>[0-9]+)-(?<num>[0-9]+)-(?<title>.*)/,
        transforms: {
            title: addSpacesBeforeCapitals
        }
    },
    {
        playlistIds: ["otr_escape"],
        regex: /Escape.(?<date>[0-9\.]+)_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores
        }
    },
    {
        playlistIds: ["otr_escape"],
        regex: /esca_(?<date>[0-9]+)_(?<title>.*)/,
        transforms: {
            title: addSpacesBeforeCapitals
        }
    },
    {
        playlistIds: ["TheLivesOfHarryLime"],
        regex: /Harry_Lime_(?<date>[-0-9]+)_(?<num>[0-9]+)_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores
        }
    },
    {
        playlistIds: ["TheSaintVincentPriceOTR"],
        regex: /The_Saint_(?<date>[0-9]+)_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores
        }
    },
    {
        playlistIds: ["OTRR_Broadway_Is_My_Beat_Singles"],
        regex: /BIMB (?<date>[-0-9]+) \((?<num>[0-9]+)\) (?<title>.*)/,
    },
    {
        playlistIds: ["BoldVenture57Episodes"],
        regex: /BoldVenture(?<date>[0-9]{6})(?<num>[0-9]{2})(?<title>.*)/,
        transforms: {
            title: addSpacesBeforeCapitals
        }
    },
    {
        playlistIds: ["OTRR_Inner_Sanctum_Mysteries_Singles"],
        regex: /Inner Sanctum +(?<date>[-0-9x]+) (?<title>.*)/,
    },
    {
        playlistIds: ["LightsOutoldTimeRadio"],
        regex: /LightsOut-(?<date>[-0-9]+)(?<title>.*)/,
        transforms: {
            title: addSpacesBeforeCapitals
        }
    },
    {
        playlistIds: ["TheMysteriousTraveler"],
        regex: /(?<date>[-0-9]{8})(?<num>[0-9]{3})(?<title>.*)/,
        transforms: {
            title: addSpacesBeforeCapitals
        }
    },
    {
        playlistIds: ["otr_abbottandcostello"],
        regex: /(?<date>[0-9]{6})(_-)?_(?<title>[A-Za-z].*)/,
        transforms: {
            title: replaceUnderscores
        }
    },
    {
        playlistIds: ["OTRR_New_Adventures_of_Nero_Wolfe_Singles"],
        regex: /nanw_(?<date>[-0-9]+)_ep(?<num>[0-9]+)_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores
        }
    },
    {
        playlistIds: ["OTRR_Black_Museum_Singles"],
        regex: /BlackMuseum-(?<date>[0-9]+)-(?<title>.*)/,
        transforms: {
            title: addSpacesBeforeCapitals
        }
    },
    {
        playlistIds: ["MyFavoriteHusband"],
        regex: /My_Favorite_Husband_(?<date>[_0-9]{8})_(?<num>.{4})_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores
        }
    },
    {
        playlistIds: ["CommandPerformance"],
        regex: /CP_(?<date>[-0-9]*)_ep(?<num>.{3})-(?<title>.*)/,
        transforms: {
            title: [replace('__', ', '), replaceUnderscores]
        }
    },
    {
        playlistIds: ["OTRR_Whistler_Singles"],
        regex: /Whistler_(?<date>[-0-9]*)_ep(?<num>[0-9]{3})_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores
        }
    },
    {
        playlistIds: ["OTRR_Calling_All_Cars_Singles"],
        regex: /Calling_All_Cars_(?<date>[-0-9]+)_ep(?<num>[0-9]{3})_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores
        }
    },
    {
        playlistIds: ["OTRR_Weird_Circle_Singles"],
        regex: /Weird_Circle_4x-xx-xx_ep(?<num>[0-9]{2})_?(?<title>.*)/,
        transforms: {
            title: replaceUnderscores
        }
    },
    {
        playlistIds: ["The_Hermits_Cave"],
        regex: /HermitsCave_400000_(?<num>[0-9]{2})_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores
        }
    },
    {
        playlistIds: ["HopalongCassidy"],
        regex: /Hopalong_Cassidy_(?<date>[0-9]{6})_(?<num>[0-9]{4})_(?<titler>.*)/,
        transforms: {
            title: replaceUnderscores
        }
    },
    {
        playlistIds: ['CBSMTFantasy1', 'cbsmtfs2', 'cbsmtfs3', 'cbsmtfs4', 'cbsmtfs5', 'cbsmtfs6', 'cbsmtfs7', 'cbsmtfs8'],
        regex: /([0-9]{2})(?<title>.*)/,
        transforms: {
            title: addSpacesBeforeCapitals
        }
    },
    {
        playlistIds: ['CbsRadioMysteryTheater1975Page1'],
        regex: /Cbsrmt([0-9]{6})([0-9]+)(?<title>.*)(_wuwm)(.*)/,
        transforms: {
            title: addSpacesBeforeCapitals
        }
    },
    {
        playlistIds: ['CbsRadioMysteryTheater1976Page1', 'CbsRadioMysteryTheater1976Page2', 'CbsRadioMysteryTheater1976Page3', 'CbsRadioMysteryTheater1976Page4', 'CbsRadioMysteryTheater1976Page5'],
        regex: /Cbsrmt([0-9]{6})([0-9]+)(?<title>.*)/,
        transforms: {
            title: addSpacesBeforeCapitals
        }
    },
    {
        playlistIds: ['OTRR_Richard_Diamond_Private_Detective_Singles'],
        regex: /Richard Diamond (?<date>[-0-9]{8}) \((?<num>[0-9]+)\) (?<title>.*)/,
    },
    {
        playlistIds: ['OTRR_Ranger_Bill_Singles'],
        regex: /Ranger_Bill_(?<date>.{8})_ep(?<num>[0-9x]{3})_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores,
            date: remove('xx-xx-xx')
        }
    },
    {
        playlistIds: ['OTRR_Let_George_Do_It_Singles'],
        regex: /LGDI - \[HSG_Synd.#(?<num>[0-9]+)\] - (?<title>.*)/,
    },
    {
        playlistIds: ['OTRR_Let_George_Do_It_Singles'],
        regex: /LGDI (?<date>.{8}) \((?<num>[0-9]{3})\) (?<title>.*)/,
    },
    {
        playlistIds: ['OTRR_Let_George_Do_It_Singles'],
        regex: /Let George Do It (?<date>[0-9-]+) \((?<num>[0-9]+)\) (?<title>.*)/,
    },
    {
        playlistIds: ['FatherKnowsBest45Episodes'],
        regex: /Fkb(?<date>[-0-9]{10})(?<num>[0-9]{3})(?<title>.*)/,
        transforms: {
            title: addSpacesBeforeCapitals,
        }
    },
    {
        playlistIds: ['OTRR_Secrets_Of_Scotland_Yard_Singles'],
        regex: /SecretsOfScotlandYard(.{8})_(.{3})_(?<title>.*)/,
        transforms: {
            title: addSpacesBeforeCapitals,
        }
    },
    {
        playlistIds: ['OTRR_Mr_District_Attorney_Singles'],
        regex: /Mr_District_Attorney_(?<date>.{8})_(?<num>.{3})_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores,
            num: remove('xxx')
        }
    },
    {
        playlistIds: ['TheLifeOfRiley'],
        regex: /Lor(?<date>[-0-9]{10})(?<num>[0-9]{3})(?<title>.*)/,
        transforms: {
            title: addSpacesBeforeCapitals,
        }
    },
    {
        playlistIds: ['OTRR_Lux_Radio_Theater_Singles'],
        regex: /LuxRadioTheatre(?<date>[-0-9]{8})(?<num>[0-9]+)(?<title>.*)/,
        transforms: {
            title: addSpacesBeforeCapitals,
        }
    },
    {
        playlistIds: ['OTRR_Lux_Radio_Theater_Singles'],
        regex: /Lux_Radio_Theatre_(?<date>[-0-9]{8})_(?<num>[0-9]+R?)_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores,
        }
    },
    {
        playlistIds: ['otr_campbellplayhouse'],
        regex: /(?<date>[0-9]{6})_(?<title>.*)/,
        transforms: {
            title: addSpacesBeforeCapitals,
        }
    },
    {
        playlistIds: ['otr_campbellplayhouse'],
        regex: /CampbellPlayhouse(?<date>[-0-9]{8})(?<title>.*)/,
        transforms: {
            title: addSpacesBeforeCapitals,
        }
    },
    {
        playlistIds: ['OrsonWelles-MercuryTheater-1938Recordings'],
        regex: /MercuryTheater(?<date>[-0-9]{8})(?<title>.*)/,
        transforms: {
            title: addSpacesBeforeCapitals,
        }
    },
    {
        playlistIds: ['OTRR_On_Stage_Singles_201901'],
        regex: /On Stage (?<datre>[-0-9]{8}) \((?<num>[0-9]+)\) (?<title>.*)/,
    },
    {
        playlistIds: ['ScreenGuildTheater'],
        regex: /Sgt_(?<date>[-0-9]{8})_ep(?<num>[0-9]+)_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores,
        }
    },
    {
        playlistIds: ['OTRR_Academy_Award_Theater_Singles'],
        regex: /Academy Award (?<date>[-0-9]{8}) \((?<num>[0-9]+)\) (?<title>.*)/,
    },
    {
        playlistIds: ['first-nighter'],
        regex: /First Nighter (?<date>[-0-9]{10}) \((?<num>[0-9]+)\) (?<title>.*)/,
    },
    {
        playlistIds: ['ScreenDirectorsPlayhouse'],
        regex: /SDP_(?<date>[-0-9]{8})_ep(?<num>[0-9]+)-(?<title>.*)/,
        transforms: {
            title: replaceUnderscores,
        }
    },
    {
        playlistIds: ['NBC_University_Theater'],
        regex: /NBC_University_Theater_(?<date>[0-9]{6})_(?<num>[0-9]{3})_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores,
        }
    },
    {
        playlistIds: ['OTRR_Dr_Kildare_Singles'],
        regex: /Dr_Kildare_(?<date>[-0-9]{8})__(?<num>[0-9]+)__(?<title>.*)/,
        transforms: {
            title: replaceUnderscores,
        }
    },
    {
        playlistIds: ['OTRR_YoursTrulyJohnnyDollar_Singles'],
        regex: /YTJD (?<date>[-0-9]{10}) (?<num>[0-9]+) (?<title>.*)( \[AFRTS\])?/,
    },
    {
        playlistIds: ["VicSade1937-1939", "VicSade1940-1941", "VicSade1942-1947"],
        regex: /Vs(?<date>[-0-9]+(xx)?)(?<title>.*)/,
        transforms: {
            title: addSpacesBeforeCapitals,
        }
    },
    {
        playlistIds: ["Sf_68"],
        regex: /(?<num>[-0-9]+)(?<title>.*)/,
        transforms: {
            title: addSpacesBeforeCapitals,
        }
    },
    {
        playlistIds: ["haunting_hour"],
        regex: /(?<date>[0-9]{6}_)?(?<num>[0-9]{2}_)?(?<title>.*)/,
        transforms: {
            title: replaceUnderscores,
        }
    },
    {
        playlistIds: ["OTRR_Moon_Over_Africa_Singles"],
        regex: /Moon_over_Africa_(?<date>[-0-9]+)_ep(?<num>[0-9]+)_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores,
        }
    },
    {
        playlistIds: ["Otrr_Dangerous_Assignment_Singles"],
        regex: /Dangerous_Assignment_(?<date>[-0-9]+)_(?<num>[0-9]+)_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores,
        }
    },
    {
        playlistIds: ["Otrr_Dangerous_Assignment_Singles"],
        regex: /Dangerous Assignment (?<date>[0-9-]+) \((?<num>[0-9]+)\) (?<title>.*)/,
    },
    {
        playlistIds: ["OTRR_Sealed_Book_Singles"],
        regex: /Sealed_Book_45-xx-xx_ep(?<num>[0-9]+)_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores,
        }
    },
    {
        playlistIds: ["OTRR_Whitehall_1212_Singles"],
        regex: /Whitehall 1212 (?<date>[-0-9]+) \((?<num>[0-9]+)\) (?<title>.*)/,
    },
    {
        playlistIds: ["OTRR_Frank_Race_Singles"],
        regex: /Frank_Race_49-xx-xx_ep(?<num>\d+)_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores,
        }
    },
    {
        playlistIds: ["OTRR_Halls_Of_Ivy_Singles"],
        regex: /HallsOfIvy(?<date>[-0-9]+)(?<num>\d{3})(?<title>.*)/,
        transforms: {
            title: addSpacesBeforeCapitals,
        }
    },
    {
        playlistIds: ["TheClock"],
        regex: /CLOCK_(?<date>[0-9_]+)ep(?<num>\d+)_?(?<title>.*)/,
        transforms: {
            title: replaceUnderscores,
        }
    },
    {
        playlistIds: ["OTRR_John_Steele_Adventurer_Singles"],
        regex: /John_Steele_Adventurer_(?<date>[-x0-9]+)_(?<num>[x0-9]{3})_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores,
        }
    },
    {
        playlistIds: ["OTRR_Mel_Blanc_Singles"],
        regex: /The_Mel_Blanc_Show_(?<date>[-0-9]+)_ep(?<num>\d+)_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores,
        }
    },
    {
        playlistIds: ["the-burns-and-allen-show-1934-09-26-2-leaving-for-america"],
        regex: /The Burns and Allen Show (?<date>[-0-9]+) \((?<num>[0-9]+)\) (?<title>.*)/,
    },
    {
        playlistIds: ["OTRR_This_Is_Your_FBI_Singles"],
        regex: /This Is Your FBI (?<date>[-0-9]+) \((?<num>[0-9]+)\) (?<title>.*)/,
    },
    {
        playlistIds: ["OTRR_Man_Called_X_Singles"],
        regex: /Man Called X (?<date>[-0-9]+) \((?<num>[0-9]+)\) (?<title>.*)/,
    },
    {
        playlistIds: ["OTRR_Counterspy_Singles"],
        regex: /Counterspy (?<date>[-0-9x]+) \((?<num>[0-9x]+)\) (?<title>.*)/,
    },
    {
        playlistIds: ["OTRR_Magic_Island_Singles"],
        regex: /MagicIsland_36xxxx__(?<num>[0-9]+)_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores,
        }
    },
    {
        playlistIds: ["FrontierGentleman-All41Episodes"],
        regex: /FrontierGentleman(?<date>[-0-9]+)_episode(?<nun>[0-9]+)_(?<title>.*)/,
        transforms: {
            title: addSpacesBeforeCapitals,
        }
    },
    {
        playlistIds: ["OTRR_Philo_Vance_Singles"],
        regex: /Philo_Vance_(?<date>[-0-9]+)_(?<num>[0-9x]+)_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores,
        }
    },
    {
        playlistIds: ["OzzieHarriet"],
        regex: /Oh(?<date>[-0-9]{10})(?<num>[0-9]+)(?<title>.*)/,
        transforms: {
            title: [addSpacesBeforeCapitals, replace(/[^ ]aka /g, ' aka '), replace(/^afrs /g, '')],
        }
    },
    {
        playlistIds: ["DuffysTavern_524"],
        regex: /Dt(?<date>[-0-9]{10})(?<num>[0-9]*)(?<title>.*)/,
        transforms: {
            title: [addSpacesBeforeCapitals, remove(/^afrs /g)],
        }
    },
    {
        playlistIds: ["OTRR_Frontier_Town_Singles"],
        regex: /Frontier_Town_49-xx-xx_ep(?<num>[0-9]+)_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores
        }
    },
    {
        playlistIds: ["470213ThePerfectScript"],
        regex: /(?<date>[0-9]+)_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores
        }
    },
    {
        playlistIds: ["OTRR_Wild_Bill_Hickock_Singles"],
        regex: /WildBillHickok(?<date>[-0-9]{8})(?<num>[0-9]+)(?<title>.*)/,
        transforms: {
            title: [addSpacesBeforeCapitals, remove(/^afrs /g)],
        }
    },
    {
        playlistIds: ["OTRR_Wild_Bill_Hickock_Singles"],
        regex: /Wild Bill Hickok (?<date>[0-9-]+) \((?<num>[0-9]+)\) (?<title>.*)/,
    },
    {
        playlistIds: ["OTRR_Candy_Matson_Singles"],
        regex: /CandyMatson(?<date>[-0-9]{8})(?<num>[0-9]+)(?<title>.*)/,
        transforms: {
            title: [addSpacesBeforeCapitals, remove(/^afrs /g), remove(/^aud /g)],
        }
    },
    {
        playlistIds: ["OTRR_Sam_Spade_Singles"],
        regex: /Sam ?Spade ?(?<date>[0-9-]+) ?(?<title>.*)/,
        transforms: {
            title: [addSpacesBeforeCapitals],
        }
    },
    {
        playlistIds: ["RadioReadersDigest"],
        regex: /(?<date>[0-9]+)_(?<num>[0-9]+)_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores
        }
    },
    {
        playlistIds: ["classicmlbbaseballradio"],
        regex: /(?<date>[0-9]{8})(?<title>.*)/,
        transforms: {
            title: addSpacesBeforeCapitals,
            date: insertHyphens
        }
    },
    {
        playlistIds: ["classicmlbbaseballradio"],
        regex: /(?<date>[0-9]{6}-[0-9]{2})(?<title>.*)/,
        transforms: {
            title: addSpacesBeforeCapitals,
            date: insertHyphens
        }
    },
    {
        playlistIds: ["classicmlbbaseballradio"],
        regex: /(?<date>[0-9 ]{10})(?<title>.*)/,
    },
    {
        playlistIds: ["classicmlbbaseballradio"],
        regex: /(?<title>.*)/,
    },
    {
        playlistIds: ["OTRR_Black_Flame_Singles"],
        regex: /Black Flame of the Amazon, The 1938-xx-xx \((?<num>[0-9]+)\) (?<title>.*)/,
    },
    {
        playlistIds: ["the-shadow-1938-10-09-141-death-stalks-the-shadow"],
        regex: /The Shadow (?<date>[-0-9]+) \((?<num>[0-9]+)\) (?<title>.*)/,
    },
    {
        playlistIds: ["OTRR_Box_13_Singles"],
        regex: /Box 13 ([0-9x-]+) \((?<num>[0-9]+)\) (?<title>.*)/,
    },
    {
        playlistIds: ["OTRR_Barrie_Craig_Singles"],
        regex: /Barrie Craig (?<date>[-0-9]+) (?<title>.*)/,
    },
    {
        playlistIds: ["OTRR_Mr_Keen_Tracer_Of_Lost_Persons_Singles"],
        regex: /Mr. Keen, Tracer of Lost Persons \((?<num>[0-9]+)\) (?<date>[-0-9]+) (?<title>.*)/,
    },
    {
        playlistIds: ["RockyJordan"],
        regex: /RJ_(?<date>[-0-9]+)_ep(?<num>[0-9]+)-(?<title>.*)/,
        transforms: {
            title: replaceUnderscores
        }
    },
    {
        playlistIds: ["OTRR_Nick_Carter_Master_Detective_Singles"],
        regex: /Nick Carter (?<date>[-0-9]+) \((?<num>[0-9]+)\) (?<title>.*)/,
        transforms: {
            title: replaceUnderscores
        }
    },
    {
        playlistIds: ["TheAldrichFamily"],
        regex: /Af(?<date>[-0-9]{10})(?<num>[0-9]{3})(?<title>.*)/,
        transforms: {
            title: addSpacesBeforeCapitals
        }
    },
    {
        playlistIds: ["TheAldrichFamily"],
        regex: /Af(?<title>.*)/,
        transforms: {
            title: addSpacesBeforeCapitals
        }
    },
    {
        playlistIds: ["gang-busters-1955-04-02-885-the-case-of-the-mistreated-lady"],
        regex: /Gang Busters (?<date>[-0-9]+) \((?<num>[0-9]{3})\) (?<title>.*)/,
    },
    {
        playlistIds: ["night-beat-1950-07-24-25-the-devils-bible"],
        regex: /Night Beat (?<date>[-0-9x]+) \((?<num>[0-9x]+)\) (?<title>.*)/,
    },
    {
        playlistIds: ["l-a-1953-11-20-xx-thanksgiving-in-pine-ridge"],
        regex: /L&A (?<date>[-0-9]+) \((?<num>[0-9x]+)\) (?<title>.*)/,
        transforms: {
            num: remove('x')
        }
    },
    {
        playlistIds: ["VoyageOfTheScarletQueen"],
        regex: /ScarletQueen(?<date>[-0-9]{8})(?<num>[0-9]*)(?<title>.*)/,
        transforms: {
            title: addSpacesBeforeCapitals
        }
    },
    {
        playlistIds: ["The_Bob_Hope_Program"],
        regex: /(?<date>[0-9]{6})_(?<title>.*)/,
        transforms: {
            title: [replace(/[-_]+/g, ' '), remove(/^ +/g)]
        }
    },
    {
        playlistIds: ["MartinAndLewis_OldTimeRadio"],
        regex: /MartinLewisShow(?<date>[0-9]{6})_(?<num>[0-9]+)_(?<title>.*)/,
        transforms: {
            title: addSpacesBeforeCapitals
        }
    },
    {
        playlistIds: ["ItsHigginsSir"],
        regex: /(?<date>[-0-9]+)_(?<title>.*)/,
        transforms: {
            title: [addSpacesBeforeCapitals, t => t.charAt(0).toUpperCase() + t.slice(1)]
        }
    },
    {
        playlistIds: ["town-hall-tonight-1938-06-08-232-music-publisher-needs-a-tune"],
        regex: /(.*) (?<date>[-0-9]+) \((?<num>[0-9]+)\) (?<title>.*)/,
    },
    {
        playlistIds: ["bickersons-1947-03-02-12-blanche-has-a-stomach-ache"],
        regex: /Bickersons (?<date>[-0-9x_]{8,10}) \((?<num>.+)\) (?<title>.*)/,
        transforms: {
            num: remove('xx'),
            date: remove('xx_xx_xx')
        }
    },
    {
        playlistIds: ["OTRR_The_Big_Show_Singles"],
        regex: /(?<date>[-0-9]+)_ep(?<num>[0-9]+)_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores
        }
    },
    {
        playlistIds: ["general-electric-show-52-54-1952-12-25-12-guest-gary-crosby"],
        regex: /([A-Za-z ]+) \(([^)]+)\) (?<date>[-0-9]+) \((?<num>[0-9]+)\) (?<title>.*)/,
    },
    {
        playlistIds: ["a-a-1948-11-14-183-tourist-sightseeing-agency-aka-ny-sightseeing-agency-aka-andy"],
        regex: /A&A (?<date>[-0-9]+) #(?<num>[0-9]+) (?<title>.*)/,
        transforms: {
            title: remove(/\s*\(aka [^)]+\)\s*/g)
        }
    },
    {
        playlistIds: ["Perry_Mason_Radio_Show"],
        regex: /PM_(?<date>[0-9]+)_(?<num>[0-9]+)_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores
        }
    },
    {
        playlistIds: ["chaseandsanbornhour1931122015firstsongcarolinamoon"],
        regex: /.* (?<date>[-0-9]{10}) \((?<num>[0-9]+)\) (?<title>.*)/,
    },
    {
        playlistIds: ["edgar-bergen-1937-12-12-32-guest-mae-west"],
        regex: /.* (?<date>[-0-9]{10}) \((?<num>[0-9]+)\) (?<title>.*)/,
    },
    {
        playlistIds: ["OTRR_Damon_Runyon_Singles"],
        regex: /Damon_Runyon__4x-xx-xx_ep(?<num>[0-9]+)_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores
        }
    },
    {
        playlistIds: ["QuietPlease_806"],
        regex: /(?<date>[-0-9]+)_QUIETPLEASE_(?<num>[0-9]+)_(?<title>.*)/,
    },
    {
        playlistIds: ["TheWitchsTale"],
        regex: /(?<date>[-0-9]+) - (?<num>[0-9]+)\) (?<title>.*)/,
        transforms: {
            title: remove(/ \([^)]+\)/g)
        }
    },
    {
        playlistIds: ["390903-102-the-joy-shop"],
        regex: /(?<date>[0-9]+)_(?<num>[0-9]+)_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores
        }
    },
    {
        playlistIds: ["otr_chanduthemagician"],
        regex: /(?<date>[-0-9]+)_Xxxx_-_Chandu_the_Magician_-_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores
        }
    },
    {
        playlistIds: ["otr_chanduthemagician"],
        regex: /(?<date>[-0-9]+)_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores
        }
    },
    {
        playlistIds: ["OTRR_Challenge_of_the_Yukon_Singles"],
        regex: /COTY (?<date>[-0-9]+) \((?<num>[0-9]+)\) (?<title>.*)/,
    },
    {
        playlistIds: ["Michael_Shayne"],
        regex: /Michael_Shayne_(?<date>[-0-9]+)_(ep[0-9]+_)?(?<title>.*)/,
        transforms: {
            title: replaceUnderscores
        }
    },
    {
        playlistIds: ["MrMoto"],
        regex: /MM_(?<date>[-0-9]+)_ep(?<num>[0-9]+)-(?<title>.*)/,
        transforms: {
            title: replaceUnderscores
        }
    },
    {
        playlistIds: ["ItPaysToBeIgnorant"],
        regex: /Iptbi_(?<date>[-0-9x]+)_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores,
            date: remove('xx-xx-xx')
        }
    },
    {
        playlistIds: ["OTRR_Jeff_Regan_Singles"],
        regex: /Jeff Regan, Investigator (?<date>[-0-9]+) (?<title>.*)/,
    },
    {
        playlistIds: ["you-bet-your-life-1952-02-20-160-secret-word-heart"],
        regex: /You Bet Your Life (?<date>[-0-9x]+) \((?<num>[0-9x]+)\) (?<title>.*)/,
    },
    {
        playlistIds: ["The_Scarlet_Pimpernel"],
        regex: /ScarletPimpernel_(?<num>[0-9]+)_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores
        }
    },
    {
        playlistIds: ["Dr.Christian_911"],
        regex: /Drc(?<date>[-0-9]{10})(?<num>[0-9]+)(?<title>.*)/,
        transforms: {
            title: addSpacesBeforeCapitals
        }
    },
    {
        playlistIds: ["OneMansFamily"],
        regex: /1MsF(?<date>[-0-9x]{10})(?<title>.*)/,
        transforms: {
            title: addSpacesBeforeCapitals
        }
    },
    {
        playlistIds: ["Goldbergs"],
        regex: /gold.(?<date>[0-9\.]{10})_Ep(?<num>[0-9]+)_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores
        }
    },
    {
        playlistIds: ["MaPerkins021950"],
        regex: /MaP([0-9]+)(?<title>[^0-9]*)([0-9-]{4,10})?/,
        transforms: {
            title: addSpacesBeforeCapitals
        }
    },
    {
        playlistIds: ["AdventuresofFrankMerriwell"],
        regex: /Fm_(?<date>[0-9-]{8})_ep(?<num>[0-9]+)-(?<title>.*)/,
        transforms: {
            title: replaceUnderscores
        }
    },
    {
        playlistIds: ["Maisie"],
        regex: /(?<num>[0-9]+)_(?<date>[0-9]+)_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores
        }
    },
    {
        playlistIds: ["red-ryder"],
        regex: /red_ryder_(?<date>[x0-9-]+)_?(?<title>.*)/,
        transforms: {
            title: [replaceUnderscores, capitalise]
        }
    },
    {
        playlistIds: ["OtrHorizonsWest13Of13Eps"],
        regex: /Hw(?<num>[0-9]+)(?<title>.*)/,
        transforms: {
            title: addSpacesBeforeCapitals
        }
    },
    {
        playlistIds: ["mark_trail"],
        regex: /mark_trail_(?<date>[0-9-]+)_(?<num>[0-9]+)_(?<title>.*)/,
        transforms: {
            title: [replaceUnderscores, capitalise]
        }
    },
    {
        playlistIds: ["OTRR_Luke_Slaughter_Of_Tombstone_Singles"],
        regex: /Luke_Slaughter_(?<date>[0-9-]+)_ep(?<num>[0-9]+)_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores
        }
    },
    {
        playlistIds: ["Information-Please"],
        regex: /(?<date>[0-9]+)_(?<num>[0-9]+)_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores
        }
    },
    {
        playlistIds: ["my-friend-irma"],
        regex: /(?<date>[0-9]+)_(?<num>[0-9]+)_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores
        }
    },
    {
        playlistIds: ["EbZeb"],
        regex: /[0-9]{4}(?<num>[0-9]{3})(?<title>.*)/,
        transforms: {
            title: addSpacesBeforeCapitals
        }
    },
    {
        playlistIds: ["EbZeb"],
        regex: /Ez(?<title>[0-9]{3})/,
        transforms: {
            title: t => `Episode ${t}`
        }
    },
    {
        playlistIds: ["EbZeb"],
        regex: /Ez(?<date>[0-9-]+)000(?<title>.*)/,
        transforms: {
            title: addSpacesBeforeCapitals
        }
    },
    {
        playlistIds: ["Milton_Berle_47-48"],
        regex: /MiltonBerle(?<date>[0-9-]{8})-(?<num>[0-9]+)-(?<title>.*)/,
        transforms: {
            title: addSpacesBeforeCapitals
        }
    },
    {
        playlistIds: ["TheGoonShow1950to1960"],
    },
    {
        playlistIds: ["SpikeJones"],
        regex: /SJ_(?<date>[0-9-]+)_ep(?<num>[0-9]+)-(Guest_)?(?<title>.*)/,
        transforms: {
            title: replaceUnderscores
        }
    },
    {
        playlistIds: ["otr_easyaces"],
        regex: /EasyAces(_|-)(?<num>[0-9]+)_?(?<title>.*)/,
        transforms: {
            title: addSpacesBeforeCapitals
        }
    },
    {
        playlistIds: ["red-skelton-show_202008"],
        regex: /Red Skelton Show (?<date>[0-9-]+) \((?<num>[0-9R]+)\) (?<title>.*)/,
    },
    {
        playlistIds: ["otr_ghostcorps"],
        regex: /GhostCorps_(?<title>[0-9]+)/,
        transforms: {
            title: t => `Episode ${t}`
        }
    },
    {
        playlistIds: ["otr_ghostcorps"],
        regex: /gcor.([0-9]+).(?<num>s[0-9]+.?e[0-9]+)_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores,
            num: [remove(/[se\.]/g)]
        }
    },
    {
        playlistIds: ["otr_dickbartonspecialagent"],
        regex: /OTR_-_Dick_Barton_Special_Agent_-_72-00-00_-_(?<title>[0-9]+)_-_(.*)/,
        transforms: {
            title: t => `Episode ${t}`
        }
    },
    {
        playlistIds: ["OTRR_21st_Precinct_Singles"],
        regex: /21st Precinct (?<date>[0-9-]+) \((?<num>[0-9]+)\) (?<title>.*)/,
    },
    {
        playlistIds: ["PeteKellysBlues"],
        regex: /pete_kellys_blues_(?<date>[0-9]+)_(?<title>.*)/,
        transforms: {
            title: [replaceUnderscores, capitalise]
        }
    },
    {
        playlistIds: ["OTRR_Line_Up_Singles"],
        regex: /The Line-Up (?<date>[0-9-]+) \((?<num>[0-9]+)\) (?<title>.*)/,
    },
    {
        playlistIds: ["DiaryOfFate"],
        regex: /DF(?<date>[0-9-]+)(?<title>.*)/,
        transforms: {
            title: addSpacesBeforeCapitals
        }
    },
    {
        playlistIds: ["believe-it-or-not"],
        regex: /(?<num>[0-9]+)_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores
        }
    },
    {
        playlistIds: ["Bill_Sterns_Sports_Newsreel"],
        regex: /Bill_Sterns_Sports_Newsreel_-_(?<date>[0-9]+)-(?<num>[0-9]+)_-_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores
        }
    },
    {
        playlistIds: ["Bill_Sterns_Sports_Newsreel"],
        regex: /Bill_Sterns_Sports_Newsreel_-_(?<date>[0-9]+)_-_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores
        }
    },
    {
        playlistIds: ["OTRR_World_Adventurer_Club_Singles"],
        regex: /World_Adventurers_Club_32-xx-xx_ep(?<num>[0-9]+)_(?<title>.*)/,
        transforms: {
            title: replaceUnderscores
        }
    },

].map(o => {
    if (o.regex) {
        o.regex = new RegExp(o.regex, 'i');
    }
    return o;
});

module.exports.buildNameParser = function() {
    const stats = {ok: 0, failed: 0, playlists: {}};

    function applyTransforms(value, transforms) {
        if (!value) return;

        if (transforms) {
            return toArray(transforms).reduce((acc, transform) => transform(acc), value);
        }
        return value;
    }

    function findBestParser(playlistId, metadata) {
        const matchingParsers= nameConfig.filter(c => c.playlistIds.includes(playlistId));
        if (matchingParsers.length === 0) {
            return;
        } else if (matchingParsers.length === 1) {
            return matchingParsers[0];
        }
        return matchingParsers.find(parser => parser.regex.test(metadata.name));
    }

    return {
        parse(playlistId, metadata) {
            const matchingParser= findBestParser(playlistId, metadata),
                values = {};

            let parseSuccess, displayName;

            if (matchingParser) {
                if (matchingParser.displayName) {
                    parseSuccess = true;
                    displayName = matchingParser.displayName;
                } else {
                    matchingParser.transforms = matchingParser.transforms || {};
                    if (matchingParser.regex) {
                        const match = (metadata.name.replace(/\.mp3$/i, '')).match(matchingParser.regex);
                        if (match) {
                            values.title = applyTransforms(match.groups.title, matchingParser.transforms.title);
                            values.date = applyTransforms(match.groups.date, matchingParser.transforms.date);
                            values.num = applyTransforms(match.groups.num, matchingParser.transforms.num);
                            parseSuccess = true;
                        }

                    } else {
                        // this means we can assume metadata title is always safe to use
                        values.title = applyTransforms(metadata.title, matchingParser.transforms.title);
                        parseSuccess = true;
                    }
                }
            }

            values.title = values.title || metadata.title || metadata.name;

            const showName = (matchingParser && matchingParser.showName) || configHelper.getShowForPlaylistId(playlistId).name,
                nameParts = [showName];

            if (values.num) {
                const parsedNum = parseInt(values.num) || values.num;
                nameParts.push(` (#${parsedNum})`);
            }
            nameParts.push(`: ${values.title}`);
            if (values.date) {
                nameParts.push(` [${values.date}]`);
            }

            displayName = displayName || nameParts.join('');
            if (!stats.playlists[playlistId]) {
                stats.playlists[playlistId] = {
                    ok: 0,
                    failed: 0
                };
            }
            if (parseSuccess) {
                stats.playlists[playlistId].ok++;
                stats.ok++;
                log.debug(`nameParser MATCH OK: ${playlistId} "${displayName}"`);
            } else {
                stats.playlists[playlistId].failed++;
                stats.failed++;
                log.debug(`nameParser MATCH FAILED: ${playlistId} "${displayName}" from ${metadata.name}`);
            }
            return displayName;
        },

        logStats() {
            Object.entries(stats.playlists).map(([playlistId, stats]) => {
               log.debug(`nameParser stats: ${playlistId} ${stats.failed} FAILED, ${stats.ok} OK`)
            });

            const percentageOk = ((stats.ok / (stats.ok + stats.failed)) * 100).toFixed(2);
            log.info(`nameParser stats: ${percentageOk}% parsed OK, ${stats.failed} failures`);
        }
    };
    (playlistId, metadata) => {


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
                log.debug(`nameParser MATCH OK: ${playlistId} ${matches[0]}`);
                return matches[0];
            }
        }
        log.debug(`nameParser NO MATCH: ${playlistId} ${metadata.name}`);
        return metadata.title || metadata.name;
    };
}
