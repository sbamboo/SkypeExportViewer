EMOTICON_MAPPING_ABBRIVS = Object.keys(EMOTICON_MAPPING.abbrivs);
EMOTICON_MAPPING_EMOTICONS = Object.keys(EMOTICON_MAPPING.emoticons);
EMOTICON_MAPPING_AUTOMAPPING = EMOTICON_MAPPING.auto_mapping ? EMOTICON_MAPPING.auto_mapping : null;

function parseEmoticonString(emoticonString, EMOTICON_MAPPING) {
    // Get all keys from EMOTICON_MAPPING.abbrivs, and then iterate if the keys are in the string, if found replace with value
    for (const abbriv of EMOTICON_MAPPING_ABBRIVS) {
        if (emoticonString.includes(abbriv)) {
            emoticonString = emoticonString.replace(abbriv, EMOTICON_MAPPING.abbrivs[abbriv]);
        }
    }

    // Get all keys from EMOTICON_MAPPING.emoticons, and then iterate if the keys are in the string, if found replace with value (Remove surrounding parentheses in the img alt)
    for (const emoticon of EMOTICON_MAPPING_EMOTICONS) {
        if (emoticonString.includes(emoticon)) {
            emoticonString = emoticonString.replace(emoticon, `<img src="${url}" alt="${emoticon}" class="emoticon" />`);
        }
    }

    // Return the parsed string
    return emoticonString;
}

async function parseEmoticonStringExtracting(emoticonString, EMOTICON_MAPPING) {
    // Get all keys from EMOTICON_MAPPING.abbrivs, and then iterate if the keys are in the string, if found replace with value
    for (const abbriv of EMOTICON_MAPPING_ABBRIVS) {
        if (emoticonString.includes(abbriv)) {
            emoticonString = emoticonString.replace(abbriv, EMOTICON_MAPPING.abbrivs[abbriv]);
        }
    }

    if (emoticonString.includes(":)")) {
        console.log(emoticonString);
    }

    // Find all strings that are inside parentheses where the string contains no whitespace, then call parseEmoticon on the string with parentheses
    const emoticonRegex = /\(([^)]+)\)/g;
    // Make a unique array of parentheses-strings found in the emoticonString
    const emoticonStrings = new Set(emoticonString.match(emoticonRegex));
    // Iterate over the unique emoticon strings and call parseEmoticon on each one
    for (const emoticon of emoticonStrings) {
        const parsedEmoticon = await parseEmoticon(emoticon, EMOTICON_MAPPING);
        if (parsedEmoticon) {
            const regex = new RegExp(`\\(${emoticon.replace(/[()]/g, '')}\\)`, 'g');
            emoticonString = emoticonString.replace(regex, parsedEmoticon);
        }
    }

    // Return the parsed string
    return emoticonString;
}

async function parseEmoticon(emoticon, EMOTICON_MAPPING) {
    let resolvedEmoticon = emoticon;

    // Check if the emoticon is in abbrivs and map it
    if (EMOTICON_MAPPING_ABBRIVS.includes(emoticon)) {
        resolvedEmoticon = EMOTICON_MAPPING.abbrivs[emoticon];
    }

    // Check if the resolved emoticon is in the emoticons mapping
    if (EMOTICON_MAPPING_EMOTICONS.includes(resolvedEmoticon)) {
        const emoticonUrl = EMOTICON_MAPPING.emoticons[resolvedEmoticon];
        return `<img src="${emoticonUrl}" alt="${resolvedEmoticon}" class="emoticon" />`;
    }

    // If not found in emoticons, try using the auto_mapping with the emoticon name placeholder
    if (EMOTICON_MAPPING_AUTOMAPPING) {
        const autoMappedUrl = EMOTICON_MAPPING.auto_mapping.replace("{emoticon}", resolvedEmoticon.replace('(', '').replace(')', ''));

        // Check if the auto-mapped URL is reachable
        try {
            const response = await fetch(autoMappedUrl, { method: 'HEAD' });
            if (!response.ok) {
                return null;
            }
        } catch (error) {
            return null;
        }

        return `<img src="${autoMappedUrl}" alt="${resolvedEmoticon}" class="emoticon" />`;
    }

    // Return null if no mapping found
    return null;
}
