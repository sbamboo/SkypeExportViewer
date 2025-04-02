const JSON_PLC = {
    ":(": "$PLC_sad_PLC$",
    ":{": "$PLC_movember_PLC$",
};
const JSON_PLC_MAN = {
    ":?": "$PLC_think_PLC$",
}

async function parseMessageContent(content, mediaFiles) {

    let mocovv = null;

    // Preserve line breaks by replacing \n with <br> tags
    content = content.replace(/\n/g, "<br/>");

    // Process JSON message
    if (content.trim().startsWith("{") && content.trim().endsWith("}")) {
        // PLC json shortcuts
        for (const key in JSON_PLC) {
            if (content.includes(key)) {
                content = content.replace(new RegExp(key, 'g'), JSON_PLC[key]);
            }
        }
        
        if (content.includes("newTranslationState")) {
            // {"type":1,"data":{"newTranslationState":"<state>","messageTranslationLocale":"<locale>","isUpdate":<bool>,"isOldVersion":<bool>}}
            // => Translation towards <locale> is <state>
            content = `
            <div class="message-translation-state">
                <p class="message-translation-state-text">
                    Translation towards <span class="message-translation-state-locale">${content.match(/"messageTranslationLocale":"([^"]+)"/)[1]}</span> is <span class="message-translation-state-status">${content.match(/"newTranslationState":"([^"]+)"/)[1]}</span>
                </p>
                <details class="collapsible message-translation-state-details">
                    <summary class="message-translation-state-details-summary">Raw Data</summary>
                    <p class="message-translation-state-details-text">${content}</p>
                </details>
            </div>
            `;
        }
    }

    // Process JSON-Array message
    if (content.trim().startsWith("[") && content.trim().endsWith("]")) {

        // Parse the JSON array
        try {
            // Parse the string as JSON array
            const entries = JSON.parse(content.trim());

            content = `
            <div class="message-json-array">
            `;
            
            // Iterate over each entry in the parsed array
            entries.forEach(entry => {
                // Check if contentType is 'application/vnd.microsoft.card.popup'
                if (entry.contentType === 'application/vnd.microsoft.card.popup') {
                    content += parseJsonMsgForAppCard(entry).replace(/:\?/g, "$PLC_think_PLC$"); // Send to function to generate HTML
                }

                // Check if has field "type" is "message/engagement"
                else if (entry.type === "message/engagement") {
                    content += parseJsonMsgForEngagementCard(entry).replace(/:\?/g, "$PLC_think_PLC$"); // Send to function to generate HTML
                }
            });

            content += `</div>`;
        } catch (e) {
            console.error('Error while parsing JSON-Array message! Invalid JSON format:', e);
        }

        // PLC json shortcuts
        for (const key in JSON_PLC) {
            if (content.includes(key)) {
                content = content.replace(new RegExp(key, 'g'), JSON_PLC[key]);
            }
        }
    }

    // Process <partlist> tags asynchronously
    if (content.includes("<partlist")) {
        const matches = [...content.matchAll(/<partlist[^>]*>([\s\S]*?)<\/partlist>/g)];
        for (const match of matches) {
            const [mocovv2, parsedContent] = await parsePartlist(match[0]);
            if (mocovv2 && mocovv2 !== null) {
                mocovv = mocovv2;
            }
            content = content.replace(match[0], parsedContent);
        }
    }

    // Process <addmember> tags asynchronously
    if (content.includes("<addmember")) {
        const matches = [...content.matchAll(/<addmember[^>]*>([\s\S]*?)<\/addmember>/g)];
        for (const match of matches) {
            const parsedContent = await parseAddMember(match[0]);
            content = content.replace(match[0], parsedContent);
        }
    }

    // Process <removemember> tags asynchronously
    if (content.includes("<removemember")) {
        const matches = [...content.matchAll(/<removemember[^>]*>([\s\S]*?)<\/removemember>/g)];
        for (const match of matches) {
            const parsedContent = await parseRemoveMember(match[0]);
            content = content.replace(match[0], parsedContent);
        }
    }

    // Process <URIObject> tags asynchronously
    if (content.includes("<URIObject")) {
        const matches = [...content.matchAll(/<URIObject[^>]*>([\s\S]*?)<\/URIObject>/g)];
        for (const match of matches) {
            const parsedContent = await parseURIObject(match[0], mediaFiles);
            content = content.replace(match[0], parsedContent);
        }
    }

    // Process <c_i> tags asynchronously
    if (content.includes("<c_i")) {
        const matches = [...content.matchAll(/<c_i[^>]*><\/c_i>/g)];
        for (const match of matches) {
            const parsedContent = await parseCITag(match[0]);
            content = content.replace(match[0], parsedContent);
        }
    }

    // Process <historydisclosedupdate> tags asynchronously
    if (content.includes("<historydisclosedupdate")) {
        const matches = [...content.matchAll(/<historydisclosedupdate[^>]*>([\s\S]*?)<\/historydisclosedupdate>/g)];
        for (const match of matches) {
            const parsedContent = await parseHistoryDisclosedUpdate(match[0]);
            content = content.replace(match[0], parsedContent);
        }
    }

    // Process <ss> tags asynchronously
    if (content.includes("<ss")) {
        const matches = [...content.matchAll(/<ss[^>]*>([\s\S]*?)<\/ss>/g)];
        for (const match of matches) {
            const parsedContent = await parseSSTag(match[0]);
            content = content.replace(match[0], parsedContent);
        }
    }

    // Process inline emoticons
    content = await processHTMLString(content, EMOTICON_MAPPING);

    // re-replace JSON_PLC shortcuts
    for (const [key, value] of Object.entries(JSON_PLC)) {
        if (content.includes(value)) {
            content = content.replace(new RegExp(value.replace(/[.*+?^=!:${}()|\[\]\/\\]/g, '\\$&'), 'g'), key);
        }
    }
    for (const [key, value] of Object.entries(JSON_PLC_MAN)) {
        if (content.includes(value)) {
            content = content.replace(new RegExp(value.replace(/[.*+?^=!:${}()|\[\]\/\\]/g, '\\$&'), 'g'), key);
        }
    }

    //return escapeHtml(content);
    return [mocovv, content];
}

