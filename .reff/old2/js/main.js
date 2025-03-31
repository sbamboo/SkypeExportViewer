window.onload = () => {
    const container = document.getElementById('progressContainer');
    const loader = new ProgressLoader(container);

    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const fetchBtn = document.getElementById('fetchBtn');
    const urlInput = document.getElementById('urlInput');


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


    // Main tar file handler
    async function handleTarFile(tarBlob) {
        container.style.display = 'block';
        try {
            const files = await loader.untar(tarBlob, "Loading skype export...", true);
            
            

        } catch (error) {
            console.error('Error processing tar file:', error);
            alert('Failed to process the file. Please make sure it\'s a valid tar archive.');
        }
    }
};