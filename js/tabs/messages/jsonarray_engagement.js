function formatUserId(id) {
    return id.replace(/^8:/, '');
}

function parseJsonMsgForEngagementCard(entry) {
    // if entry.schemaVersion is "1"
    if (entry.schemaVersion === "1") {
        return parseJsonMsgForEngagementCard_sc1(entry);
    }
}

function parseJsonMsgForEngagementCard_sc1(entry) {
    // Check if validUntilTimestamp has passed and add the timeinvalid class
    const validUntil = new Date(entry.validUntilTimestamp);
    const isTimeInvalid = new Date() > validUntil;
    const timeInvalidClass = isTimeInvalid ? 'message-engagement-timeinvalid' : '';
    
    // Start the outer container
    let html = `<div class="message-engagement ${timeInvalidClass}">`;

    // Iterate over each attachment
    entry.attachments.forEach(attachment => {
        // Check the contentType and whether skypeId exists
        if (attachment.contentType === 'application/vnd.microsoft.notice' && attachment.skypeId) {
            // Generate HTML for Skype-based notice
            html += `
                <div class="message-engagement-attachment message-engagement-attachment-appnotice message-engagement-attachment-appnotice-skypeid">
                    <div class="message-engagement-content-title">
                        <img src="${attachment.iconUrl}" alt="Icon" class="message-engagement-content-icon"/>
                    </div>
                    <div class="mesage-engagement-content">
                        <p class="message-engagement-content-text">${attachment.content.text.replace("{userFirstName}",formatUserId(attachment.skypeId))}</p>
                        <div class="mesage-engagement-content-buttons">
            `;
            // Generate buttons if available
            attachment.content.buttons.forEach(button => {
                const actionUri = button.actionUri;
                const buttonTitle = button.title;
                const actionTarget = button.actionTarget ? `data-actiontarget="${button.actionTarget}"` : '';
                html += `<a href="${actionUri}" ${actionTarget} class="message-engagement-button">${buttonTitle}</a>`;
            });
            html += `
                        </div>
                    </div>
                </div>
            `;
        } else if (attachment.contentType === 'application/vnd.microsoft.notice' && !attachment.skypeId) {
            // Generate HTML for notice without skypeId
            html += `
                <div class="message-engagement-attachment message-engagement-attachment-appnotice">
                    <div class="message-engagement-content-title-wrapper">
                        <p class="message-engagement-content-title">${attachment.content.title}</p>
                        <img src="${attachment.iconUrl}" alt="Icon" class="message-engagement-content-icon"/>
                    </div>
                    <div class="mesage-engagement-content">
                        <p class="message-engagement-content-modaltitle">${attachment.content.modalTitle}</p>
                        <p class="message-engagement-content-text">${attachment.content.text}</p>
                        <div class="mesage-engagement-content-buttons">
            `;
            // Generate buttons if available
            attachment.content.buttons.forEach(button => {
                const actionUri = button.actionUri;
                const buttonTitle = button.title;
                const actionTarget = button.actionTarget ? `data-actiontarget="${button.actionTarget}"` : '';
                html += `<a href="${actionUri}" ${actionTarget} class="message-engagement-button">${buttonTitle}</a>`;
            });
            html += `
                        </div>
                    </div>
                </div>
            `;
        }
    });

    // Close the outer container
    html += `</div>`;
    
    return html;
}