async function parseSSTag(xmlString) {
    // Find the "type" attribute in the <ss> tag if not found, use the html-content, then send this to parseEmoticonString
    if (xmlString.includes("type=")) {
        // Extract type attribute and send to parseEmoticonString
        const typeMatch = xmlString.match(/type="([^"]+)"/);
        if (typeMatch) {
            const type = typeMatch[1];
            //const typeEmoticonMatch = await parseEmoticon("("+type+")", EMOTICON_MAPPING);
            const typeEmoticonMatch = await parseEmoticon(type, EMOTICON_MAPPING);
            // if typeEmoticonMatch is not null, return the emoticon
            if (typeEmoticonMatch !== null) {
                //console.log(`Type matched! (${type})`);
                return typeEmoticonMatch;
            }
            //console.log(`Type did not match! (${type})`);
        }
    }

    // If no type attribute or type was not found, extract the content inside the <ss> tag and send to parseEmoticonString
    const contentMatch = xmlString.match(/<ss[^>]*>([\s\S]*?)<\/ss>/);
    if (contentMatch) {
        let content = contentMatch[1];
        
        content = parseEmoticonStringExtracting(content, EMOTICON_MAPPING);

        // Return the parsed string
        return content;
    }

    // If no type is found, return the original string
    return escapeHtml(xmlString);
}

