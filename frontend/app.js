const statusEl = document.querySelector("#connectionStatus");
const metricGrid = document.querySelector("#metricGrid");
const workItems = document.querySelector("#workItems");
const apiPayload = document.querySelector("#apiPayload");
const refreshButton = document.querySelector("#refreshButton");

function backendBaseUrl() {
  const url = new URL(window.location.href);
  const frontendPort = Number(url.port || 49229);
  const backendPort = frontendPort + 10000;
  return `${url.protocol}//${url.hostname}:${backendPort}`;
}

function setStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.classList.toggle("error", isError);
}

function renderMetrics(metrics) {
  metricGrid.innerHTML = metrics
    .map(
      (metric) => `
        <article class="metric">
          <span>${metric.label}</span>
          <strong>${metric.value}</strong>
          <em>${metric.trend}</em>
        </article>
      `,
    )
    .join("");
}

function renderItems(items) {
  workItems.innerHTML = items
    .map(
      (item) => `
        <div class="row">
          <strong>${item.title}</strong>
          <span>${item.owner}</span>
          <span class="state">${item.state}</span>
          <span>${item.dueTime}</span>
        </div>
      `,
    )
    .join("");
}

async function loadDashboard() {
  setStatus("Checking API");
  const response = await fetch(`${backendBaseUrl()}/api/dashboard`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }
  const payload = await response.json();
  renderMetrics(payload.metrics || []);
  renderItems(payload.items || []);
  apiPayload.textContent = JSON.stringify(payload, null, 2);
  setStatus("API online");
}

refreshButton.addEventListener("click", () => {
  loadDashboard().catch((error) => {
    setStatus("API error", true);
    apiPayload.textContent = error.message;
  });
});

loadDashboard().catch((error) => {
  setStatus("API error", true);
  apiPayload.textContent = error.message;
});
