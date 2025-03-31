function renderMediaTab(mediaFiles) {

    // Create mediaGrid
    const mediaGrid = document.createElement("div");
    mediaGrid.classList.add("media-grid");

    // Iterate all mediaFiles find all .json files and then group then with all the other files that begin with their filename
    // It is either <id>.json or <id>.<i>.json
    const mediaEntries = {}; // {"<fileid>": {"json": "<json-file>", "media": {"<i>":"<media-file>",...}}}

    Object.entries(mediaFiles).forEach(([file, blob]) => {
        // Extract filename from possible path
        const filename = file.split("/").pop();
        const fileParts = filename.split(".");
        if (fileParts.length > 1) {
            const fileId = fileParts[0];
            const fileExt = fileParts[1];
            if (fileExt === "json") {
                mediaEntries[fileId] = { json: blob, media: {} };
            } else if (mediaEntries[fileId]) {
                mediaEntries[fileId].media[fileExt] = blob;
            }
        }
    });

    // Iterate all mediaEntries and render them
    for (const [fileId, fileEntry] of Object.entries(mediaEntries)) {
        renderMediaItem(fileId, fileEntry, mediaGrid);
    }

    return mediaGrid;
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

        outerGrid.appendChild(mediaGridBox);
        mediaGridBox.appendChild(mediaFilenameWrapper);
    }
}