async function parsePartlist(xmlString) {
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");
        const partlist = xmlDoc.querySelector("partlist");

        if (partlist) {
            const type = partlist.getAttribute("type");
            const parts = Array.from(partlist.getElementsByTagName("part"));

            const participants = parts.map((part) => {
                const identity = part.getAttribute("identity");
                const duration = part.querySelector("duration")?.textContent;
                return { identity, duration };
            });

            switch (type) {
                case "started":
                    return ["message-callinfo",`<div class="call-info">
                        <div class="call-status started">
                            <svg class="call-status-icon call-status-icon-started" width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M14.0497 6C15.0264 6.19057 15.924 6.66826 16.6277 7.37194C17.3314 8.07561 17.8091 8.97326 17.9997 9.95M14.0497 2C16.0789 2.22544 17.9713 3.13417 19.4159 4.57701C20.8606 6.01984 21.7717 7.91101 21.9997 9.94M10.2266 13.8631C9.02506 12.6615 8.07627 11.3028 7.38028 9.85323C7.32041 9.72854 7.29048 9.66619 7.26748 9.5873C7.18576 9.30695 7.24446 8.96269 7.41447 8.72526C7.46231 8.65845 7.51947 8.60129 7.63378 8.48698C7.98338 8.13737 8.15819 7.96257 8.27247 7.78679C8.70347 7.1239 8.70347 6.26932 8.27247 5.60643C8.15819 5.43065 7.98338 5.25585 7.63378 4.90624L7.43891 4.71137C6.90747 4.17993 6.64174 3.91421 6.35636 3.76987C5.7888 3.4828 5.11854 3.4828 4.55098 3.76987C4.2656 3.91421 3.99987 4.17993 3.46843 4.71137L3.3108 4.86901C2.78117 5.39863 2.51636 5.66344 2.31411 6.02348C2.08969 6.42298 1.92833 7.04347 1.9297 7.5017C1.93092 7.91464 2.01103 8.19687 2.17124 8.76131C3.03221 11.7947 4.65668 14.6571 7.04466 17.045C9.43264 19.433 12.295 21.0575 15.3284 21.9185C15.8928 22.0787 16.1751 22.1588 16.588 22.16C17.0462 22.1614 17.6667 22 18.0662 21.7756C18.4263 21.5733 18.6911 21.3085 19.2207 20.7789L19.3783 20.6213C19.9098 20.0898 20.1755 19.8241 20.3198 19.5387C20.6069 18.9712 20.6069 18.3009 20.3198 17.7333C20.1755 17.448 19.9098 17.1822 19.3783 16.6508L19.1835 16.4559C18.8339 16.1063 18.6591 15.9315 18.4833 15.8172C17.8204 15.3862 16.9658 15.3862 16.3029 15.8172C16.1271 15.9315 15.9523 16.1063 15.6027 16.4559C15.4884 16.5702 15.4313 16.6274 15.3644 16.6752C15.127 16.8453 14.7828 16.904 14.5024 16.8222C14.4235 16.7992 14.3612 16.7693 14.2365 16.7094C12.7869 16.0134 11.4282 15.0646 10.2266 13.8631Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Call started
                        </div>
                        <div class="participants">
                            ${participants.map((p) => `<div class="participant">${formatUserId(p.identity)}</div>`).join("")}
                        </div>
                    </div>`];
                case "ended":
                    return ["message-callinfo",`<div class="call-info">
                        <div class="call-status ended">
                            <svg class="call-status-icon call-status-icon-ended" width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5.47542 12.8631C4.44449 11.2622 3.67643 9.54121 3.17124 7.76131C3.01103 7.19687 2.93093 6.91464 2.9297 6.5017C2.92833 6.04347 3.08969 5.42298 3.31412 5.02348C3.51636 4.66345 3.78117 4.39863 4.3108 3.86901L4.46843 3.71138C4.99987 3.17993 5.2656 2.91421 5.55098 2.76987C6.11854 2.4828 6.7888 2.4828 7.35636 2.76987C7.64174 2.91421 7.90747 3.17993 8.43891 3.71138L8.63378 3.90625C8.98338 4.25585 9.15819 4.43066 9.27247 4.60643C9.70347 5.26932 9.70347 6.1239 9.27247 6.7868C9.15819 6.96257 8.98338 7.13738 8.63378 7.48698C8.51947 7.60129 8.46231 7.65845 8.41447 7.72526C8.24446 7.96269 8.18576 8.30695 8.26748 8.58731C8.29048 8.6662 8.32041 8.72855 8.38028 8.85324C8.50111 9.10491 8.62956 9.35383 8.76563 9.59967M11.1817 12.8179L11.2266 12.8631C12.4282 14.0646 13.7869 15.0134 15.2365 15.7094C15.3612 15.7693 15.4235 15.7992 15.5024 15.8222C15.7828 15.904 16.127 15.8453 16.3644 15.6752C16.4313 15.6274 16.4884 15.5702 16.6027 15.4559C16.9523 15.1063 17.1271 14.9315 17.3029 14.8172C17.9658 14.3862 18.8204 14.3862 19.4833 14.8172C19.6591 14.9315 19.8339 15.1063 20.1835 15.4559L20.3783 15.6508C20.9098 16.1822 21.1755 16.448 21.3198 16.7333C21.6069 17.3009 21.6069 17.9712 21.3198 18.5387C21.1755 18.8241 20.9098 19.0898 20.3783 19.6213L20.2207 19.7789C19.6911 20.3085 19.4263 20.5733 19.0662 20.7756C18.6667 21 18.0462 21.1614 17.588 21.16C17.1751 21.1588 16.8928 21.0787 16.3284 20.9185C13.295 20.0575 10.4326 18.433 8.04466 16.045L7.99976 16M20.9996 3L2.99961 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Call ended
                        </div>
                        <div class="participants">
                            ${participants.map((p) => `<div class="participant">${formatUserId(p.identity)}${p.duration ? ` (${formatDuration(p.duration)})` : ""}</div>`).join("")}
                        </div>
                    </div>`];
                case "missed":
                    return ["message-callinfo",`
                    <div class="call-info">
                        <div class="call-status missed">
                            <svg class="call-status-icon call-status-icon-missed" width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4.85864 6C6.67357 4.14864 9.20268 3 12.0001 3C14.7975 3 17.3266 4.14864 19.1415 6M16.4723 9C15.3736 7.7725 13.777 7 12 7C10.223 7 8.62647 7.7725 7.52783 9M12 17C13.5105 17 14.9608 17.2576 16.3094 17.7313C16.3542 17.747 16.3767 17.7549 16.412 17.7705C16.7326 17.9118 16.9788 18.2591 17.0058 18.6084C17.0088 18.647 17.0088 18.6811 17.0088 18.7494C17.0088 18.9821 17.0088 19.0985 17.0185 19.1965C17.1122 20.1457 17.8631 20.8966 18.8123 20.9903C18.9103 21 19.0267 21 19.2594 21H19.5044C19.965 21 20.1952 21 20.3868 20.9622C21.1829 20.8053 21.8053 20.1829 21.9622 19.3868C22 19.1952 22 18.965 22 18.5044V18.3062C22 17.831 22 17.5933 21.9493 17.3209C21.8358 16.7119 21.3933 15.9583 20.9166 15.5624C20.7035 15.3854 20.5589 15.3048 20.2698 15.1435C17.822 13.7781 15.0019 13 12 13C8.99812 13 6.17797 13.7781 3.73021 15.1435C3.4411 15.3048 3.29654 15.3854 3.0834 15.5624C2.60675 15.9583 2.16421 16.7119 2.05074 17.3209C2 17.5933 2 17.831 2 18.3062V18.5044C2 18.965 2 19.1952 2.03776 19.3868C2.19469 20.1829 2.81709 20.8053 3.61321 20.9622C3.80476 21 4.03504 21 4.4956 21H4.74057C4.97332 21 5.0897 21 5.18773 20.9903C6.13689 20.8966 6.8878 20.1457 6.98152 19.1965C6.9912 19.0985 6.9912 18.9821 6.9912 18.7494C6.9912 18.6811 6.9912 18.647 6.99418 18.6084C7.02122 18.2591 7.2674 17.9118 7.58798 17.7705C7.62335 17.7549 7.64577 17.747 7.69061 17.7313C9.03921 17.2576 10.4895 17 12 17Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Call missed
                        </div>
                    </div>`];
                default:
                    return [null, escapeHtml(xmlString)];
            }
        }
    } catch (e) {
        console.error("Error parsing partlist XML:", e);
    }
    return [null, escapeHtml(xmlString)];
}

