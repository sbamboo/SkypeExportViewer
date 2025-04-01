I got this code
```
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
    const typeDict = {};

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

    // Show entries here
    for (let type in typeDict) {
        // Create a div for each type
        const typeWrapper = document.createElement("div");
        typeWrapper.classList.add("contacts-type-wrapper");

        // Create a header-wrapper div with a header inside
        const headerWrapper = document.createElement("div");
        headerWrapper.classList.add("contacts-type-header-wrapper");

        const headerElement = document.createElement("h2");
        headerElement.textContent = type; // Display the type as the header
        headerWrapper.appendChild(headerElement);

        // Create a div for all the entries of this type
        const entriesWrapper = document.createElement("div");
        entriesWrapper.classList.add("contacts-type-entries-wrapper");

        // Loop through the entries for this type
        

        // Append header-wrapper and entries-wrapper to the typeWrapper
        typeWrapper.appendChild(headerWrapper);
        typeWrapper.appendChild(entriesWrapper);

        // Append the typeWrapper to the main wrapper
        contactsTabWrapper.appendChild(typeWrapper);
    }

    return contactsTabWrapper;
}

function formatDate(dateInput) {
    const date = new Date(dateInput);
    
    // Get day
    const day = date.getDate();
    
    // Format date parts
    const month = date.toLocaleString(undefined, { month: 'short' });
    const year = date.getFullYear();
    const time = date.toLocaleTimeString(undefined, { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        hourCycle: 'h23' 
    });

    return `${day} ${month} ${year}, ${time}`;
}

function formatUserId(id) {
    return id.replace(/^8:/, '');
}
```

