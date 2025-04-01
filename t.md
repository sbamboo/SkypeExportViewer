I got the code
```JS
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
```

Can you add support for type="Video.2/CallRecording.1"
so when we get something like:
```XML
<URIObject
    uri="{uri}"
    url_thumbnail="{url_thumbnail}"
    type="File.1"
    doc_id="{doc_id}"
>
    {html_content}
    <OriginalName v="{originalName}"></OriginalName>
    <FileSize v="{fileSize}"></FileSize>
</URIObject>
```

it gets generated to something like
```HTML
<div class="message-uriobject-${type.toLowerCase()}" data-uriobject-doc-id="${docId}">
    <div class="message-uriobject-thumbnail">
        <img src="${url_thumbnail}" class="js-auto-replace-with-link-on-fail" alt="URIObject Thumbnail">
    </div>
    <div class="message-uriobject-overlay-wrapper">
        <p class="message-uriobject-overlay-file">
            <span class="message-uriobject-overlay-filename">${originalName}</span> <span class="message-uriobject-overlay-timestamp">[${formatDate(yyyy-MM-ddThh:mm:dd.xxxxxxxZ)}]</span> <span class="message-uriobject-overlay-duration">(${formatDuration(h:mm:ss.xx)})</span>
        </p>
    </div>
    <div class="message-uriobject-video">
        <div class="message-uriobject-video">
            <video controls>
                <source src="{recordingContentUrl}" />
                Your browser does not support the video tag.
            </video>
        </div>
        <p class="message-uriobject-video-text">
            <span class="message-uriobject-video-status">Status: ${recordingStatus}</span>
            <span class="message-uriobject-video-endreason">End Reason: ${sessionEndReason}</span>
        </p>
    </div>
</div>
```
