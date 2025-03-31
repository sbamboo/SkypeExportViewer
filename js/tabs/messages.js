function renderMessagesTab(messages_json,mediaFiles) {
    const messagesTabWrapper = document.createElement("div");
    messagesTabWrapper.classList.add("messages-tab-wrapper");

    // Create structure
    const conversationsListWrapper = document.createElement("div");
    conversationsListWrapper.classList.add("conversation-list-wrapper");

    const exportInfo = document.createElement("div");
    exportInfo.classList.add("export-info");
    exportInfo.innerHTML = `
        <p>User: ${formatUserId(messages_json.userId)}</p>
        <p>Export Date: ${new Date(messages_json.exportDate).toLocaleString()}</p>
        <p>Conversations: ${messages_json.conversations.length}</p>
    `;
    conversationsListWrapper.appendChild(exportInfo);

    const conversationsList = document.createElement("div");
    conversationsList.classList.add("conversation-list");
    conversationsListWrapper.appendChild(conversationsList);

    const messageView = document.createElement('div');
    messageView.classList.add('message-view');

    messagesTabWrapper.appendChild(conversationsListWrapper);
    messagesTabWrapper.appendChild(messageView);

    // Filter and display conversations
    const validConversations = messages_json.conversations.filter(conv => 
        conv.id && conv.id !== 'ALL' && !conv.id.includes('@cast.skype') && 
        conv.MessageList && conv.MessageList.length > 0
    );

    // Sort conversations by last message time (larger epoch is newer and comes first) cast lastimreceivedtime to int
    const sortedValidConversations = validConversations.sort((a, b) => {
        const aTime = a.properties?.lastimreceivedtime ? parseInt(a.properties.lastimreceivedtime) : 0;
        const bTime = b.properties?.lastimreceivedtime ? parseInt(b.properties.lastimreceivedtime) : 0;
        return bTime - aTime; // Sort in descending order
    });

    sortedValidConversations.forEach((conv, index) => {
        const convElement = document.createElement('div');
        convElement.className = 'conversation-item';
        convElement.innerHTML = `
            <div class="conversation-title">${getDisplayName(conv)}</div>
            <div class="conversation-meta">
                ${conv.MessageList.length} messages
                ${conv.properties?.lastimreceivedtime ? 
                    `<br>Last message: ${formatDate(new Date(conv.properties.lastimreceivedtime))}` : 
                    ''}
            </div>
        `;

        convElement.addEventListener('click', async () => {
            // Update active state
            document.querySelectorAll('.conversation-item').forEach(el => 
                el.classList.remove('active')
            );
            convElement.classList.add('active');

            // Display messages
            await displayConversationMessages(conv, messageView, mediaFiles);

            // Replace all js-auto-replace-with-link-on-fail images with links
            document.querySelectorAll("img.js-auto-replace-with-link-on-fail").forEach(img => {
                // Function to attempt image recovery
                const attemptFix = async (img) => {
                    if (img.parentNode) {
                        // replace with link to img.src and link text as img.alt
                        const link = document.createElement('a');
                        link.href = img.src;
                        link.target = '_blank'; // Open in new tab
                        link.textContent = img.alt || 'Image link';
                        link.classList.add('image-link');

                        img.parentNode.replaceChild(link, img);
                    }
                };
            
                // Check if the image is already broken
                if (!img.complete || img.naturalWidth === 0) {
                    attemptFix(img);
                }
            
                // Also set an error handler for future failures
                img.onerror = () => attemptFix(img);
            });
        });

        conversationsList.appendChild(convElement);
    });

    // Return the wrapper
    return messagesTabWrapper;
}

async function displayConversationMessages(conversation, container, mediaFiles) {
    container.innerHTML = '';
    
    // Reverse conversation.MessageList
    conversation.MessageList.reverse();

    for (const msg of conversation.MessageList) {
        if (msg.content.trim()) {
            const messageElement = document.createElement('div');
            messageElement.className = 'message';
            
            const rawContent = msg.content;
            const formattedContent = await parseMessageContent(rawContent, mediaFiles);
            
            messageElement.innerHTML = `
                <div class="message-header">
                    <div class="message-header-left">
                        <span class="message-author">${formatUserId(msg.from)}</span>
                        <span class="message-time">${formatDate(new Date(msg.originalarrivaltime))}</span>
                    </div>
                    <button class="format-toggle" data-state="formatted">raw</button>
                </div>
                <div class="message-content formatted">${formattedContent}</div>
                <div class="message-content raw" style="display: none">${escapeHtml(rawContent)}</div>
            `;

            // Add toggle functionality
            const toggleBtn = messageElement.querySelector('.format-toggle');
            const formattedDiv = messageElement.querySelector('.message-content.formatted');
            const rawDiv = messageElement.querySelector('.message-content.raw');

            toggleBtn.addEventListener('click', () => {
                const isFormatted = toggleBtn.getAttribute('data-state') === 'formatted';
                toggleBtn.textContent = isFormatted ? 'formatted' : 'raw';
                toggleBtn.setAttribute('data-state', isFormatted ? 'raw' : 'formatted');
                formattedDiv.style.display = isFormatted ? 'none' : 'block';
                rawDiv.style.display = isFormatted ? 'block' : 'none';
            });

            container.appendChild(messageElement);
        }
    }

    // Scroll to the bottom of the message view
    container.scrollTop = container.scrollHeight;
}

function getDisplayName(conversation) {
    return conversation.displayName ? 
        escapeHtml(conversation.displayName) : 
        formatUserId(conversation.id);
}