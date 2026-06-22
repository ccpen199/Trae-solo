const config = window.APP_CONFIG;

const state = {
  dashboard: null,
  leads: [],
};

const statusLabels = {
  new: "待接触",
  contacted: "已接触",
  proposal: "方案中",
  negotiating: "谈判中",
  won: "已成交",
  lost: "已丢单",
};

const priorityLabels = {
  high: "高优先级",
  medium: "中优先级",
  low: "低优先级",
};

async function request(path, options = {}) {
  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `Request failed: ${response.status}`);
  }
  return payload;
}

function currency(value) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) {
    return "暂无";
  }
  return new Date(value).toLocaleString("zh-CN", {
    hour12: false,
  });
}

function metricCard(label, value, tone) {
  return `
    <article class="metric-card ${tone}">
      <span>${label}</span>
      <strong>${value}</strong>
    </article>
  `;
}

function renderDashboard() {
  const metricsGrid = document.getElementById("metrics-grid");
  const statusGrid = document.getElementById("status-grid");
  const activityList = document.getElementById("activity-list");
  const summary = state.dashboard?.summary || {};

  metricsGrid.innerHTML = [
    metricCard("线索总数", summary.total_leads || 0, "warm"),
    metricCard("预算总额", currency(summary.total_budget || 0), "cool"),
    metricCard("在途管道", currency(summary.pipeline_budget || 0), "accent"),
    metricCard("接口地址", config.apiBaseUrl.replace("http://", ""), "neutral"),
  ].join("");

  statusGrid.innerHTML = (state.dashboard?.statusBreakdown || [])
    .map(
      (item) => `
        <div class="chip-card">
          <strong>${statusLabels[item.status] || item.status}</strong>
          <span>${item.count} 条</span>
        </div>
      `
    )
    .join("");

  activityList.innerHTML = (state.dashboard?.recentActivity || [])
    .map(
      (item) => `
        <article class="activity-card">
          <div class="activity-head">
            <strong>${item.name}</strong>
            <span>${item.company}</span>
          </div>
          <p>${item.note}</p>
          <time>${formatDate(item.created_at)}</time>
        </article>
      `
    )
    .join("");
}

function renderLeads() {
  const leadList = document.getElementById("lead-list");
  leadList.innerHTML = state.leads
    .map(
      (lead) => `
        <article class="lead-card" data-lead-id="${lead.id}">
          <div class="lead-card-head">
            <div>
              <h3>${lead.name}</h3>
              <p>${lead.company || "未填写客户名称"}</p>
            </div>
            <span class="pill ${lead.priority}">${priorityLabels[lead.priority] || lead.priority}</span>
          </div>
          <dl class="lead-meta">
            <div><dt>来源</dt><dd>${lead.channel || "未填写"}</dd></div>
            <div><dt>负责人</dt><dd>${lead.owner || "待分配"}</dd></div>
            <div><dt>预算</dt><dd>${currency(lead.budget)}</dd></div>
            <div><dt>跟进数</dt><dd>${lead.activity_count}</dd></div>
          </dl>
          <label>
            当前状态
            <select class="status-select">
              ${Object.entries(statusLabels)
                .map(
                  ([value, label]) =>
                    `<option value="${value}" ${lead.status === value ? "selected" : ""}>${label}</option>`
                )
                .join("")}
            </select>
          </label>
          <label>
            下一步动作
            <input class="next-action-input" value="${escapeHtml(lead.next_action || "")}" />
          </label>
          <div class="lead-actions">
            <button class="ghost-button save-lead-button">保存状态</button>
            <span>最近更新：${formatDate(lead.updated_at)}</span>
          </div>
          <label>
            新增跟进记录
            <textarea class="activity-input" rows="3" placeholder="写下这次跟进结果或风险点"></textarea>
          </label>
          <div class="lead-actions">
            <button class="primary-button add-activity-button">记录跟进</button>
            <button class="ghost-button load-activity-button">查看历史</button>
          </div>
          <div class="lead-history"></div>
        </article>
      `
    )
    .join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function loadAll() {
  const [dashboard, leads] = await Promise.all([
    request("/api/dashboard"),
    request("/api/leads"),
  ]);
  state.dashboard = dashboard;
  state.leads = leads.items || [];
  renderDashboard();
  renderLeads();
}

async function createLead(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const status = document.getElementById("form-status");
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  try {
    status.textContent = "正在创建线索...";
    await request("/api/leads", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    form.reset();
    status.textContent = "线索已落库。";
    await loadAll();
  } catch (error) {
    status.textContent = error.message;
  }
}

async function onLeadListClick(event) {
  const card = event.target.closest(".lead-card");
  if (!card) {
    return;
  }
  const leadId = card.dataset.leadId;

  if (event.target.matches(".save-lead-button")) {
    const statusValue = card.querySelector(".status-select").value;
    const nextAction = card.querySelector(".next-action-input").value;
    await request(`/api/leads/${leadId}`, {
      method: "PATCH",
      body: JSON.stringify({
        status: statusValue,
        next_action: nextAction,
      }),
    });
    await loadAll();
    return;
  }

  if (event.target.matches(".add-activity-button")) {
    const activityInput = card.querySelector(".activity-input");
    const note = activityInput.value.trim();
    if (!note) {
      activityInput.focus();
      return;
    }
    await request(`/api/leads/${leadId}/activities`, {
      method: "POST",
      body: JSON.stringify({ note }),
    });
    activityInput.value = "";
    await loadLeadHistory(card, leadId);
    await loadAll();
    return;
  }

  if (event.target.matches(".load-activity-button")) {
    await loadLeadHistory(card, leadId);
  }
}

async function loadLeadHistory(card, leadId) {
  const historyContainer = card.querySelector(".lead-history");
  historyContainer.innerHTML = `<p class="muted">正在读取历史记录...</p>`;
  const payload = await request(`/api/leads/${leadId}/activities`);
  historyContainer.innerHTML = payload.items.length
    ? payload.items
        .map(
          (item) => `
            <div class="history-item">
              <p>${escapeHtml(item.note)}</p>
              <time>${formatDate(item.created_at)}</time>
            </div>
          `
        )
        .join("")
    : `<p class="muted">暂无历史记录</p>`;
}

async function boot() {
  document.getElementById("project-title").textContent = config.projectTitle;
  document.getElementById("order-id").textContent = config.orderId;
  document.getElementById("frontend-url").textContent = config.frontendUrl;
  document.getElementById("backend-url").textContent = config.backendUrl;

  document.getElementById("lead-form").addEventListener("submit", createLead);
  document.getElementById("lead-list").addEventListener("click", (event) => {
    onLeadListClick(event).catch((error) => {
      const formStatus = document.getElementById("form-status");
      formStatus.textContent = error.message;
    });
  });
  document.getElementById("refresh-button").addEventListener("click", () => {
    loadAll().catch((error) => {
      document.getElementById("form-status").textContent = error.message;
    });
  });

  try {
    await loadAll();
  } catch (error) {
    document.getElementById("metrics-grid").innerHTML = `
      <article class="metric-card neutral">
        <span>加载失败</span>
        <strong>${escapeHtml(error.message)}</strong>
      </article>
    `;
  }
}

boot();
