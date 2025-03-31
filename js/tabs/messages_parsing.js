async function parseMessageContent(content, mediaFiles) {
    // Process <partlist> tags asynchronously
    if (content.includes("<partlist")) {
        const matches = [...content.matchAll(/<partlist[^>]*>([\s\S]*?)<\/partlist>/g)];
        for (const match of matches) {
            const parsedContent = await parsePartlist(match[0]);
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

    // Presever line breaks by replacing \n with <br> tags
    content = content.replace(/\n/g, "<br>");

    //return escapeHtml(content);
    return content;
}

async function parseSSTag(xmlString) {
    // Find the "type" attribute in the <ss> tag if not found, use the html-content, then send this to parseEmoticonString
    if (xmlString.includes("type=")) {
        // Extract type attribute and send to parseEmoticonString
        const typeMatch = xmlString.match(/type="([^"]+)"/);
        if (typeMatch) {
            const type = typeMatch[1];
            console.log(`Checking type... (${type})`);
            const typeEmoticonMatch = await parseEmoticon(type, EMOTICON_MAPPING);
            // if typeEmoticonMatch is not null, return the emoticon
            if (typeEmoticonMatch !== null) {
                console.log(`Type matched! (${type})`);
                return typeEmoticonMatch;
            }
            console.log(`Type did not match! (${type})`);
        }
    }

    // If no type attribute or type was not found, extract the content inside the <ss> tag and send to parseEmoticonString
    const contentMatch = xmlString.match(/<ss[^>]*>([\s\S]*?)<\/ss>/);
    if (contentMatch) {
        console.log(`Checking content... (${contentMatch[1]})`);
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
                    return `<div class="call-info">
                        <div class="call-status started">Call started</div>
                        <div class="participants">
                            ${participants.map((p) => `<div class="participant">${formatUserId(p.identity)}</div>`).join("")}
                        </div>
                    </div>`;
                case "ended":
                    return `<div class="call-info">
                        <div class="call-status ended">Call ended</div>
                        <div class="participants">
                            ${participants.map((p) => `<div class="participant">${formatUserId(p.identity)}${p.duration ? ` (${formatDuration(p.duration)})` : ""}</div>`).join("")}
                        </div>
                    </div>`;
                case "missed":
                    return `<div class="call-info"><div class="call-status missed">Call missed</div></div>`;
                default:
                    return escapeHtml(xmlString);
            }
        }
    } catch (e) {
        console.error("Error parsing partlist XML:", e);
    }
    return escapeHtml(xmlString);
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
            const urlThumbnail = uriObject.getAttribute("url_thumbnail");
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
                                    const formattedSize = fileSize ? formatFileSize(fileSize) : "";
                                    
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
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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