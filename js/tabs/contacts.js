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