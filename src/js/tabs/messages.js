const MESSAGES_URLPREVIEWS = {};      // key  => data

var is_search_scrolling = false;

function renderMessagesTab(messages_json,mediaFiles,PARSED_MESSAGES) {
    const messagesTabOuterWrapper = document.createElement("div");
    messagesTabOuterWrapper.classList.add("messages-outer-tab-wrapper");
  
    const messagesTabWrapper = document.createElement("div");
    messagesTabWrapper.classList.add("messages-tab-wrapper");

    // Search container start
    const searchContainer = document.createElement("div");
    searchContainer.classList.add("messages-search-container");
    
    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = "Search messages...";
    searchInput.classList.add("messages-search-input");
    
    const prevButton = document.createElement("button");
    prevButton.textContent = "Previous";
    prevButton.classList.add("messages-search-button");
    prevButton.style.display = "none";
    
    const nextButton = document.createElement("button");
    nextButton.textContent = "Next";
    nextButton.classList.add("messages-search-button");
    nextButton.style.display = "none";
    
    const clearButton = document.createElement("button");
    clearButton.textContent = "Clear";
    clearButton.classList.add("messages-search-button");
    clearButton.style.display = "none";

    const searchInfo = document.createElement("p");
    searchInfo.classList.add("messages-search-info");
    searchInfo.style.display = "none";

    searchContainer.appendChild(searchInput);
    searchContainer.appendChild(searchInfo);
    searchContainer.appendChild(prevButton);
    searchContainer.appendChild(nextButton);
    searchContainer.appendChild(clearButton);
    messagesTabOuterWrapper.appendChild(searchContainer);
    // Search container end

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

  
    messagesTabOuterWrapper.appendChild(messagesTabWrapper);

    // Search functionality
    let currentSearchResults = [];
    let currentSearchIndex = -1;
    let allConversations = [];

    searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            performSearch(searchInput.value);
        }
    });

    clearButton.addEventListener("click", () => {
        searchInput.value = "";
        clearSearch();
    });

    prevButton.addEventListener("click", () => {
        navigateSearch(-1);
    });

    nextButton.addEventListener("click", () => {
        navigateSearch(1);
    });

    function clearSearch() {
        currentSearchResults = [];
        currentSearchIndex = -1;
        prevButton.style.display = "none";
        nextButton.style.display = "none";
        clearButton.style.display = "none";
        is_search_scrolling = false;
    
        // Show all conversations
        conversationsList.querySelectorAll(".conversation-item").forEach(item => {
            item.style.display = "block";
        });
        
        // Remove search-selected class from all messages
        document.querySelectorAll(".search-selected").forEach(msg => {
            msg.classList.remove("search-selected");
        });
    }

    function performSearch(query) {
        if (!query.trim()) {
            clearSearch();
            return;
        }

        currentSearchResults = [];
        currentSearchIndex = -1;
    
        // Keep track of conversations with matches
        const conversationsWithMatches = new Set();
        
        // Search through all conversations
        sortedValidConversations.forEach((conv, convIndex) => {
            const matchingMessages = conv.MessageList.filter((msg, msgIndex) => {
                const content = msg.content.toLowerCase();
                return content.includes(query.toLowerCase());
            });

            if (matchingMessages.length > 0) {
                matchingMessages.forEach(msg => {
                    currentSearchResults.push({
                        conversation: conv,
                        message: msg
                    });
                });
                conversationsWithMatches.add(conv.id);
            }
        });

        // Hide/show conversations based on matches
        if (conversationsWithMatches.size > 0) {
            conversationsList.querySelectorAll(".conversation-item").forEach(item => {
                const convId = item.dataset.conversationItemId;
                if (conversationsWithMatches.has(convId)) {
                    item.style.display = "block";
                } else {
                    item.style.display = "none";
                }
            });
        }

        // Update UI based on search results
        if (currentSearchResults.length > 0) {
            prevButton.style.display = "block";
            nextButton.style.display = "block";
            clearButton.style.display = "block";
            navigateSearch(1); // Go to first result
        } else {
            clearButton.style.display = "block";
            // Step 1: Save current style.color
            const originalColor = searchInfo.style.color;
        
            // Step 2: Change style.color to red
            searchInfo.style.color = 'red';
        
            // Step 3: Set text to "No matches found"
            searchInfo.textContent = 'No matches found';
        
            // Step 4: Set style.display to block
            searchInfo.style.display = 'block';
        
            // Step 5: Wait 1 second
            setTimeout(() => {
                // Step 6: Reset the original style and content
                searchInfo.style.color = originalColor;
                searchInfo.style.display = '';  // Resetting display, which might depend on the layout ("" = default)
                searchInfo.textContent = '';  // Reset the text content (or set to your original text if needed)
            }, 1000); // Wait 1000 milliseconds (1 second)
        }
    }

    function navigateSearch(direction) {
        is_search_scrolling = true;
        if (currentSearchResults.length === 0) return;

        // Remove current selection
        document.querySelectorAll(".search-selected").forEach(msg => {
            msg.classList.remove("search-selected");
        });

        // Update index
        currentSearchIndex += direction;
        if (currentSearchIndex >= currentSearchResults.length) currentSearchIndex = 0;
        if (currentSearchIndex < 0) currentSearchIndex = currentSearchResults.length - 1;

        // Get current result
        const result = currentSearchResults[currentSearchIndex];

        // Find and click the conversation item
        /*
        const conversationItems = conversationsList.querySelectorAll(".conversation-item");
        conversationItems.forEach(item => {
            if (item.querySelector(".conversation-title").textContent === getDisplayName(result.conversation)) {
                item.click();
            }
        });
        */

        const conversationItem = document.querySelector('[data-conversation-item-id="'+result.conversation.id+'"]');
        conversationItem.click();

        // Wait for messages to load
        setTimeout(() => {
            // Find the message and highlight it
            /*
            const messages = document.querySelectorAll(".message");
            messages.forEach(msg => {
                if (msg.querySelector(".message-content").textContent.includes(result.message.content)) {
                    msg.classList.add("search-selected");
                    msg.scrollIntoView({ behavior: "smooth", block: "center" });
                }
            });
            */
            const messageCacheId = result.conversation.id + ";" + result.message.id;
            const msgElem = document.querySelector('[data-message-cache-id="'+messageCacheId+'"]');
            msgElem.classList.add("search-selected");
            msgElem.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
    }

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
    
        // Reverse conversation.MessageList
        conv.MessageList.reverse();

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

        convElement.dataset.conversationItemId = conv.id;

        convElement.addEventListener('click', async () => {
            // Update active state
            document.querySelectorAll('.conversation-item').forEach(el => 
                el.classList.remove('active')
            );
            convElement.classList.add('active');

            // Display messages
            await displayConversationMessages(messages_json.userId, conv, messageView, mediaFiles, PARSED_MESSAGES);

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
    return messagesTabOuterWrapper;
}

async function displayConversationMessages(holder, conversation, container, mediaFiles, PARSED_MESSAGES) {
    container.innerHTML = '';

    for (const msg of conversation.MessageList) {
        if (msg.hasOwnProperty('properties') && msg.properties && msg.properties.hasOwnProperty('urlpreviews') && msg.properties.urlpreviews) {
            // Attempt parse msg.properties.urlpreviews as JSON
            try {
                const msg_urlpreviews = JSON.parse(msg.properties.urlpreviews);
                for (msg_urlpreview of msg_urlpreviews) {
                    if (msg_urlpreview.key && msg_urlpreview.key != "" && msg_urlpreview.value) {
                        MESSAGES_URLPREVIEWS[msg_urlpreview.key] = msg_urlpreview.value;
                    }
                }
            } catch (e) {
                console.error("Failed to parse urlpreviews:", e);
            }
        }
        if (msg.content.trim()) {
            const messageElement = document.createElement('div');
            messageElement.className = 'message';
            
            const rawContent = msg.content;
            const messageCacheId = conversation.id + ";" + msg.id;
            messageElement.dataset.messageCacheId = messageCacheId;

            let messageOwnerClass = 'message-incomming';
            if (msg.from == holder) {
                messageOwnerClass = 'message-outgoing';
            }

            let formattedContent;
            if (PARSED_MESSAGES.hasOwnProperty(messageCacheId)) {
                formattedContent = PARSED_MESSAGES[messageCacheId];
            } else {
                const [mocovv, formattedContent2] = await parseMessageContent(rawContent, mediaFiles);
                if (mocovv && mocovv !== null) {
                    messageOwnerClass = mocovv;
                }
                formattedContent = formattedContent2;
                PARSED_MESSAGES[messageCacheId] = formattedContent; // Cache the parsed message
            }
            
            messageElement.innerHTML = `
                <div class="message-header ${messageOwnerClass}">
                    <div class="message-header-left">
                        <span class="message-author">${formatUserId(msg.from)}</span>
                        <span class="message-time">${formatDate(new Date(msg.originalarrivaltime))}</span>
                    </div>
                    <button class="format-toggle" data-state="formatted">view raw</button>
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
                toggleBtn.textContent = isFormatted ? 'view formatted' : 'view raw';
                toggleBtn.setAttribute('data-state', isFormatted ? 'view raw' : 'formatted');
                formattedDiv.style.display = isFormatted ? 'none' : 'block';
                rawDiv.style.display = isFormatted ? 'block' : 'none';
            });

            container.appendChild(messageElement);
        }
    }

    // Now that all children are added see if we can find any <a> tags with hrefs that are a key in MESSAGES_URLPREVIEWS, if so add data-urlpreview to the <a> tag
    const anchors = container.querySelectorAll('a[href]');
    const okStatusCodes = ["200", "201", "202", "203", "204", "206", "301", "302", "303", "307", "308"];
    const validImageTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
    anchors.forEach(anchor => {
        const href = anchor.getAttribute('href');
        if (href && MESSAGES_URLPREVIEWS.hasOwnProperty(href)) {
            const previewData = MESSAGES_URLPREVIEWS[href];
            anchor.setAttribute('data-urlpreview', JSON.stringify(previewData));
            if (previewData && previewData !== null) {

                // Determine status class
                let statusClass = "message-urlpreview-unknown";
                if (previewData.status_code && typeof previewData.status_code === "string") {
                    // status_code is string of http status code like "200"
                    if (okStatusCodes.includes(previewData.status_code)) {
                        statusClass = "message-urlpreview-ok";
                    } else {
                        statusClass = "message-urlpreview-notok";
                    }
                }

                // Resolve URL and Site Name
                let resolvedSiteNameTargetUrl = previewData.url || href;
                let resolvedSiteName = previewData.title || previewData.site || resolvedSiteNameTargetUrl;

                // Create popup container
                let popup = document.createElement("div");
                popup.className = `message-urlpreview-popup ${statusClass}`;
                popup.style.display = "none"; // Initially hide popup
                
                // Create header
                let header = document.createElement("div");
                header.className = "message-urlpreview-popup-header";

                // Add favicon if available
                if (previewData.favicon) {
                    let favicon = document.createElement("img");
                    favicon.className = "message-urlpreview-popup-header-favicon";
                    favicon.src = previewData.favicon;
                    favicon.alt = resolvedSiteName;
                    if (previewData.favicon_meta?.width) favicon.width = previewData.favicon_meta.width;
                    if (previewData.favicon_meta?.height) favicon.height = previewData.favicon_meta.height;
                    header.appendChild(favicon);
                }

                // Add site link
                let siteLink = document.createElement("a");
                siteLink.className = "message-urlpreview-popup-header-sitelink";
                siteLink.href = resolvedSiteNameTargetUrl;
                siteLink.textContent = resolvedSiteName;
                header.appendChild(siteLink);

                // Create content section
                let content = document.createElement("div");
                content.className = "message-urlpreview-popup-content";
                
                // Add description if available
                if (previewData.description) {
                    let desc = document.createElement("p");
                    desc.className = "message-urlpreview-popup-content-desc";
                    desc.textContent = previewData.description;
                    content.appendChild(desc);
                }

                // Add thumbnail if available
                if (previewData.thumbnail) {
                    let thumbnailWrapper = document.createElement("div");
                    thumbnailWrapper.className = "message-urlpreview-popup-content-thumbnail-wrapper";
                    
                    let thumbnail = document.createElement("img");
                    thumbnail.className = "message-urlpreview-popup-content-thumbnail";
                    thumbnail.src = previewData.thumbnail;
                    thumbnail.alt = "[Thumbnail "+resolvedSiteName+"]";
                    if (previewData.thumbnail_meta?.width) thumbnail.width = previewData.thumbnail_meta.width;
                    if (previewData.thumbnail_meta?.height) thumbnail.height = previewData.thumbnail_meta.height;
                    
                    // Set fallback source if image fails to load
                    if (previewData.url && (!previewData.content_type || validImageTypes.includes(previewData.content_type))) {
                        thumbnail.onerror = function () {
                            thumbnail.src = previewData.url;
                        };
                    }

                    thumbnailWrapper.appendChild(thumbnail);
                    content.appendChild(thumbnailWrapper);
                }

                popup.appendChild(header);
                popup.appendChild(content);
                anchor.appendChild(popup);

                anchor.addEventListener("mouseenter", function () {
                    // Show the popup and position it
                    popup.style.display = "block";
                    popup.style.position = "absolute";
                    popup.style.left = `${anchor.getBoundingClientRect().left}px`;
                    popup.style.top = `${anchor.getBoundingClientRect().top + anchor.offsetHeight}px`;
                    //popup.style.top = `${anchor.getBoundingClientRect().top - popup.offsetHeight}px`;
                    popup.style.zIndex = "1000"; // Ensure it's on top
                });
                anchor.addEventListener("mouseleave", function () {
                    // Hide the popup
                    popup.style.display = "none";
                });
            }
        }
    });

    // Scroll to the bottom of the message view
    if (is_search_scrolling == false) {
        container.scrollTop = container.scrollHeight;
    }
}

function getDisplayName(conversation) {
    return conversation.displayName ? 
        escapeHtml(conversation.displayName) : 
        formatUserId(conversation.id);
}