function renderEntrypointsTab(entrypoints_json) {
    const entrypointsTabWrapper = document.createElement("div");
    entrypointsTabWrapper.classList.add("entrypoints-tab-wrapper");
    entrypointsTabWrapper.innerHTML += `<pre>${JSON.stringify(entrypoints_json, null, 2)}</pre>`;
    return entrypointsTabWrapper.outerHTML;
}