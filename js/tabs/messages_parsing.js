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
                        <div class="call-status started">Call started</div>
                        <div class="participants">
                            ${participants.map((p) => `<div class="participant">${formatUserId(p.identity)}</div>`).join("")}
                        </div>
                    </div>`];
                case "ended":
                    return ["message-callinfo",`<div class="call-info">
                        <div class="call-status ended">Call ended</div>
                        <div class="participants">
                            ${participants.map((p) => `<div class="participant">${formatUserId(p.identity)}${p.duration ? ` (${formatDuration(p.duration)})` : ""}</div>`).join("")}
                        </div>
                    </div>`];
                case "missed":
                    return ["message-callinfo",`<div class="call-info"><div class="call-status missed">Call missed</div></div>`];
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