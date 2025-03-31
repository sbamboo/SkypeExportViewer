function renderEndpointsTab(endpoints_json) {
    const endpointsTabWrapper = document.createElement("div");
    endpointsTabWrapper.classList.add("entrypoints-tab-wrapper");
    endpointsTabWrapper.innerHTML += `<pre>${JSON.stringify(endpoints_json, null, 2)}</pre>`;
    return endpointsTabWrapper;
}