function renderMessagesTab(messages_json) {
    const messagesTabWrapper = document.createElement("div");
    messagesTabWrapper.classList.add("messages-tab-wrapper");

    // Create structure
    const conversationsListWrapper = document.createElement("div");
    conversationsListWrapper.classList.add("conversation-list");

    const exportInfo = document.createElement("div");
    exportInfo.classList.add("export-info");
    exportInfo.innerHTML = `
        <p>User: ${formatUserId(messages_json.userId)}</p>
        <p>Export Date: ${new Date(messages_json.exportDate).toLocaleString()}</p>
        <p>Conversations: ${messages_json.conversations.length}</p>
    `;
    conversationsListWrapper.appendChild(exportInfo);

    const conversationsList = document.createElement("div");
    conversationsList.id = "conversationsList";
    conversationsListWrapper.appendChild(conversationsList);

    const messageView = document.createElement('div');
    messageView.id = "messageView";

    // Filter and display conversations
    const validConversations = messages_json.conversations.filter(conv => 
        conv.id && conv.id !== 'ALL' && !conv.id.includes('@cast.skype') && 
        conv.MessageList && conv.MessageList.length > 0
    );

    validConversations.forEach((conv, index) => {
        const convElement = document.createElement('div');
        convElement.className = 'conversation-item';
        convElement.innerHTML = `
            <div class="conversation-title">${getDisplayName(conv)}</div>
            <div class="conversation-meta">
                ${conv.MessageList.length} messages
                ${conv.properties?.lastimreceivedtime ? 
                    `<br>Last message: ${new Date(conv.properties.lastimreceivedtime).toLocaleString()}` : 
                    ''}
            </div>
        `;

        convElement.addEventListener('click', () => {
            console.log("clicked")
            // Update active state
            document.querySelectorAll('.conversation-item').forEach(el => 
                el.classList.remove('active')
            );
            convElement.classList.add('active');

            // Display messages
            displayConversationMessages(conv, messageView);
        });

        conversationsList.appendChild(convElement);
    });

    messagesTabWrapper.appendChild(conversationsListWrapper);
    messagesTabWrapper.appendChild(messageView);

    // Show first conversation by default
    if (validConversations.length > 0) {
        conversationsList.firstChild.click();
    }

    return messagesTabWrapper.outerHTML;
}

function displayConversationMessages(conversation, container) {
    container.innerHTML = '';
    
    conversation.MessageList.forEach(msg => {
        if (msg.content.trim()) {
            const messageElement = document.createElement('div');
            messageElement.className = 'message';
            
            const rawContent = msg.content;
            const formattedContent = parseMessageContent(rawContent);
            
            messageElement.innerHTML = `
                <div class="message-header">
                    <div class="message-header-left">
                        <span class="message-author">${formatUserId(msg.from)}</span>
                        <span class="message-time">${new Date(msg.originalarrivaltime).toLocaleString()}</span>
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
    });
}

function parseMessageContent(content) {
    // Check if content contains partlist XML
    if (content.includes('<partlist')) {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(content, 'text/xml');
            const partlist = xmlDoc.querySelector('partlist');
            
            if (partlist) {
                const type = partlist.getAttribute('type');
                const parts = Array.from(partlist.getElementsByTagName('part'));
                
                const participants = parts.map(part => {
                    const identity = part.getAttribute('identity');
                    const duration = part.querySelector('duration')?.textContent;
                    return { identity, duration };
                });

                switch (type) {
                    case 'started':
                        return `
                            <div class="call-info">
                                <div class="call-status started">Call started</div>
                                <div class="participants">
                                    ${participants.map(p => `
                                        <div class="participant">${formatUserId(p.identity)}</div>
                                    `).join('')}
                                </div>
                            </div>
                        `;
                    
                    case 'ended':
                        return `
                            <div class="call-info">
                                <div class="call-status ended">Call ended</div>
                                <div class="participants">
                                    ${participants.map(p => `
                                        <div class="participant">
                                            ${formatUserId(p.identity)}
                                            ${p.duration ? ` (${formatDuration(p.duration)})` : ''}
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `;
                    
                    case 'missed':
                        return `
                            <div class="call-info">
                                <div class="call-status missed">Call missed</div>
                            </div>
                        `;
                    
                    default:
                        return escapeHtml(content);
                }
            }
        } catch (e) {
            console.error('Error parsing XML:', e);
            return escapeHtml(content);
        }
    }
    
    return escapeHtml(content);
}

function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function getDisplayName(conversation) {
    return conversation.displayName ? 
        escapeHtml(conversation.displayName) : 
        formatUserId(conversation.id);
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