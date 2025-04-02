function renderEndpointsTab(data) {
    const endpointsTabWrapper = document.createElement("div");
    endpointsTabWrapper.classList.add("endpoints-tab-wrapper");
  
    let htmlContent = "<h1>Endpoint Data</h1>";
  
    data.endpoints.forEach((endpoint, index) => {
      htmlContent += `
              <div id="endpoint-${index + 1}" class="endpoint">
                  <h2 class="endpoint-title">Endpoint ${index + 1}</h2>
                  <p class="endpoint-id"><span class="key">Endpoint ID:</span> ${
                    endpoint.endpointId
                  }</p>
                  <p class="timestamp"><span class="key">Timestamp:</span> ${
                    formatDate(endpoint.timestamp)
                  }</p>
          `;
  
      // Transport Details
      htmlContent += `
                  <div class="section-title transport-section-title">Transport Details</div>
                  <table class="transport-table">
                      <thead>
                          <tr>
                              <th class="transport-header">Transport Type</th>
                              <th class="transport-header">Path</th>
                              <th class="transport-header">Caller</th>
                              <th class="transport-header">Method</th>
                              <th class="transport-header">Time</th>
                              <th class="transport-header">Reason</th>
                              <th class="transport-header">Chain ID</th>
                              <th class="transport-header">Message ID</th>
                          </tr>
                      </thead>
                      <tbody>
              `;
  
      endpoint.transports.transports.forEach((transport) => {
        htmlContent += `
                      <tr class="transport-row">
                          <td class="transport-type">${transport.transportType}</td>
                          <td class="transport-path"><span class="transport-url">${
                            transport.path
                          }</span></td>
                          <td class="tracking-info-caller">${
                            transport.trackingInfo.caller || ""
                          }</td>
                          <td class="tracking-info-method">${
                            transport.trackingInfo.method || ""
                          }</td>
                          <td class="tracking-info-time">${
                            formatDate(transport.trackingInfo.time) || ""
                          }</td>
                          <td class="tracking-info-reason">${
                            transport.trackingInfo.reason || ""
                          }</td>
                          <td class="tracking-info-chain-id">${
                            transport.trackingInfo.chainId || ""
                          }</td>
                          <td class="tracking-info-message-id">${
                            transport.trackingInfo.messageId || ""
                          }</td>
                      </tr>
                  `;
      });
  
      htmlContent += `
                      </tbody>
                  </table>
              `;
  
      // Client Description
      htmlContent += `
                  <div class="section-title client-description-title">Client Description</div>
                  <table class="client-description-table">
                      <thead>
                          <tr>
                              <th class="client-description-header">Language</th>
                              <th class="client-description-header">Platform</th>
                              <th class="client-description-header">App ID</th>
                              <th class="client-description-header">Product Context</th>
                          </tr>
                      </thead>
                      <tbody>
                          <tr class="client-description-row">
                              <td class="client-language">${endpoint.clientDescription.languageId}</td>
                              <td class="client-platform">${endpoint.clientDescription.platform}</td>
                              <td class="client-app-id">${endpoint.clientDescription.appId}</td>
                              <td class="client-product-context">${endpoint.clientDescription.productContext}</td>
                          </tr>
                      </tbody>
                  </table>
              `;
  
      // Activity Section for Endpoint 2
      if (endpoint.activity) {
        htmlContent += `
                  <div class="section-title activity-section-title">Activity</div>
                  <p class="activity-state"><strong>State:</strong> ${endpoint.activity.state}</p>
                  <p class="activity-last-update"><strong>Last Update:</strong> ${endpoint.activity.lastUpdate}</p>
              `;
      }
  
      htmlContent += `
              <details class="endpoint-raw-json">
                  <summary>Raw JSON</summary>
                  <pre>${JSON.stringify(endpoint, null, 2)}</pre>
              </details>
              `;
  
      htmlContent += `</div>`;
    });
  
    endpointsTabWrapper.innerHTML = htmlContent;
  
    return endpointsTabWrapper;
  }
  