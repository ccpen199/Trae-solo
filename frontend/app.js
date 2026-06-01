const config = window.APP_CONFIG || {};
const backendUrl = (config.backendUrl || "http://127.0.0.1:56937").replace(/\/$/, "");

const statusDot = document.querySelector("[data-status-dot]");
const statusText = document.querySelector("[data-status-text]");
const backendLabel = document.querySelector("[data-backend-url]");
const updatedAt = document.querySelector("[data-updated-at]");
const totalEntries = document.querySelector("[data-total-entries]");
const readyEntries = document.querySelector("[data-ready-entries]");
const database = document.querySelector("[data-database]");
const entriesList = document.querySelector("[data-entries]");
const refreshButton = document.querySelector("[data-refresh]");

backendLabel.textContent = backendUrl;

function setStatus(state, text) {
  statusDot.dataset.state = state;
  statusText.textContent = text;
}

function formatDate(value) {
  if (!value) return "n/a";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function renderEntries(items) {
  entriesList.innerHTML = "";

  if (!items.length) {
    const empty = document.createElement("li");
    empty.className = "entry empty";
    empty.textContent = "No records found.";
    entriesList.appendChild(empty);
    return;
  }

  for (const item of items) {
    const entry = document.createElement("li");
    entry.className = "entry";

    const header = document.createElement("div");
    header.className = "entry-header";

    const title = document.createElement("h3");
    title.textContent = item.title;

    const status = document.createElement("span");
    status.className = "badge";
    status.textContent = item.status;

    const body = document.createElement("p");
    body.textContent = item.body;

    const created = document.createElement("time");
    created.dateTime = item.created_at;
    created.textContent = formatDate(item.created_at);

    header.append(title, status);
    entry.append(header, body, created);
    entriesList.appendChild(entry);
  }
}

async function getJson(path) {
  const response = await fetch(`${backendUrl}${path}`, {
    headers: { Accept: "application/json" },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`);
  }

  return response.json();
}

async function loadData() {
  setStatus("loading", "Checking services");
  refreshButton.disabled = true;

  try {
    const [health, summary, entries] = await Promise.all([
      getJson("/api/health"),
      getJson("/api/summary"),
      getJson("/api/entries?limit=10")
    ]);

    if (!health.ok) {
      throw new Error("Health check failed");
    }

    totalEntries.textContent = summary.totalEntries;
    readyEntries.textContent = summary.readyEntries;
    database.textContent = summary.database;
    updatedAt.textContent = formatDate(summary.updatedAt);
    renderEntries(entries.items || []);
    setStatus("ready", "Online");
  } catch (error) {
    setStatus("error", "Service error");
    entriesList.innerHTML = "";
    const item = document.createElement("li");
    item.className = "entry empty";
    item.textContent = error.message;
    entriesList.appendChild(item);
  } finally {
    refreshButton.disabled = false;
  }
}

refreshButton.addEventListener("click", loadData);
loadData();
