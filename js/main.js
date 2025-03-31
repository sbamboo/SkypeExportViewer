window.onload = () => {
    const container = document.getElementById("progressContainer");
    const loader = new ProgressLoader(container);

    const fileInput = document.getElementById("fileInput");
    const uploadBtn = document.getElementById("uploadBtn");
    const fetchBtn = document.getElementById("fetchBtn");
    const urlInput = document.getElementById("urlInput");
    const viewerWrapper = document.getElementById("viewerWrapper");
    const tabsContainer = document.getElementById("tabsContainer")
    const tabContentsContainer = document.getElementById("tabContentsContainer")


    // Handle file upload
    uploadBtn.addEventListener("click", () => {
        fileInput.click();
    });

    fileInput.addEventListener("change", async (e) => {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            handleTarFile(await new Blob([file], { type: "application/x-tar" }));
        }
    });


    // Handle URL fetch
    fetchBtn.addEventListener("click", async () => {
        const url = urlInput.value.trim();
        if (url) {
            container.style.display = "block";
            try {
                const response = await loader.fetch(url, "Downloading skype export...", true);
                handleTarFile(await response.blob());
            } catch (error) {
                console.error("Error fetching file:", error);
                alert("Failed to fetch the file. Please check the URL and try again.");
            }
        }
    });


    // Main tar file handler
    async function handleTarFile(tarBlob) {
        container.style.display = "block";
        try {
            const files = await loader.untar(tarBlob, "Loading skype export...", true);
            
            // Clear previous tabs and contents
            tabsContainer.innerHTML = "";
            tabContentsContainer.innerHTML = "";

            // Get media files
            const mediaFiles = {};
            for (const [file, blob] of Object.entries(files)) {
                if (file.startsWith("media/")) {
                    mediaFiles[file] = blob;
                }
            }

            // Messages tab
            if (files["messages.json"]) {
                const messages_json = JSON.parse(await files["messages.json"].text());
                createTab("Messages", () => renderMessagesTab(messages_json,mediaFiles));
            }

            // Media tab
            if (Object.keys(mediaFiles).length > 0) {
                createTab("Media", () => renderMediaTab(mediaFiles));
            }

            // Entry points tab
            if (files["endpoints.json"]) {
                const endpoints_json = JSON.parse(await files["endpoints.json"].text());
                createTab("Endpoints", () => renderEndpointsTab(endpoints_json));
            }

            // Show viewer-wrapper
            viewerWrapper.style.display = "block";

            // Show the first tab by default by callings its click
            const firstTab = tabsContainer.querySelector(".tab");
            if (firstTab) {
                firstTab.click();
            }

        } catch (error) {
            console.error("Error processing tar file:", error);
            alert("Failed to process the file. Please make sure it\"s a valid tar archive.");
        }
    }

    function createTab(name, contentResolver) {
        // Add tab to tabsContainer
        const tab = document.createElement("div");
        tab.classList.add("tab");
        tab.innerText = name;
        
        // Add tab content to tabContentsContainer (hidden by default)
        const content = document.createElement("div");
        content.classList.add("tab-content");
        content.style.display = "none";
        //// Begin loading content
        content.appendChild(contentResolver());

        // Add click handler to tab that hides other tabs and shows this one
        tab.addEventListener("click", () => {
            const allTabs = tabsContainer.querySelectorAll(".tab");
            const allContents = tabContentsContainer.querySelectorAll(".tab-content");

            allTabs.forEach(t => t.classList.remove("active"));
            allContents.forEach(c => c.style.display = "none");

            tab.classList.add("active");
            content.style.display = "block";
        });

        // Append content
        tabsContainer.appendChild(tab);
        tabContentsContainer.appendChild(content);
    }
};