Modify the `// Loop through the entries for this type` section to make a formatted layout for the entry and add it to `entriesWrapper`
```HTML
<div class="contacts-entry-wrapper" data-contact-id="{id}">
    <div class="contacts-entry-persona">
        <div class="contacts-entry-avatar">
            if {profile.avatar_url} `<img src="{profile.avatar_url}" alt=""/>` else `<svg width="800px" height="800px" viewBox="0 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g fill="#212121" fill-rule="nonzero"><path d="M35.7502,28 C38.0276853,28 39.8876578,29.7909151 39.9950978,32.0427546 L40,32.2487 L40,33 C40,36.7555 38.0583,39.5669 35.0798,41.3802 C32.1509,43.1633 28.2139,44 24,44 C19.7861,44 15.8491,43.1633 12.9202,41.3802 C10.0319285,39.6218485 8.11862909,36.9249713 8.00532378,33.3388068 L8,33 L8,32.2489 C8,29.9703471 9.79294995,28.1122272 12.0440313,28.0048972 L12.2499,28 L35.7502,28 Z M24,4 C29.5228,4 34,8.47715 34,14 C34,19.5228 29.5228,24 24,24 C18.4772,24 14,19.5228 14,14 C14,8.47715 18.4772,4 24,4 Z"></path></g></g></svg>`
        </div>

        <div class="contacts-entry-name-wrapper">
            <p>
                <span class="contact-entry-name">{display_name}</span>
                if {profile.skype_handle} `(<span class="contact-entry-skype">{formatUserId(profile.skype_handle)}</span>)` else `(<span class="contact-entry-skype">{formatUserIdprofile.id)}</span>)`
                if {profile.name.company} `<span class="contact-entry-name-company">{profile.name.company}</span>`
            </p>
        </div>

        <div class="contacts-entry-status-icons">
            if {favorite} `<svg height="800px" width="800px" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 47.94 47.94" xml:space="preserve"><path style="fill:#ED8A19;" d="M26.285,2.486l5.407,10.956c0.376,0.762,1.103,1.29,1.944,1.412l12.091,1.757 c2.118,0.308,2.963,2.91,1.431,4.403l-8.749,8.528c-0.608,0.593-0.886,1.448-0.742,2.285l2.065,12.042 c0.362,2.109-1.852,3.717-3.746,2.722l-10.814-5.685c-0.752-0.395-1.651-0.395-2.403,0l-10.814,5.685 c-1.894,0.996-4.108-0.613-3.746-2.722l2.065-12.042c0.144-0.837-0.134-1.692-0.742-2.285l-8.749-8.528 c-1.532-1.494-0.687-4.096,1.431-4.403l12.091-1.757c0.841-0.122,1.568-0.65,1.944-1.412l5.407-10.956 C22.602,0.567,25.338,0.567,26.285,2.486z"/></svg>`
            if {blocked} `<svg fill="#d94b44" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="800px" height="800px" viewBox="0 0 85.16 85.16" xml:space="preserve"><g><path d="M72.697,12.458c-16.611-16.611-43.63-16.611-60.24,0c-16.604,16.611-16.604,43.636,0,60.243 c16.61,16.611,43.637,16.611,60.24,0C89.309,56.094,89.309,29.066,72.697,12.458z M19.129,19.128 c10.917-10.92,27.617-12.618,40.335-5.096L14.037,59.468C6.506,46.749,8.205,30.048,19.129,19.128z M66.024,66.029 c-10.842,10.842-27.381,12.587-40.065,5.25l45.314-45.316C78.621,38.648,76.873,55.187,66.024,66.029z"/></g></svg>`
        </div>
    </div>

    <div class="contacts-entry-about">
        <p>{profile.about}</p>
    </div>

    <div class="contacts-entry-contact">
        if {profile.phones.length} > 0 `
        <div class="contacts-contact-phone">
            <p class="contact-contact-phone-title">Phone(s):</p>
            <ul class="contacts-contact-phone-numbers">
                <p>
                    <span class="contact-contact-phone-number">{profile.phones[x].number}</span>
                    if {profile.phones[x].type} `(<span class="contact-contact-phone-type">{profile.phones[x].type}</span>)`
                </p>
            </ul>
        </div>
        ` with `.contacts-contact-phone-numbers` having `profile.phones.length` children 
        #(Note the CSV column title is profile.phones[0].number where [0] indicates it is a list, not there is only index 0)

        if {profile.website} `
        <div class="contacts-contact-website">
            <p class="contact-contact-website-title">Website:</p>
            <a class="contact-contact-website-url" href="{profile.website}">{profile.website}</a>
        </div>
        `
    </div>
    
    <div class="contacts-entry-more">
        <!-- This is collapsible -->
        <details>
            <summary>More information</summary>

            if {profile.mood} `
            <div class="contacts-more-entry contacts-more-mood">
                <p>
                    <span class="contacts-more-key">profile.mood: </span>
                    <span class="contacts-more-value">{profile.mood}</span>
                </p>
            </div>
            `

            if {profile.name.first} and {profile.name.surname}`
            <div class="contacts-more-entry contacts-more-splitname">
                <p>
                    <span class="contacts-more-splitname-first">{profile.name.first} </span>
                    <span class="contacts-more-splitname-surname">{profile.name.surname}</span>
                </p>
            </div>
            `

            if {profile.gender} `
            <div class="contacts-more-entry contacts-more-gender">
                <p>
                    <span class="contacts-more-key">profile.gender: </span>
                    <span class="contacts-more-value">{profile.gender}</span>
                </p>
            </div>
            `

            if {profile.locations.length} > 0 `
            <div class="contacts-more-entry contacts-more-locations">
                <ul class="contacts-more-locations-list">
                    <p>
                        <span class="contacts-more-location-type">{profile.locations[x].type}: </span>
                        <span class="contacts-more-location-country">{profile.locations[x].country}, </span>
                        <span class="contacts-more-location-city">{profile.locations[x].city}</span>
                    </p>
                </ul>
            </div>
            ` with `.contacts-more-locations-list` having `profile.locations.length` children 
            #(Note the CSV column title begins with profile.locations[0] where [0] indicates it is a list, not there is only index 0)

            if {profile.sources} `
            <div class="contacts-more-entry contacts-more-sources">
                <p>
                    <span class="contacts-more-key">profile.sources: </span>
                    <span class="contacts-more-value">{profile.sources}</span>
                </p>
            </div>
            `

            if {profile.creation_time} `
            <div class="contacts-more-entry contacts-more-creationtime">
                <p>
                    <span class="contacts-more-key">profile.creation_time: </span>
                    <span class="contacts-more-value">{formatDate(profile.creation_time)}</span>
                </p>
            </div>
            ` # `profile.creation_time` is formatted from epoch into date then ran through `formatDate` to get a date string
        </details>
    </div>
</div>
```