const API_BASE = "http://127.0.0.1:59190";

const state = {
  dashboard: null,
  profile: null,
};

const $ = (selector) => document.querySelector(selector);

function money(value) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 0,
  }).format(value);
}

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await response.json();
  if (!response.ok || data.success === false) {
    throw new Error(data.error || `request failed: ${response.status}`);
  }
  return data.data ?? data;
}

function renderMetrics(metrics) {
  $("#metricProjects").textContent = String(metrics.activeProjects);
  $("#metricProgress").textContent = `${metrics.averageProgress}%`;
  $("#metricTickets").textContent = String(metrics.openTickets);
  $("#metricAppointments").textContent = String(metrics.confirmedAppointments);
}

function projectCard(project) {
  return `
    <article class="project-card">
      <span class="badge">${project.status}</span>
      <h3>${project.name}</h3>
      <div class="item-meta">业主：${project.client} · 经理：${project.manager}</div>
      <div class="progress" aria-label="项目进度 ${project.progress}%">
        <span style="width: ${project.progress}%"></span>
      </div>
      <div class="item-meta">预算 ${money(project.budget)} · 交付 ${project.due_date}</div>
      <a class="secondary-button" href="#admin" data-project="${project.id}">查看详情</a>
    </article>
  `;
}

function renderProjects(projects) {
  $("#projectGrid").innerHTML = projects.length
    ? projects.map(projectCard).join("")
    : '<div class="empty">没有匹配项目</div>';
}

function ticketBadge(priority) {
  if (priority === "高") return "badge high";
  if (priority === "中") return "badge medium";
  return "badge";
}

function renderTickets(tickets) {
  $("#ticketList").innerHTML = tickets
    .map(
      (ticket) => `
      <article class="list-item">
        <span class="${ticketBadge(ticket.priority)}">${ticket.priority}优先级</span>
        <h3>${ticket.title}</h3>
        <div class="item-meta">${ticket.status} · ${ticket.owner} · ${ticket.created_at}</div>
      </article>
    `,
    )
    .join("");
}

function renderAppointments(appointments) {
  $("#appointmentList").innerHTML = appointments
    .map(
      (item) => `
      <article class="list-item">
        <span class="badge">${item.status}</span>
        <h3>${item.service}</h3>
        <div class="item-meta">${item.scheduled_at}</div>
        <div>${item.address}</div>
      </article>
    `,
    )
    .join("");
}

function renderProfile(profile) {
  $("#profileCard").innerHTML = `
    <div class="profile-avatar">${profile.name.slice(0, 1)}</div>
    <h3>${profile.name}</h3>
    <div>${profile.role}</div>
    <div class="item-meta">${profile.city} · ${profile.phone}</div>
    <div class="item-meta">最近同步：${new Date(profile.updated_at).toLocaleString("zh-CN")}</div>
  `;
}

function renderActivities(activities) {
  $("#activityList").innerHTML = activities
    .map(
      (activity) => `
      <article class="timeline-item">
        <strong>${activity.project_id}</strong>
        <p>${activity.message}</p>
        <div class="item-meta">${activity.created_at}</div>
      </article>
    `,
    )
    .join("");
}

async function loadDashboard() {
  const [dashboard, profile] = await Promise.all([api("/api/dashboard"), api("/api/profile")]);
  state.dashboard = dashboard;
  state.profile = profile;
  renderMetrics(dashboard.metrics);
  renderProjects(dashboard.projects);
  renderTickets(dashboard.tickets);
  renderAppointments(dashboard.appointments);
  renderActivities(dashboard.activities);
  renderProfile(profile);
}

async function searchProjects() {
  const keyword = encodeURIComponent($("#projectSearch").value.trim());
  const projects = await api(keyword ? `/api/projects?q=${keyword}` : "/api/projects");
  renderProjects(projects);
}

function bindEvents() {
  $("#refreshButton").addEventListener("click", () => {
    loadDashboard().catch(showError);
  });

  $("#projectSearch").addEventListener("input", () => {
    searchProjects().catch(showError);
  });

  $("#ticketForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api("/api/tickets", {
      method: "POST",
      body: JSON.stringify({
        title: form.get("title"),
        priority: form.get("priority"),
        owner: "运营组",
      }),
    });
    event.currentTarget.reset();
    await loadDashboard();
  });
}

function showError(error) {
  console.error(error);
  $("#projectGrid").innerHTML = `<div class="empty">数据加载失败：${error.message}</div>`;
}

bindEvents();
loadDashboard().catch(showError);
