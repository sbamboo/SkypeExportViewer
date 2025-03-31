function renderMediaTab(files, mediaFiles) {

    const mediaTabWrapper = document.createElement("div");
    mediaTabWrapper.classList.add("media-tab-wrapper");

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
    
    mediaTabWrapper.appendChild(mediaGrid);
    return mediaTabWrapper.outerHTML;
}