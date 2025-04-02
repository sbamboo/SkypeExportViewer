window.onload = () => {
    const container = document.getElementById('progressContainer');
    const loader = new ProgressLoader(container);

    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const fetchBtn = document.getElementById('fetchBtn');
    const urlInput = document.getElementById('urlInput');
    const tabsContainer = document.getElementById('tabsContainer');
    const tabContent = document.getElementById('tabContent');

    // Handle file upload
    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            handleTarFile(await new Blob([file], { type: 'application/x-tar' }));
        }
    });

    // Handle URL fetch
    fetchBtn.addEventListener('click', async () => {
        const url = urlInput.value.trim();
        if (url) {
            container.style.display = 'block';
            try {
                const response = await loader.fetch(url, "Downloading skype export...", true);
                handleTarFile(await response.blob());
            } catch (error) {
                console.error('Error fetching file:', error);
                alert('Failed to fetch the file. Please check the URL and try again.');
            }
        }
    });

    async function handleTarFile(tarBlob) {
        container.style.display = 'block';
        try {
            const files = await loader.untar(tarBlob, "Loading skype export...", true);
            
            // Clear existing content
            tabContent.innerHTML = '';

            if (files['messages.json']) {
                const messagesText = await files['messages.json'].text();
                const messagesData = JSON.parse(messagesText);
                displayMessages(messagesData);
            }

        } catch (error) {
            console.error('Error processing tar file:', error);
            alert('Failed to process the file. Please make sure it\'s a valid tar archive.');
        }
    }

    function displayMessages(data) {
        // Create viewer structure
        tabContent.innerHTML = `
            <div class="viewer">
                <div class="conversation-list">
                    <div class="export-info">
                        <p>User: ${formatUserId(data.userId)}</p>
                        <p>Export Date: ${new Date(data.exportDate).toLocaleString()}</p>
                        <p>Conversations: ${data.conversations.length}</p>
                    </div>
                    <div id="conversationsList"></div>
                </div>
                <div class="message-view" id="messageView"></div>
            </div>
        `;

        const conversationsList = document.getElementById('conversationsList');
        const messageView = document.getElementById('messageView');

        // Filter and display conversations
        const validConversations = data.conversations.filter(conv => 
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

        // Show first conversation by default
        if (validConversations.length > 0) {
            conversationsList.firstChild.click();
        }
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
};