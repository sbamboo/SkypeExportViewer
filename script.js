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
            
            // Clear existing tabs and content
            tabsContainer.innerHTML = '';
            tabContent.innerHTML = '';

            // Check for each possible file/directory
            if (files['endpoints.json']) {
                createTab('Endpoints', async () => {
                    const text = await files['endpoints.json'].text();
                    return `<pre>${JSON.stringify(JSON.parse(text), null, 2)}</pre>`;
                });
            }

            if (files['messages.json']) {
                createTab('Messages', async () => {
                    const text = await files['messages.json'].text();
                    return `<pre>${JSON.stringify(JSON.parse(text), null, 2)}</pre>`;
                });
            }

            // Check for media directory by looking for files with media/ prefix
            const mediaFiles = Object.keys(files).filter(name => name.startsWith('media/'));
            if (mediaFiles.length > 0) {
                createTab('Media', async () => {
                    const mediaGrid = document.createElement('div');
                    mediaGrid.style.display = 'grid';
                    mediaGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(200px, 1fr))';
                    mediaGrid.style.gap = '20px';

                    for (const fileName of mediaFiles) {
                        const blob = files[fileName];
                        const url = URL.createObjectURL(blob);
                        const ext = fileName.split('.').pop().toLowerCase();
                        
                        const item = document.createElement('div');
                        if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
                            item.innerHTML = `
                                <img src="${url}" alt="${fileName}" style="width: 100%; height: 200px; object-fit: cover;">
                                <p>${fileName.split('/').pop()}</p>
                            `;
                        } else {
                            item.innerHTML = `
                                <div style="padding: 20px; background: #f0f0f0; text-align: center;">
                                    <p>${fileName.split('/').pop()}</p>
                                    <a href="${url}" download>Download</a>
                                </div>
                            `;
                        }
                        mediaGrid.appendChild(item);
                    }
                    return mediaGrid.outerHTML;
                });
            }

            // Activate first tab if exists
            const firstTab = tabsContainer.querySelector('.tab');
            if (firstTab) {
                firstTab.click();
            }

        } catch (error) {
            console.error('Error processing tar file:', error);
            alert('Failed to process the file. Please make sure it\'s a valid tar archive.');
        }
    }

    function createTab(name, contentProvider) {
        const tab = document.createElement('button');
        tab.className = 'tab';
        tab.textContent = name;
        
        tab.addEventListener('click', async () => {
            // Deactivate all tabs
            tabsContainer.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            
            // Activate this tab
            tab.classList.add('active');
            
            // Load content
            tabContent.innerHTML = '<div style="text-align: center; padding: 20px;">Loading...</div>';
            tabContent.innerHTML = await contentProvider();
        });
        
        tabsContainer.appendChild(tab);
    }
};