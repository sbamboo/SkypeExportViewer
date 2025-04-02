function renderNumbersTab(numbers_csv) {
    const numbersTabWrapper = document.createElement("div");
    numbersTabWrapper.classList.add("numbers-tab-wrapper");

    const rows = window.CSV.parse(numbers_csv);

    // make table with rows[0] being array of headers and rest rows being data rows in array
    const table = document.createElement("table");
    table.classList.add("numbers-table");
    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");
    const headerRow = document.createElement("tr");
    for (const header of rows[0]) {
        const th = document.createElement("th");
        th.innerText = header;
        headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);
    table.appendChild(thead);
    for (let i = 1; i < rows.length; i++) {
        const row = document.createElement("tr");
        for (const cell of rows[i]) {
            const td = document.createElement("td");
            td.innerText = cell;
            row.appendChild(td);
        }
        tbody.appendChild(row);
    }
    table.appendChild(tbody);
    numbersTabWrapper.appendChild(table);

    return numbersTabWrapper;
}