async function parseAddMember(xmlString) {
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");
        const addmember = xmlDoc.querySelector("addmember");

        if (addmember) {
            const initiator = addmember.querySelector("initiator")?.textContent;
            const targets = Array.from(addmember.querySelectorAll("target")).map((target) => target.textContent);

            if (initiator && targets.length > 0) {
                return `<span class="event-initiator">${formatUserId(initiator)}</span> added ${targets.map((target) => `<span class="event-target">${formatUserId(target)}</span>`).join(", ")} to the group.`;
            }
        }
    } catch (e) {
        console.error("Error parsing addmember XML:", e);
    }
    return escapeHtml(xmlString);
}

async function parseRemoveMember(xmlString) {
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");
        const removemember = xmlDoc.querySelector("removemember");

        if (removemember) {
            const initiator = removemember.querySelector("initiator")?.textContent;
            const targets = Array.from(removemember.querySelectorAll("target")).map((target) => target.textContent);

            if (initiator && targets.length > 0) {
                return `<span class="event-initiator">${formatUserId(initiator)}</span> removed ${targets.map((target) => `<span class="event-target">${formatUserId(target)}</span>`).join(", ")} from the group.`;
            }
        }
    } catch (e) {
        console.error("Error parsing removemember XML:", e);
    }
    return escapeHtml(xmlString);
}

