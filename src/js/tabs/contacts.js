const columnMapping = {
    "type": "Type",
    "id": "ID",
    "display_name": "Display Name",
    "blocked": "Blocked",
    "favorite": "Favorite",
    "profile.avatar_url": "Avatar URL",
    "profile.gender": "Gender",
    "profile.locations[0].type": "Location Type",
    "profile.locations[0].country": "Location Country",
    "profile.locations[0].city": "Location City",
    "profile.mood": "Mood",
    "profile.name.first": "First Name",
    "profile.name.company": "Company Name",
    "profile.name.surname": "Surname",
    "profile.about": "About",
    "profile.phones[0].number": "Phone Number",
    "profile.phones[0].type": "Phone Type",
    "profile.website": "Website",
    "profile.skype_handle": "Skype Handle",
    "sources": "Sources",
    "creation_time": "Creation Time"
  };
  

function renderContactsTab(contacts_csv) {
    const contactsTabWrapper = document.createElement("div");
    contactsTabWrapper.classList.add("contacts-tab-wrapper");

    const rows = window.CSV.parse(contacts_csv);

    // Initialize an empty dictionary to store unique types and their corresponding lines
    let typeDict = {};

    // Iterate over the remaining rows (starting from row 1 as row 0 is the header)
    for (let i = 1; i < rows.length; i++) {
        const values = rows[i];

        // Assuming that 'type' is the first column (index 0)
        const type = values[0];

        // If the type is not in the dictionary, initialize it with an empty array
        if (!typeDict[type]) {
            typeDict[type] = [];
        }

        // Add the values to the dictionary under the corresponding type
        typeDict[type].push(values);
    }

    const moveBefores = ["Skype", "skype"];
    const moveAfters = ["SkypeSuggested", "skypesuggested", "skype_suggested", "Bot", "bot"];

    for (moveBefore of moveBefores) {
        // Move the to the top
        if (typeDict[moveBefore]) {
            let befores = {};
            let afters = {};
            let entry = {};
            // Iterate the typeDict and fill in above
            let foundEntry = false;
            for (let type in typeDict) {
                if (type == moveBefore) {
                    entry[type] = typeDict[type]
                    foundEntry = true;
                } else if (foundEntry) {
                    afters[type] = typeDict[type];
                } else {
                    befores[type] = typeDict[type];
                }
            }
            // Create a new typeDict with the entry at the top
            typeDict = { ...entry, ...befores, ...afters };
        }
    }
    for (moveAfter of moveAfters) {
        // Move the to the top
        if (typeDict[moveAfter]) {
            let befores = {};
            let afters = {};
            let entry = {};
            // Iterate the typeDict and fill in above
            let foundEntry = false;
            for (let type in typeDict) {
                if (type == moveAfter) {
                    entry[type] = typeDict[type]
                    foundEntry = true;
                } else if (foundEntry) {
                    afters[type] = typeDict[type];
                } else {
                    befores[type] = typeDict[type];
                }
            }
            // Create a new typeDict with the entry at the top
            typeDict = { ...befores, ...afters, ...entry };
        }
    }

    // Show entries here
    for (let type in typeDict) {
        // Create a div for each type
        const typeWrapper = document.createElement("div");
        typeWrapper.classList.add("contacts-type-wrapper");
    
        // Create a header-wrapper div with a header inside
        const detailsWrapper = document.createElement("details");
    
        const summaryElement = document.createElement("summary");
        summaryElement.classList.add("contacts-type-header");
        summaryElement.textContent = type; // Display the type as the header

        // Add hr to summary
        summaryElement.appendChild(document.createElement("hr"));
    
        // Create a div for all the entries of this type
        const entriesWrapper = document.createElement("div");
        entriesWrapper.classList.add("contacts-type-entries-wrapper");

        // Loop through the entries for this type
        for (rawentry in typeDict[type]) {
            const entry = {};
            const columnMappingKeys = Object.keys(columnMapping);
            for (let i = 0; i < columnMappingKeys.length; i++) {
                const key = columnMappingKeys[i];
                const value = typeDict[type][rawentry][i];
                entry[key] = value;
            }

            // Loop through the entries for this type
            const id = entry["id"];
            const displayName = entry["display_name"];
            const blocked = entry["blocked"];
            const favorite = entry["favorite"];
            const avatarUrl = entry["profile.avatar_url"];
            const gender = entry["profile.gender"];
            const locationType = entry["profile.locations[0].type"];
            const locationCountry = entry["profile.locations[0].country"];
            const locationCity = entry["profile.locations[0].city"];
            const mood = entry["profile.mood"];
            const firstName = entry["profile.name.first"];
            const companyName = entry["profile.name.company"];
            const surname = entry["profile.name.surname"];
            const about = entry["profile.about"];
            const phoneNumber = entry["profile.phones[0].number"];
            const phoneType = entry["profile.phones[0].type"];
            const website = entry["profile.website"];
            const skypeHandle = entry["profile.skype_handle"];
            const sources = entry["sources"];
            const creationTime = entry["creation_time"];

            const entryWrapper = document.createElement("div");
            entryWrapper.classList.add("contacts-entry-wrapper");
            entryWrapper.dataset.contactId = id;

            let avatarContent = avatarUrl
                ? `<img src="${avatarUrl}" alt="" class="contacts-entry-avatar-content"/>`
                : `<svg class="contacts-entry-avatar-content" viewBox="0 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g fill="#212121" fill-rule="nonzero"><path d="M35.7502,28 C38.0276853,28 39.8876578,29.7909151 39.9950978,32.0427546 L40,32.2487 L40,33 C40,36.7555 38.0583,39.5669 35.0798,41.3802 C32.1509,43.1633 28.2139,44 24,44 C19.7861,44 15.8491,43.1633 12.9202,41.3802 C10.0319285,39.6218485 8.11862909,36.9249713 8.00532378,33.3388068 L8,33 L8,32.2489 C8,29.9703471 9.79294995,28.1122272 12.0440313,28.0048972 L12.2499,28 L35.7502,28 Z M24,4 C29.5228,4 34,8.47715 34,14 C34,19.5228 29.5228,24 24,24 C18.4772,24 14,19.5228 14,14 C14,8.47715 18.4772,4 24,4 Z"></path></g></g></svg>`;
            let skypeContent = skypeHandle
                ? `<span class="contact-entry-skype">(${formatUserId(
                    skypeHandle
                )})</span>`
                : `<span class="contact-entry-skype">(${id ? formatUserId(id) : ""})</span>`;
            let companyContent = companyName
                ? `<span class="contact-entry-name-company">${companyName}</span>`
                : "";
            let favoriteContent = (favorite && favorite == true || favorite == "true" || favorite == "True")
                ? `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 47.94 47.94" xml:space="preserve"><path style="fill:#ED8A19;" d="M26.285,2.486l5.407,10.956c0.376,0.762,1.103,1.29,1.944,1.412l12.091,1.757 c2.118,0.308,2.963,2.91,1.431,4.403l-8.749,8.528c-0.608,0.593-0.886,1.448-0.742,2.285l2.065,12.042 c0.362,2.109-1.852,3.717-3.746,2.722l-10.814-5.685c-0.752-0.395-1.651-0.395-2.403,0l-10.814,5.685 c-1.894,0.996-4.108-0.613-3.746-2.722l2.065-12.042c0.144-0.837-0.134-1.692-0.742-2.285l-8.749-8.528 c-1.532-1.494-0.687-4.096,1.431-4.403l12.091-1.757c0.841-0.122,1.568-0.65,1.944-1.412l5.407-10.956 C22.602,0.567,25.338,0.567,26.285,2.486z"/></svg>`
                : "";
            let blockedContent = (blocked && blocked == true || favorite == "true" || favorite == "True")
                ? `<svg fill="#d94b44" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 85.16 85.16" xml:space="preserve"><g><path d="M72.697,12.458c-16.611-16.611-43.63-16.611-60.24,0c-16.604,16.611-16.604,43.636,0,60.243 c16.61,16.611,43.637,16.611,60.24,0C89.309,56.094,89.309,29.066,72.697,12.458z M19.129,19.128 c10.917-10.92,27.617-12.618,40.335-5.096L14.037,59.468C6.506,46.749,8.205,30.048,19.129,19.128z M66.024,66.029 c-10.842,10.842-27.381,12.587-40.065,5.25l45.314-45.316C78.621,38.648,76.873,55.187,66.024,66.029z"/></g></svg>`
                : "";

            entryWrapper.innerHTML = `
                    <div class="contacts-entry-persona">
                        <div class="contacts-entry-avatar">
                            ${avatarContent}
                        </div>

                        <div class="contacts-entry-name-wrapper">
                            <p>
                                <span class="contact-entry-name">${displayName}</span>
                                ${skypeContent}
                                ${companyContent}
                            </p>
                        </div>

                        <div class="contacts-entry-status-icons">
                            ${favoriteContent}
                            ${blockedContent}
                        </div>
                    </div>

                    <div class="contacts-entry-about">
                        <p>${about || ""}</p>
                    </div>

                    <div class="contacts-entry-contact">
                        ${
                        phoneNumber
                            ? `
                            <div class="contacts-contact-phone">
                                <p class="contact-contact-phone-title">Phone(s):</p>
                                <ul class="contacts-contact-phone-numbers">
                                    <p>
                                        <span class="contact-contact-phone-number">${phoneNumber}</span>
                                        ${
                                        phoneType
                                            ? `(<span class="contact-contact-phone-type">${phoneType}</span>)`
                                            : ""
                                        }
                                    </p>
                                </ul>
                            </div>
                            `
                            : ""
                        }

                        ${
                        website
                            ? `
                            <div class="contacts-contact-website">
                                <p class="contact-contact-website-title">Website:</p>
                                <a class="contact-contact-website-url" href="${website}">${website}</a>
                            </div>
                            `
                            : ""
                        }
                    </div>

                    <div class="contacts-entry-more">
                        <!-- This is collapsible -->
                        <details>
                            <summary>More information</summary>

                            ${
                            mood
                                ? `
                                <div class="contacts-more-entry contacts-more-mood">
                                    <p>
                                        <span class="contacts-more-key">Mood: </span>
                                        <span class="contacts-more-value">${mood}</span>
                                    </p>
                                </div>
                                `
                                : ""
                            }

                            ${
                            firstName && surname
                                ? `
                                <div class="contacts-more-entry contacts-more-splitname">
                                    <p>
                                        <span class="contacts-more-splitname-first">${firstName} </span>
                                        <span class="contacts-more-splitname-surname">${surname}</span>
                                    </p>
                                </div>
                                `
                                : ""
                            }

                            ${
                            gender
                                ? `
                                <div class="contacts-more-entry contacts-more-gender">
                                    <p>
                                        <span class="contacts-more-key">Gender: </span>
                                        <span class="contacts-more-value">${gender}</span>
                                        <span class="contacts-more-info"> (According to skype profile)</span>
                                    </p>
                                </div>
                                `
                                : ""
                            }

                            ${
                            locationType
                                ? `
                                <div class="contacts-more-entry contacts-more-locations">
                                    <ul class="contacts-more-locations-list">
                                        <p>
                                            <span class="contacts-more-location-type">${locationType}: </span>
                                            <span class="contacts-more-location-country">${
                                            locationCountry || ""
                                            }, </span>
                                            <span class="contacts-more-location-city">${
                                            locationCity || ""
                                            }</span>
                                        </p>
                                    </ul>
                                </div>
                                `
                                : ""
                            }

                            ${
                            sources
                                ? `
                                <div class="contacts-more-entry contacts-more-sources">
                                    <p>
                                        <span class="contacts-more-key">Sources: </span>
                                        <span class="contacts-more-value">${sources}</span>
                                    </p>
                                </div>
                                `
                                : ""
                            }

                            ${
                            creationTime
                                ? `
                                <div class="contacts-more-entry contacts-more-creationtime">
                                    <p>
                                        <span class="contacts-more-key">Profile Creation Time: </span>
                                        <span class="contacts-more-value">${formatDate(
                                        creationTime
                                        )}</span>
                                    </p>
                                </div>
                                `
                                : ""
                            }
                        </details>
                    </div>
                `;

            // Add handlers
            entryWrapper.querySelectorAll('.contacts-entry-avatar-content').forEach(img => {
                img.addEventListener('click', (event) => {
                    showPopup(event.target);
                });
            });

            entriesWrapper.appendChild(entryWrapper);
        }

        // Append header-wrapper and entries-wrapper to the typeWrapper
        detailsWrapper.appendChild(summaryElement);
        detailsWrapper.appendChild(entriesWrapper);
        typeWrapper.appendChild(detailsWrapper);

        // Append the typeWrapper to the main wrapper
        contactsTabWrapper.appendChild(typeWrapper);
    }

    return contactsTabWrapper;
}

