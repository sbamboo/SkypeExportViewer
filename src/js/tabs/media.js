function renderMediaTab(mediaFiles) {

    // Make outer container div
    const mediaTab = document.createElement("div");
    mediaTab.classList.add("media-tab-wrapper");

    // Make a checkbox for "Mosaic View / Grid View"
    const mediaTabInnerWrapper = document.createElement("div");
    mediaTabInnerWrapper.classList.add("media-tab-inner-wrapper");

        const mediaTabCheckbox = document.createElement("input");
        mediaTabCheckbox.type = "checkbox";
        mediaTabCheckbox.id = "media-tab-mosaic-toggle";
        mediaTabCheckbox.checked = true; // Default to mosaic view
        
        const mediaTabCheckboxLabel = document.createElement("label");
        mediaTabCheckboxLabel.setAttribute("for", "media-tab-mosaic-toggle");
        mediaTabCheckboxLabel.innerText = "Mosaic View:";
        mediaTabCheckboxLabel.classList.add("media-tab-mosaic-toggle-label");

        const mediaTabCheckboxSpacer = document.createElement("hr");

        mediaTabInnerWrapper.appendChild(mediaTabCheckboxLabel);
        mediaTabInnerWrapper.appendChild(mediaTabCheckbox);
        mediaTabInnerWrapper.appendChild(mediaTabCheckboxSpacer);

    mediaTab.appendChild(mediaTabInnerWrapper);

    // Create mediaGrid as 3 column grid
    const mediaGrid = document.createElement("div");
    mediaGrid.classList.add("media-grid");
    mediaGrid.classList.add("mosaic-media-grid"); // Default to mosaic view
    mediaTab.appendChild(mediaGrid);

    // When checkbox is clicked, toggle between mosaic-media-grid and grid-media-grid
    mediaTabCheckbox.addEventListener("change", () => {
        if (mediaTabCheckbox.checked) {
            mediaGrid.classList.remove("grid-media-grid");
            mediaGrid.classList.add("mosaic-media-grid");
        } else {
            mediaGrid.classList.remove("mosaic-media-grid");
            mediaGrid.classList.add("grid-media-grid");
        }
    });

    // Iterate all mediaFiles find all .json files and then group then with all the other files that begin with their filename
    // It is either <id>.json or <id>.<i>.json
    const mediaEntries = {}; // {"<fileid>": {"json": "<json-file>", "media": {"<i>":"<media-file>",...}}}

    // Sort the files to the ones where file endswith json is first
    const sortedFiles = Object.keys(mediaFiles).sort((a, b) => {
        const aIsJson = a.endsWith(".json") ? 0 : 1;
        const bIsJson = b.endsWith(".json") ? 0 : 1;
        return aIsJson - bIsJson;
    });

    for (const file of sortedFiles) {
        const blob = mediaFiles[file];
        // Extract filename from possible path
        const filename = file.split("/").pop();
        const fileParts = filename.split(".");
        if (fileParts.length > 1) {
            const fileId = fileParts[0];
            const fileExt = fileParts[1];
            if (fileExt === "json") {
                mediaEntries[fileId] = { json: blob, media: {} };
            } else if (mediaEntries.hasOwnProperty(fileId) === true) {
                mediaEntries[fileId].media[fileExt] = blob;
            }
        }
    }

    // Iterate all mediaEntries and render them
    Object.entries(mediaEntries).forEach(async ([fileId, fileEntry]) => {
        const elem = await renderMediaItem(fileId, fileEntry, mediaGrid);
        if (elem) {
            mediaGrid.appendChild(elem);
        }
    });

    return mediaTab;
}

async function renderMediaItem(fileId, fileEntryObj, outerGrid) {
    const fileEntryData = JSON.parse(await fileEntryObj.json.text()); // {"expiry_date":"yyyy-MM-ddThh:mm:ss.xxxxxxxZ","filename":"<filename>","contents":{"<i>":{"type":"<mimeType>"}}}

    // Transform into
    // const fileData = {"fileId":"<fileId>", "expiry_date":"yyyy-MM-ddThh:mm:ss.xxxxxxxZ", "filename":"<filename>", "contents":{"<i>":{"type":"<mimeType>","media":"<media-file>"}}}
    const fileEntry = {
        fileId: fileId,
        expiry_date: fileEntryData.expiry_date,
        filename: fileEntryData.filename,
        contents: {}
    }

    if (!fileEntryData.contents) {
        console.error("No contents found in file entry data:", fileEntryData);
        return;
    }

    for (const [i, content] of Object.entries(fileEntryData.contents)) {
        fileEntry.contents[i] = { type: content.type, media: fileEntryObj.media[i] };
    }

    // Make a box for each content item
    for (const [i, content] of Object.entries(fileEntry.contents)) {
        // Create blob-url for the content item
        const mediaUrl = URL.createObjectURL(content.media);
        const mimeType = content.type;

        const mediaGridBox = document.createElement("div");
        mediaGridBox.classList.add("media-grid-box");
        mediaGridBox.setAttribute("data-mediafile-id", fileId);
        mediaGridBox.setAttribute("data-mediafile-index", i);
        mediaGridBox.setAttribute("data-mediafile-expiry", fileEntry.expiry_date);
        mediaGridBox.setAttribute("data-mediafile-mimeType", content.type);

            const mediaFilenameWrapper = document.createElement("div");
            mediaFilenameWrapper.classList.add("media-filename-wrapper");
                const mediaFilename = document.createElement("a");
                mediaFilename.href = mediaUrl;
                mediaFilename.download = fileEntry.filename;
                mediaFilename.innerText = fileEntry.filename;
                mediaFilename.classList.add("media-filename");
                mediaFilenameWrapper.appendChild(mediaFilename);

            // Handle image
            if (mimeType.startsWith("image/")) {
                // Make image with text on it in the bottom left with filename, if click filename download image
                const img = document.createElement("img");
                img.src = mediaUrl;
                img.alt = fileEntry.filename;
                img.classList.add("media-content");
                img.classList.add("media-image");
                mediaGridBox.appendChild(img);
        
            // Handle video files
            } else if (mimeType.startsWith("video/")) {
                // Make video with text on it in the bottom left with filename, if click filename download image
                const video = document.createElement("video");
                video.src = mediaUrl;
                video.controls = true;
                video.classList.add("media-content");
                video.classList.add("media-video");
                mediaGridBox.appendChild(video);
            
        
            // Handle audio files
            } else if (mimeType.startsWith("audio/")) {
                // Make audio with text on it in the bottom left with filename, if click filename download image
                const audio = document.createElement("audio");
                audio.src = mediaUrl;
                audio.controls = true;
                audio.classList.add("media-content");
                audio.classList.add("media-audio");
                mediaGridBox.appendChild(audio);
        
            // Handle gif files
            } else if (mimeType.startsWith("gif/")) {
                // Make gif with text on it in the bottom left with filename, if click filename download image
                const gif = document.createElement("img");
                gif.src = mediaUrl;
                gif.alt = fileEntry.filename;
                gif.classList.add("media-content");
                gif.classList.add("media-gif");
                mediaGridBox.appendChild(gif);
            }

        mediaGridBox.appendChild(mediaFilenameWrapper);
        return mediaGridBox;
    }
}