async function parseURIObject(xmlString, mediaFiles) {
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");
        const uriObject = xmlDoc.querySelector("URIObject");

        if (uriObject) {
            const type = uriObject.getAttribute("type");
            const uri = uriObject.getAttribute("uri");
            let urlThumbnail = uriObject.getAttribute("url_thumbnail");
            const docId = uriObject.getAttribute("doc_id");

            if (docId) {
                const mediaKey = Object.keys(mediaFiles).find(key => key.endsWith(`${docId}.json`));
                if (mediaKey) {
                    try {
                        const file = mediaFiles[mediaKey];
                        const jsonText = await file.text();
                        const jsonData = JSON.parse(jsonText);

                        if (jsonData.contents) {
                            const contentKeys = Object.keys(jsonData.contents);
                            for (const i of contentKeys) {
                                const mimeType = jsonData.contents[i].type;
                                const mimeExtension = mimeType.split("/").pop();
                                const mediaFileKey = `${docId}.${i}.${mimeExtension}`;

                                // See if any key in mediaFiles ends with mediaFileKey
                                found = null;
                                for (const key in mediaFiles) {
                                    if (key.endsWith(mediaFileKey)) {
                                        found = key;
                                        break;
                                    }
                                }

                                if (found != null) {
                                    const blobUrl = await URL.createObjectURL(mediaFiles[found]);

                                    const originalName = uriObject.querySelector("OriginalName")?.getAttribute("v") || "";
                                    const fileSize = uriObject.querySelector("FileSize")?.getAttribute("v") || "";
                                    const htmlContent = uriObject.textContent.replace(/<OriginalName.*\/OriginalName>|<FileSize.*\/FileSize>|<meta.*\/meta>/g, "");
                                    const formattedSize = fileSize ? formatFileSize(fileSize) : "";
                                    
                                    // Check if type is Picture.1
                                    if (type.startsWith("Picture.") && uri) {
                                        /*
                                        return `
                                            <div class="message-uriobject-${type.toLowerCase()}" data-uriobject-doc-id="${docId}">
                                                <div class="message-uriobject-thumbnail">
                                                    <img src="${blobUrl}" class="message-uriobject-resolved-media" alt="URIObject Thumbnail">
                                                </div>
                                                <div class="message-uriobject-overlay-wrapper">
                                                    <p class="message-uriobject-overlay-file">
                                                        <span class="message-uriobject-overlay-filename">${originalName}</span> <span class="message-uriobject-overlay-size">(${formattedSize})</span>
                                                    </p>
                                                </div>
                                            </div>
                                        `;
                                        */
                                        return `
                                            <div class="message-uriobject-${type.toLowerCase()}" data-uriobject-doc-id="${docId}">
                                                <div class="message-uriobject-thumbnail">
                                                    <img src="${blobUrl}" class="message-uriobject-resolved-media" alt="URIObject Thumbnail">
                                                </div>
                                                <details class="collapsible message-uriobject-overlay-wrapper">
                                                    <summary class="message-uriobject-overlay-file"><span class="message-uriobject-overlay-filename">${originalName}</span> <span class="message-uriobject-overlay-size">(${formattedSize})</span></summary>
                                                    <p class="message-uriobject-overlay-text">
                                                        ${linkify(htmlContent)}
                                                    </p>
                                                </details>
                                            </div>
                                        `;
                                    } else if (type.startsWith("File.") && uri) {
                                        const originalNameDI = uriObject.querySelector("OriginalName")?.getAttribute("v") || "";
                                        const fileSizeDI = uriObject.querySelector("FileSize")?.getAttribute("v") || "";
                                        const htmlContentDI = uriObject.textContent.replace(/<OriginalName.*\/OriginalName>|<FileSize.*\/FileSize>|<meta.*\/meta>/g, "");
                                        const formattedSizeDI = fileSizeDI ? formatFileSize(fileSizeDI) : "";
                        
                                        return `
                                            <div class="message-uriobject-${type.toLowerCase()}" data-uriobject-doc-id="${docId}">
                                                <div class="message-uriobject-thumbnail">
                                                    <img src="${blobUrl}" class="message-uriobject-resolved-media" alt="URIObject Thumbnail">
                                                </div>
                                                <details class="message-uriobject-overlay-wrapper">
                                                    <summary><a class="message-uriobject-overlay-file" href="${uri}"><span class="message-uriobject-overlay-filename">${originalNameDI}</span> <span class="message-uriobject-overlay-size">(${formattedSizeDI})</span></a></summary>
                                                    <p class="message-uriobject-overlay-text">
                                                        ${linkify(htmlContentDI)}
                                                    </p>
                                                </details>
                                            </div>
                                        `;
                                    }
                                }
                            }
                        }
                    } catch (error) {
                        console.error("Error processing media file:", error);
                    }
                    return;
                }
            }

            if (type) {
                if (type.startsWith("Picture.") && uri) {
                    const originalName = uriObject.querySelector("OriginalName")?.getAttribute("v") || "";
                    const fileSize = uriObject.querySelector("FileSize")?.getAttribute("v") || "";
                    const htmlContent = uriObject.textContent.replace(/<OriginalName.*\/OriginalName>|<FileSize.*\/FileSize>|<meta.*\/meta>/g, "");
                    const formattedSize = fileSize ? formatFileSize(fileSize) : "";

                    return `
                        <div class="message-uriobject-${type.toLowerCase()}" data-uriobject-doc-id="${docId}">
                            <div class="message-uriobject-thumbnail">
                                <img src="${urlThumbnail}" class="js-auto-replace-with-link-on-fail" alt="URIObject Thumbnail">
                            </div>
                            <div class="message-uriobject-overlay-wrapper">
                                <p class="message-uriobject-overlay-file">
                                    <span class="message-uriobject-overlay-filename">${originalName}</span> <span class="message-uriobject-overlay-size">(${formattedSize})</span>
                                </p>
                                <p class="message-uriobject-overlay-text">
                                    ${linkify(htmlContent)}
                                </p>
                            </div>
                        </div>
                    `;
                } else if (type.startsWith("Audio.") && uri) {
                    const title = uriObject.querySelector("Title")?.textContent || "";
                    const originalName = uriObject.querySelector("OriginalName")?.getAttribute("v") || "";
                    return `
                        <div class="message-uriobject-${type.toLowerCase()}" data-uriobject-doc-id="${docId}">
                            <p class="message-uriobject-title">${title}</p>
                            <p class="message-uriobject-file">
                                <audio controls src="${uri}"></audio>
                                <span>${originalName}</span>
                            </p>
                        </div>
                    `;
                } else if (type === "SWIFT.1") {
                    const title = uriObject.querySelector("Title")?.textContent || "";
                    const swiftDataBase64 = uriObject.querySelector("Swift")?.getAttribute("b64");
                    const htmlContent = uriObject.textContent.replace(/<Title.*\/Title>|<Swift.*\/Swift>/g, "");

                    if (swiftDataBase64) {
                        try {
                            const decodedData = atob(swiftDataBase64); // Decode base64
                            const utf8Decoder = new TextDecoder('utf-8');
                            const decodedText = utf8Decoder.decode(new Uint8Array([...decodedData].map(c => c.charCodeAt(0)))); // Decode to UTF-8
                    
                            let jsonData = null;
                            try {
                                jsonData = JSON.parse(decodedText); // Try parsing as JSON
                            } catch (error) {
                                jsonData = { type: "text", content: decodedText }; // Default to text if invalid JSON
                            }
                    
                            if (jsonData.type === "message/card" && jsonData.attachments) {
                                const attachment = jsonData.attachments[0];
                                if (attachment.contentType === "application/vnd.microsoft.card.flex" && attachment.content.images) {
                                    const cardContent = attachment.content;
                                    const imagesHtml = cardContent.images.map(image => {
                                        return `
                                            <div class="flex-card-image">
                                                <img src="${image.url}" alt="${image.alt}" style="width: ${cardContent.aspect.split(":")[0]}px; height: ${cardContent.aspect.split(":")[1]}px;">
                                            </div>
                                        `;
                                    }).join('');
                    
                                    return `
                                        <div class="message-card message-card-flex">
                                            <div class="message-card-subtitle">${cardContent.subtitle}</div>
                                            <div class="message-card-images">
                                                ${imagesHtml}
                                            </div>
                                        </div>
                                    `;
                                }
                            } else {
                                // Fallback to displaying base64 data as text
                                return `
                                    <div class="message-uriobject-${type.toLowerCase()}" data-uriobject-doc-id="${docId}">
                                        <div class="message-uriobject-thumbnail">
                                            <img src="${urlThumbnail}" alt="URIObject Thumbnail">
                                        </div>
                                        <div class="message-uriobject-overlay-wrapper">
                                            <p class="message-uriobject-overlay-file">${title}</p>
                                            <p class="message-uriobject-overlay-text">${linkify(htmlContent)}${jsonData.content}</p>
                                        </div>
                                    </div>
                                `;
                            }
                        } catch (error) {
                            console.error("Error decoding or parsing SWIFT data:", error);
                        }
                    }
                } else if (type === "Video.2/CallRecording.1" && uri) {
                    const title = uriObject.querySelector("Title")?.textContent || "Call Recording";
                    const recordingContentUrl = uriObject.querySelector("RecordingContent item[type='video']")?.getAttribute("uri") || uri;
                    const originalName = uriObject.querySelector("OriginalName")?.getAttribute("v") || "Recording";
                    const recordingStatus = uriObject.querySelector("RecordingStatus")?.getAttribute("status") || "Unknown";
                    const sessionEndReason = uriObject.querySelector("SessionEndReason")?.getAttribute("value") || "Unknown";
                    const timestamp = uriObject.querySelector("RecordingContent")?.getAttribute("timestamp") || "";
                    const duration = uriObject.querySelector("RecordingContent")?.getAttribute("duration") || "0";
                    // If AMSDocumentID is present, it is doc_id so attempt media-extract and if found replace urlThumbnail
                    const amsDocumentIdElement = uriObject.querySelector("Identifiers Id[type='AMSDocumentID']");
                    if (amsDocumentIdElement) {
                        const amsId = amsDocumentIdElement.getAttribute("value")
                        for (mediaFile of Object.keys(mediaFiles)) {
                            mediaFileName = mediaFile.split("/").pop();
                            mediaFileExt = mediaFileName.split(".").pop();
                            if (mediaFileName.startsWith(amsId) && mediaFileExt != "json") {
                                const blobUrl = URL.createObjectURL(mediaFiles[mediaFile]);
                                urlThumbnail = blobUrl;
                                break;
                            }
                        }
                    }
                    
                    return `
                        <div class="message-uriobject-${type.toLowerCase()}" data-uriobject-doc-id="${docId}">
                            <div class="message-uriobject-thumbnail">
                                <img src="${urlThumbnail}" class="js-auto-replace-with-link-on-fail" alt="URIObject Thumbnail">
                            </div>
                            <div class="message-uriobject-overlay-wrapper">
                                <p class="message-uriobject-title">${title}</p>
                                <p class="message-uriobject-overlay-file">
                                    <span class="message-uriobject-overlay-filename">${originalName}</span>
                                    <span class="message-uriobject-overlay-duration">(${formatDuration(parseFloat(duration))})</span>
                                    <span class="message-uriobject-overlay-timestamp">[${formatDate(timestamp)}]</span>
                                </p>
                            </div>
                            <div class="message-uriobject-video">
                                <video controls>
                                    <source src="${recordingContentUrl}" />
                                    Your browser does not support the video tag.
                                </video>
                                <p class="message-uriobject-video-text">
                                    <span class="message-uriobject-video-status">Status: ${recordingStatus}</span><br>
                                    <span class="message-uriobject-video-endreason">End Reason: ${sessionEndReason}</span>
                                </p>
                            </div>
                        </div>
                    `;
                } else if (type === "File.1" && uri) {
                    const originalName = uriObject.querySelector("OriginalName")?.getAttribute("v") || "";
                    const fileSize = uriObject.querySelector("FileSize")?.getAttribute("v") || "";
                    const htmlContent = uriObject.textContent.replace(/<OriginalName.*\/OriginalName>|<FileSize.*\/FileSize>|<meta.*\/meta>/g, "");
                    const formattedSize = fileSize ? formatFileSize(fileSize) : "";
    
                    return `
                        <div class="message-uriobject-${type.toLowerCase()}" data-uriobject-doc-id="${docId}">
                            <div class="message-uriobject-thumbnail">
                                <img src="${urlThumbnail}" class="js-auto-replace-with-link-on-fail" alt="URIObject Thumbnail">
                            </div>
                            <div class="message-uriobject-overlay-wrapper">
                                <a class="message-uriobject-overlay-file" href="${uri}">
                                    <span class="message-uriobject-overlay-filename">${originalName}</span> <span class="message-uriobject-overlay-size">(${formattedSize})</span>
                                </a>
                                <p class="message-uriobject-overlay-text">
                                    ${linkify(htmlContent)}
                                </p>
                            </div>
                        </div>
                    `;
                }
            }
        }
    } catch (e) {
        console.error("Error parsing URIObject XML:", e);
    }
    return escapeHtml(xmlString);
}