function showPopup(target) {
    // Check if target is img or svg if not get parent until img or svg is found if in iteration we have no parent return early
    let visElem;
    if (target.tagName === 'IMG' || target.tagName === 'svg') {
        // Make a copy of the element
        visElem = target.cloneNode(true);
    } else {
        let parent = target.parentElement;
        while (parent) {
            if (parent.tagName === 'IMG' || parent.tagName === 'svg') {
                // Make a copy of the element
                visElem = parent.cloneNode(true);
                break;
            }
            if (parent.parentElement) {
                parent = parent.parentElement;
            } else {
                console.log("No parent found with img or svg tag, returning early");
                return;
            }
        }
    }

    // Clear visElem classlist
    visElem.classList = [];
    visElem.classList.add('popup-image');

    // Create the overlay div
    const overlay = document.createElement('div');
    overlay.classList.add('popup-overlay');

    // Create the centered popup div with the image and close button
    const popup = document.createElement('div');
    popup.classList.add('popup-content');
    popup.appendChild(visElem);
    popup.innerHTML += `
        <button class="popup-close-btn"><p>X</p></button>
    `;

    // Close button functionality
    popup.querySelector('.popup-close-btn').addEventListener('click', () => {
        document.body.removeChild(overlay);
    });

    // Close the popup when clicking outside of the content area
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
        }
    });

    // Append the popup to the overlay and append the overlay to the body
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
}
