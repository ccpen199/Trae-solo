const ENV = window.__ENV__ || {};
const projectName = ENV.PROJECT_NAME || (location.pathname.includes("may-") ? location.pathname.split("/").find(Boolean) : document.title);
const frontendPort = Number(location.port || ENV.FRONTEND_PORT || 49095);
const API = ENV.API_BASE_URL || `http://127.0.0.1:${ENV.BACKEND_PORT || 59095}/api`;

const state = {
  services: [],
  selectedServiceId: 1,
  token: localStorage.getItem("pinai-token") || "",
};
const MAX_ORDER_ROWS = 12;

const $ = (selector) => document.querySelector(selector);

function showResult(payload) {
  $("#resultBox").textContent = JSON.stringify(payload, null, 2);
}

async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });
  const data = await res.json();
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

function serviceCard(item) {
  return `
    <article class="card">
      <div class="card-top">
        <span>${item.category}</span>
        <strong>${item.status}</strong>
      </div>
      <h3>${item.title}</h3>
      <p>${item.description}</p>
      <div class="meta">
        <span>${item.provider}</span>
        <span>评分 ${item.rating}</span>
      </div>
      <div class="card-actions">
        <strong>¥${item.price}</strong>
        <button type="button" data-buy="${item.id}">购买</button>
      </div>
    </article>
  `;
}

function renderServices(items, searchTerm = "") {
  state.services = items;
  $("#serviceList").innerHTML = items.length
    ? items.map(serviceCard).join("")
    : `<article class="card empty-state"><h3>未找到匹配服务</h3><p>搜索词“${searchTerm || "当前分类"}”暂无结果，可重置筛选或直接提交需求。</p></article>`;
  $("#serviceSelect").innerHTML = items.length
    ? items.map((item) => `<option value="${item.id}">${item.title} - ¥${item.price}</option>`).join("")
    : `<option value="1">暂无匹配服务，可提交需求</option>`;
  document.querySelectorAll("[data-buy]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedServiceId = Number(button.dataset.buy);
      $("#serviceSelect").value = String(state.selectedServiceId);
      location.hash = "#purchase";
    });
  });
}

async function loadHealth() {
  $("#frontendUrl").textContent = location.origin;
  $("#backendUrl").textContent = API;
  try {
    const data = await api("/health");
    $("#projectTitle").textContent = `${data.project || projectName} 本地服务台`;
    $("#healthState").textContent = "正常";
    showResult(data);
  } catch (error) {
    $("#healthState").textContent = `异常: ${error.message}`;
  }
}

async function loadCategories() {
  const { data } = await api("/categories");
  $("#categorySelect").innerHTML = `<option>全部</option>${data.map((item) => `<option>${item}</option>`).join("")}`;
}

async function loadServices() {
  const rawSearch = $("#searchInput").value.trim();
  const search = encodeURIComponent(rawSearch);
  const category = encodeURIComponent($("#categorySelect").value);
  const { data } = await api(`/services?search=${search}&category=${category}`);
  renderServices(data, rawSearch);
}

async function loadProfile() {
  const profile = await api("/profile");
  const orders = await api(`/orders?limit=${MAX_ORDER_ROWS}`);
  const user = profile.data.user || {};
  $("#profileBox").innerHTML = `
    <div><span class="label">用户</span><strong>${user.name || "演示用户"}</strong></div>
    <div><span class="label">手机</span><strong>${user.phone || "13800138000"}</strong></div>
    <div><span class="label">订单</span><strong>${profile.data.stats.orders}</strong></div>
    <div><span class="label">需求</span><strong>${profile.data.stats.submissions}</strong></div>
  `;
  $("#ordersBox").innerHTML = orders.data.length
    ? orders.data.map((order) => `<div class="row"><span>#${order.id} ${order.customer}</span><strong>${order.status} ¥${order.amount}</strong></div>`).join("")
    : `<div class="row"><span>暂无订单</span><strong>可在购买提交区创建</strong></div>`;
}

async function loadAdmin() {
  const { data } = await api("/admin/summary");
  $("#adminStats").innerHTML = `
    <div><span class="label">用户</span><strong>${data.users}</strong></div>
    <div><span class="label">服务</span><strong>${data.services}</strong></div>
    <div><span class="label">订单</span><strong>${data.orders}</strong></div>
    <div><span class="label">收入</span><strong>¥${data.revenue}</strong></div>
  `;
  $("#adminLogs").innerHTML = data.logs.map((log) => `<div class="row"><span>${log.actor}</span><strong>${log.action}</strong></div>`).join("");
}

function formData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function bindEvents() {
  $("#loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = await api("/auth/login", { method: "POST", body: JSON.stringify(formData(event.currentTarget)) });
    state.token = data.token;
    localStorage.setItem("pinai-token", data.token);
    showResult(data);
    await loadProfile();
  });

  $("#searchInput").addEventListener("input", loadServices);
  $("#categorySelect").addEventListener("change", loadServices);
  $("#resetFilters").addEventListener("click", async () => {
    $("#searchInput").value = "";
    $("#categorySelect").value = "全部";
    await loadServices();
  });

  $("#orderForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = await api("/orders", { method: "POST", body: JSON.stringify(formData(event.currentTarget)) });
    showResult(data);
    await Promise.all([loadProfile(), loadAdmin()]);
  });

  $("#submissionForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = await api("/submissions", { method: "POST", body: JSON.stringify(formData(event.currentTarget)) });
    showResult(data);
    await Promise.all([loadProfile(), loadAdmin()]);
  });

  $("#refreshProfile").addEventListener("click", loadProfile);
  $("#refreshAdmin").addEventListener("click", loadAdmin);
}

async function boot() {
  bindEvents();
  await loadHealth();
  await loadCategories();
  await loadServices();
  await loadProfile();
  await loadAdmin();
}

boot().catch((error) => {
  $("#healthState").textContent = `异常: ${error.message}`;
  showResult({ ok: false, error: error.message, api: API });
});