async function parseHistoryDisclosedUpdate(tagContent) {
    // Extract the values inside the <historydisclosedupdate> tag
    const eventTimeMatch = tagContent.match(/<eventtime>(.*?)<\/eventtime>/);
    const initiatorMatch = tagContent.match(/<initiator>(.*?)<\/initiator>/);
    const valueMatch = tagContent.match(/<value>(.*?)<\/value>/);

    if (eventTimeMatch && initiatorMatch && valueMatch) {
        const initiator = initiatorMatch[1];
        const boolValue = valueMatch[1] === "true"; // Assuming %bool% is a boolean value (true/false)

        // Return the appropriate message based on the value of %bool%
        if (boolValue) {
            return `<p class="message-event-historydisclosed-update message-event-historydisclosed-update-true"><span class="event-initiator">${initiator}</span> made chat history available for all.</p>`;
        } else {
            return `<p class="message-event-historydisclosed-update message-event-historydisclosed-update-false"><span class="event-initiator">${initiator}</span> made chat history not available for all.</p>`;
        }
    }

    // Return the original tag if any necessary value is missing
    return tagContent;
}


function parseCITag(xmlString) {
    const regex = /<c_i id="([^"]*)" style="([^"]*)"><\/c_i>/;
    const match = regex.exec(xmlString);
    if (match) {
        return `<br><p class="message-ci-tag">[c_i=${match[1]};style=${match[2]}]</p>`;
    }
    return escapeHtml(xmlString);
}


async function processHTMLString(content, EMOTICON_MAPPING) {
    const tagList = [];
    const selfClosingTags = ['br', 'hr', 'img', 'input', 'meta', 'link'];

    // Replace in-explicitly self-closing tags first
    content = content.replace(new RegExp(`<(${selfClosingTags.join('|')})([^>]*)>`, 'g'), (match) => {
        let index = tagList.length;
        tagList.push(match);
        return '$PLC' + index + 'PLC$'; // Replace with placeholder
    });
    
    /*
    // Regex to capture full HTML elements (ensuring minimal matching)
    content = content.replace(/<([a-zA-Z0-9]+)([^>]*)>(.*?)?<\/\1>|<([a-zA-Z0-9]+)([^>]*)\/>/gs, (match) => {
        let index = tagList.length;
        tagList.push(match); // Save the full tag
        return '$PLC' + index + 'PLC$'; // Replace with placeholder
    });
    */
    // Regex to capture only outermost full HTML elements (including nested tags properly)
    content = content.replace(/<([a-zA-Z0-9]+)([^>]*)>(.*?)<\/\1>/gs, (match, tagName, attrs, innerContent) => {
        // Check if inner content contains tags, if so, skip this match
        if (/<([a-zA-Z0-9]+)[^>]*>/g.test(innerContent)) {
            return match; // Don't replace if the tag contains other tags (nested)
        }

        let index = tagList.length;
        tagList.push(match);  // Save the full tag
        return '$PLC' + index + 'PLC$';  // Replace with placeholder
    });

    // Process content through the emoticon parser
    content = await parseEmoticonStringExtracting(content, EMOTICON_MAPPING);

    // Replacing placeholders with original HTML elements
    content = content.replace(/\$PLC(\d+)PLC\$/g, (_, index) => {
        return tagList[index]}
    );
    //// Twice incase of nested tags
    content = content.replace(/\$PLC(\d+)PLC\$/g, (_, index) => {
        return tagList[index]}
    );

    return content;
}


function formatDate(dateInput) {
    const date = new Date(dateInput);
    
    // Get day
    const day = date.getDate();
    
    // Format date parts
    const month = date.toLocaleString(undefined, { month: 'short' });
    const year = date.getFullYear();
    const time = date.toLocaleTimeString(undefined, { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        hourCycle: 'h23' 
    });

    return `${day} ${month} ${year}, ${time}`;
}

function formatUserId(id) {
    return id.replace(/^8:/, '');
}

function escapeHtml(content) {
    return content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/\n/g, '<br>');
}

function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    //return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    // show remaining seconds without leading zero and 2 decimals
    return `${minutes}min, ${remainingSeconds.toFixed(2).replace(/\.?0+$/, '')}s`;

}

function formatFileSize(bytes) {
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    if (bytes === 0) return "0 Byte";
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + " " + sizes[i];
}

function linkify(text) {
    const urlPattern = /https?:\/\/[^\s]+/g; // Match HTTP/HTTPS URLs
    return text.replace(urlPattern, url => `<a href="${url}" target="_blank">${url}</a>`);
}