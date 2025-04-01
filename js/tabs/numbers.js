function renderNumbersTab(numbers_csv) {
    const numbersTabWrapper = document.createElement("div");
    numbersTabWrapper.classList.add("numbers-tab-wrapper");
    numbersTabWrapper.innerHTML += `<pre>${numbers_csv}</pre>`;
    return numbersTabWrapper;
}