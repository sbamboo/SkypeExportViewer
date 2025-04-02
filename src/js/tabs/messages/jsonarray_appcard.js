function parseJsonMsgForAppCard(entry) {
    let html = '';
    
    // Check for quietCard
    if (entry.quietCard) {
        html += `
<details class="collapsible message-appcard-wrapper message-appcard-quiet">
    <summary>View hidden AppCard</summary>
    <div class="message-appcard">
        ${generateJsonMsgForAppCardContent(entry)}
    </div>
</details>`;
    } else {
        html += `
<div class="message-appcard">
    ${generateJsonMsgForAppCardContent(entry)}
</div>`;
    }

    return html;
}

// Function to generate the card content based on the entry
function generateJsonMsgForAppCardContent(entry) {
    const content = entry.content;
    let contentHtml = `
<div class="message-appcard-content-title-wrapper">`
    if (entry.iconUrl) {
        contentHtml += `
    <div class="message-appcard-content-title-icon">
        <img src="${entry.iconUrl}" alt="Icon" class="message-appcard-content-icon"/>
    </div>`;
    }
contentHtml += `
    <div class="message-appcard-content-title">${content.title}</div>
</div>
<div class="message-appcard-content-text">${content.text}</div>
<div class="message-appcard-content-medias">${generateJsonMsgForAppCardMedias(content.media)}</div>
<div class="message-appcard-content-buttons">${generateJsonMsgForAppCardButtons(content.buttons)}</div>
<details class="collapsible message-appcard-content-wrapper">
    <summary class="message-appcard-content-inner-wrapper">Raw Data</summary>
    <div class="message-appcard-raw">
        <pre>${JSON.stringify(entry, null, 2)}</pre>
    </div>
</details>
`;    
    return contentHtml;
}

// Function to generate HTML for media
function generateJsonMsgForAppCardMedias(media) {
    let mediaHtml = '';
    if (Array.isArray(media)) {
        media.forEach(item => {
            if (item.mediaType === 'image' && item.width !== 0) {
                mediaHtml += `<img src="${item.url}" width="${item.width}" alt="Media"/>`;
            }
        });
    }
    return mediaHtml;
}

// Function to generate HTML for buttons
function generateJsonMsgForAppCardButtons(buttons) {
    let buttonsHtml = '';
    if (Array.isArray(buttons)) {
        buttons.forEach(button => {
            buttonsHtml += `
<a href="${button.actionUri}" data-actiontarget="${button.actionTarget}" class="message-appcard-content-button">
    ${button.title}
</a>`;
        });
    }
    return buttonsHtml;
}