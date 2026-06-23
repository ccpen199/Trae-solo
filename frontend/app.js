const API_BASE = "http://127.0.0.1:59143";

const labels = {
  ready: "待处理",
  running: "进行中",
  blocked: "需处理",
};

const healthEl = document.querySelector("#health");
const taskListEl = document.querySelector("#taskList");
const eventsEl = document.querySelector("#events");
const form = document.querySelector("#taskForm");

async function request(path, options) {
  const response = await fetch(`${API_BASE}${path}`, options);
  const data = await response.json();
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }
  return data;
}

function setHealth(ok, text) {
  healthEl.textContent = text;
  healthEl.className = `status ${ok ? "ok" : "error"}`;
}

function renderSummary(summary) {
  document.querySelector("#totalTasks").textContent = summary.totalTasks;
  document.querySelector("#totalPoints").textContent = summary.totalPoints;
  document.querySelector("#running").textContent = summary.running;
  document.querySelector("#ready").textContent = summary.ready;
}

function renderTasks(tasks) {
  if (!tasks.length) {
    taskListEl.innerHTML = '<p class="taskMeta">暂无任务</p>';
    return;
  }
  taskListEl.innerHTML = tasks
    .map(
      (task) => `
        <article class="task">
          <div>
            <strong>${escapeHtml(task.title)}</strong>
            <div class="taskMeta">${escapeHtml(task.owner)} · ${task.points} 积分</div>
          </div>
          <span class="badge ${task.status}">${labels[task.status] || task.status}</span>
        </article>
      `,
    )
    .join("");
}

function renderEvents(events) {
  eventsEl.innerHTML = events
    .map((event) => `<li>${escapeHtml(event.message)}</li>`)
    .join("");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return map[char];
  });
}

async function load() {
  try {
    const health = await request("/api/health");
    setHealth(true, health.ok ? "服务正常" : "服务异常");
    const [summary, tasks, events] = await Promise.all([
      request("/api/summary"),
      request("/api/tasks"),
      request("/api/events"),
    ]);
    renderSummary(summary.summary);
    renderTasks(tasks.tasks);
    renderEvents(events.events);
  } catch (error) {
    setHealth(false, error.message);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = {
    title: document.querySelector("#titleInput").value,
    owner: document.querySelector("#ownerInput").value,
    status: document.querySelector("#statusInput").value,
    points: Number(document.querySelector("#pointsInput").value || 1),
  };
  await request("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  form.reset();
  document.querySelector("#ownerInput").value = "运营";
  document.querySelector("#pointsInput").value = "20";
  await load();
});

document.querySelector("#refreshBtn").addEventListener("click", load);
load();
