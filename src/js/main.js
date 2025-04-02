PARSED_MESSAGES = {};

window.onload = () => {

    const skypeLogo1 = document.getElementById("skypeLogo-1");
    const skypeLogo2 = document.getElementById("skypeLogo-2");
    // If click skypeLogo change between them
    skypeLogo1.addEventListener("click", () => {
        skypeLogo1.style.display = "none";
        skypeLogo2.style.display = "block";
    });
    skypeLogo2.addEventListener("click", () => {
        skypeLogo1.style.display = "block";
        skypeLogo2.style.display = "none";
    });

    const container = document.getElementById("progressContainer");
    const loader = new ProgressLoader(container);

    const fileInput = document.getElementById("fileInput");
    const uploadBtn = document.getElementById("uploadBtn");
    const fetchBtn = document.getElementById("fetchBtn");
    const urlInput = document.getElementById("urlInput");
    const viewerWrapper = document.getElementById("viewerWrapper");
    const tabsContainer = document.getElementById("tabsContainer")
    const tabContentsContainer = document.getElementById("tabContentsContainer")

    const contactsUploadBtn = document.getElementById("contactsUploadBtn");
    const numbersUploadBtn = document.getElementById("numbersUploadBtn");
    const contactsFileInput = document.getElementById("contactsFileInput");
    const numbersFileInput = document.getElementById("numbersFileInput");

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

    contactsUploadBtn.addEventListener("click", () => {
        contactsFileInput.click();
    });

    numbersUploadBtn.addEventListener("click", () => {
        numbersFileInput.click();
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


    // Handle contacts file upload
    contactsFileInput.addEventListener("change", async (e) => {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            const contacts_csv = await file.text();
            
            container.style.display = "block";

            // Remove any child of tabsContainer that has the innerText "Contacts"
            const tabs = tabsContainer.querySelectorAll(".tab");
            tabs.forEach(tab => {
                if (tab.innerText === "Contacts") {
                    tab.remove();
                }
            });

            // Remove any child of tabContentsContainer that has the class "contacts"
            const contents = tabContentsContainer.querySelectorAll(".tab-content");
            contents.forEach(content => {
                if (content.classList.contains("contacts")) {
                    content.remove();
                }
            });

            // Show viewer-wrapper
            viewerWrapper.style.display = "block";

            createTab("Contacts", () => renderContactsTab(contacts_csv));

            // If no other tabs pre-select contacts tab
            const tabs2 = tabsContainer.querySelectorAll(".tab");
            if (tabs2.length === 1) {
                tabs2[0].click();
            }
        }
    });


    // Handle numbers file upload
    numbersFileInput.addEventListener("change", async (e) => {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            const numbers_csv = await file.text();
            
            container.style.display = "block";

            // Remove any child of tabsContainer that has the innerText "Numbers"
            const tabs = tabsContainer.querySelectorAll(".tab");
            tabs.forEach(tab => {
                if (tab.innerText === "Numbers") {
                    tab.remove();
                }
            });

            // Remove any child of tabContentsContainer that has the class "numbers"
            const contents = tabContentsContainer.querySelectorAll(".tab-content");
            contents.forEach(content => {
                if (content.classList.contains("numbers")) {
                    content.remove();
                }
            });

            // Show viewer-wrapper
            viewerWrapper.style.display = "block";

            createTab("Numbers", () => renderNumbersTab(numbers_csv));

            // Select numbers tab
            const tabs2 = tabsContainer.querySelectorAll(".tab");
            if (tabs2.length === 1) {
                tabs2[0].click();
            }
        }
    });

    // Main tar file handler
    async function handleTarFile(tarBlob) {
        container.style.display = "block";
        try {
            const files = await loader.untar(tarBlob, "Loading skype export...", true);
            
            // Clear previous tabs and contents
            //// Remove all children from tabsContainer that does not have the innerText "Contacts" or "Numbers"
            const tabs = tabsContainer.querySelectorAll(".tab");
            tabs.forEach(tab => {
                if (tab.innerText !== "Contacts" && tab.innerText !== "Numbers") {
                    tab.remove();
                }
            });

            //// Remove all children from tabContentsContainer that does not have the class "contacts" or "numbers"
            const contents = tabContentsContainer.querySelectorAll(".tab-content");
            contents.forEach(content => {
                if (!content.classList.contains("contacts") && !content.classList.contains("numbers")) {
                    content.remove();
                }
            });
            PARSED_MESSAGES = {};

            // Get media files
            const mediaFiles = {};
            for (const [file, blob] of Object.entries(files)) {
                if (file.startsWith("media/")) {
                    mediaFiles[file] = blob;
                }
            }

            // Temp save current tabs
            const tempSaveCurrentTabs = tabsContainer.querySelectorAll(".tab");
            const tempSaveCurrentContents = tabContentsContainer.querySelectorAll(".tab-content");
            // Remove all children from tabsContainer and tabContentsContainer
            tabsContainer.innerHTML = "";
            tabContentsContainer.innerHTML = "";

            // Messages tab
            if (files["messages.json"]) {
                const messages_json = JSON.parse(await files["messages.json"].text());
                createTab("Messages", () => renderMessagesTab(messages_json,mediaFiles,PARSED_MESSAGES));
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

            // Add back contacts and numbers tabs from tempSave
            tempSaveCurrentTabs.forEach(tab => {
                if (tab.innerText === "Contacts" || tab.innerText === "Numbers") {
                    tabsContainer.appendChild(tab);
                }
            });
            tempSaveCurrentContents.forEach(content => {
                if (content.classList.contains("contacts") || content.classList.contains("numbers")) {
                    tabContentsContainer.appendChild(content);
                }
            });

            // Show viewer-wrapper
            viewerWrapper.style.display = "block";

            // if no tab is selected, select the first one
            const tabs3 = tabsContainer.querySelectorAll(".tab");
            let foundSelectedTab = false;
            for (const tab of tabs3) {
                if (tab.classList.contains("active")) {
                    foundSelectedTab = true;
                    break;
                }
            }
            // Show the first tab by default by callings its click
            if (!foundSelectedTab) {
                const firstTab = tabsContainer.querySelector(".tab");
                if (firstTab) {
                    firstTab.click();
                }
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
        content.classList.add(name.toLowerCase());
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

        return tab;
    }
};