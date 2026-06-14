const frontendPort = Number(window.location.port || 49101);
const backendPort = frontendPort + 10000;
const pageHost = window.location.hostname === "localhost" ? "localhost" : "127.0.0.1";
const fallbackHost = pageHost === "localhost" ? "127.0.0.1" : "localhost";

function normalizeApiBase(value) {
  const text = String(value || "").trim();
  if (!text || text === "__API_BASE__") return "";
  return text.replace(/\/$/, "");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

const API_CANDIDATES = unique([
  `http://${pageHost}:${backendPort}/api`,
  normalizeApiBase(window.API_BASE),
  `http://${fallbackHost}:${backendPort}/api`
]);
let API_BASE = API_CANDIDATES[0];

const state = {
  services: [],
  categories: [],
  profile: null,
  admin: null
};

const $ = (selector) => document.querySelector(selector);

function unwrap(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload?.data?.data && !Array.isArray(payload.data)) return payload.data.data;
  return payload?.data ?? payload;
}

async function api(path, options = {}) {
  const candidates = unique([API_BASE, ...API_CANDIDATES]);
  const errors = [];

  for (const base of candidates) {
    const url = `${base}${path}`;
    let response;
    try {
      response = await fetch(url, {
        headers: { "Content-Type": "application/json", ...(options.headers || {}) },
        ...options
      });
    } catch (error) {
      errors.push(`无法连接后端 ${url}: ${error.message || "网络错误"}`);
      continue;
    }

    const raw = await response.text();
    let data = {};
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch {
        errors.push(`接口返回非 JSON: ${url}`);
        continue;
      }
    }

    if (!response.ok || data.ok === false) {
      const message = data.message || response.statusText || `HTTP ${response.status}`;
      errors.push(`${url}: ${message}`);
      if (response.status === 404) continue;
      throw new Error(message);
    }

    API_BASE = base;
    const backendLabel = $("#backendUrl");
    if (backendLabel) backendLabel.textContent = API_BASE;
    return data;
  }

  throw new Error(errors[errors.length - 1] || `无法连接后端 ${path}`);
}

function renderMetrics(summary) {
  const counts = summary?.counts || {};
  $("#metrics").innerHTML = [
    ["在线服务", counts.services || state.services.length],
    ["注册用户", counts.users || 0],
    ["办件总数", counts.applications || 0],
    ["反馈工单", counts.feedbacks || 0]
  ].map(([label, value]) => `<div class="metric"><span>${label}</span><strong>${value}</strong></div>`).join("");
}

function renderCategories() {
  const options = ["全部", ...state.categories.map((item) => item.name)];
  $("#categorySelect").innerHTML = options.map((name) => `<option value="${name}">${name}</option>`).join("");
}

function serviceCard(item) {
  return `
    <article class="card">
      <div class="badges">
        <span class="badge">${item.categoryName || item.serviceType}</span>
        ${item.isHot ? `<span class="badge orange">热门</span>` : ""}
        ${item.isOnline ? `<span class="badge green">在线</span>` : ""}
      </div>
      <h3>${item.name}</h3>
      <p>${item.description || "公共服务事项"}</p>
      <p>${item.processingTime || "实时受理"} · ${item.feeDescription || "免费"}</p>
      <footer>
        <span>${item.accessProtocol || "API"} 接入</span>
        <button data-service="${item.id}">办理</button>
      </footer>
    </article>
  `;
}

function renderServices(list = state.services) {
  const rows = Array.isArray(list) ? list : [];
  $("#serviceCards").innerHTML = rows.length
    ? rows.map(serviceCard).join("")
    : `<article class="card"><h3>暂无匹配服务</h3><p>可重置筛选或通过反馈入口提交服务需求。</p></article>`;
  $("#serviceSelect").innerHTML = state.services.length
    ? state.services.map((item) => `<option value="${item.id}">${item.name}</option>`).join("")
    : `<option value="1">公共服务咨询</option>`;
  document.querySelectorAll("[data-service]").forEach((button) => {
    button.addEventListener("click", () => {
      $("#serviceSelect").value = button.dataset.service;
      window.location.hash = "submit";
    });
  });
}

function renderScenes(scenes) {
  $("#sceneCards").innerHTML = scenes.map((item) => `
    <article class="card">
      <span class="badge green">一件事</span>
      <h3>${item.name}</h3>
      <p>${item.description}</p>
      <p>${(item.workflow || item.workflowConfig?.steps || ["统一表单", "并联审批", "进度通知"]).join(" / ")}</p>
      <footer><span>${(item.serviceIds || []).length || 1} 个关联服务</span><button>开始办理</button></footer>
    </article>
  `).join("");
}

function renderTransit(routes, venues) {
  $("#busList").innerHTML = routes.map((item) => `
    <div class="list-item">
      <strong>${item.routeName || item.routeNo}</strong>
      <p>${item.startStation} 至 ${item.endStation}，首末班 ${item.firstBus} - ${item.lastBus}</p>
      <p>${(item.stations || []).join(" / ")}</p>
    </div>
  `).join("");

  $("#venueList").innerHTML = venues.map((item) => `
    <div class="list-item">
      <strong>${item.name}</strong>
      <p>${item.address}</p>
      <p>${item.openTime || item.open_time} - ${item.closeTime || item.close_time} · ${item.district}</p>
    </div>
  `).join("");
}

function renderProfile(profile) {
  const user = profile.user || {};
  $("#profileCard").innerHTML = `
    <div class="profile-box">
      <h3>${user.realName || user.name || "演示用户"}</h3>
      <p>手机号 ${user.phone || "13800138000"} · ${user.district || "常州市"}</p>
      <p>实名认证：已认证 · 电子证照 ${profile.certificates?.length || 0} 张</p>
    </div>
  `;
  const applications = profile.applications || [];
  $("#requestList").innerHTML = applications.length
    ? applications.map((item) => `<div class="list-item"><strong>${item.serviceName || "公共服务办件"} #${item.requestNo || item.id}</strong><p>${item.status || "processing"} · ${item.createdAt || ""}</p></div>`).join("")
    : `<div class="list-item"><strong>暂无办件</strong><p>提交办理后会在这里展示进度。</p></div>`;
}

function renderFeedback(items) {
  $("#feedbackList").innerHTML = items.map((item) => `
    <div class="list-item">
      <strong>${item.title}</strong>
      <p>${item.type} · ${item.status} · ${item.region || "常州市"}</p>
      <p>${item.content || ""}</p>
    </div>
  `).join("");
}

function renderAdmin(summary, heatmap) {
  const counts = summary.counts || {};
  $("#adminSummary").innerHTML = [
    ["用户", counts.users || 0],
    ["服务", counts.services || 0],
    ["办件", counts.applications || 0],
    ["反馈", counts.feedbacks || 0]
  ].map(([label, value]) => `<div class="metric"><span>${label}</span><strong>${value}</strong></div>`).join("");

  $("#heatmap").innerHTML = heatmap.map((item) => `
    <div class="heat">
      <span>${item.region}</span>
      <strong>${item.requestCount || item.request_count || 0}</strong>
      <small>${item.status || "online"}</small>
    </div>
  `).join("");
}

async function refreshServices() {
  const query = encodeURIComponent($("#searchInput").value.trim());
  const category = encodeURIComponent($("#categorySelect").value || "全部");
  const data = await api(`/services?search=${query}&category=${category}`);
  renderServices(unwrap(data));
}

async function refreshProfile() {
  const data = await api("/profile");
  state.profile = unwrap(data);
  renderProfile(state.profile);
}

async function refreshAdmin() {
  const [summaryPayload, heatmapPayload] = await Promise.all([
    api("/admin/summary"),
    api("/analytics/heatmap")
  ]);
  const summary = unwrap(summaryPayload);
  const heatmap = unwrap(heatmapPayload);
  state.admin = summary;
  renderMetrics(summary);
  renderAdmin(summary, heatmap);
}

async function safeLoad(path, fallback) {
  try {
    return unwrap(await api(path));
  } catch (error) {
    console.error(`加载 ${path} 失败:`, error);
    return fallback;
  }
}

async function safeRun(label, task) {
  try {
    return await task();
  } catch (error) {
    console.error(`${label} 失败:`, error);
    return null;
  }
}

async function init() {
  $("#frontendUrl").textContent = window.location.origin;
  $("#backendUrl").textContent = API_BASE;

  await safeRun("健康检查", async () => {
    const health = await api("/health");
    $("#healthText").textContent = health.status === "ok" ? "正常" : "异常";
  });
  if ($("#healthText").textContent === "检查中") {
    $("#healthText").textContent = "后端连接中";
  }

  const [categories, services, scenes, routes, venues, feedback] = await Promise.all([
    safeLoad("/categories", [{ name: "政务服务" }, { name: "民生服务" }, { name: "社区治理" }]),
    safeLoad("/services", [
      { id: 1, name: "公积金在线办理", categoryName: "政务服务", description: "公积金查询、提取和进度通知。", isHot: true, isOnline: true },
      { id: 2, name: "户籍业务预约", categoryName: "政务服务", description: "户籍材料复用和窗口预约。", isHot: true, isOnline: true },
      { id: 3, name: "公共场馆预约", categoryName: "民生服务", description: "场馆时段查询和在线预约。", isOnline: true }
    ]),
    safeLoad("/scenes", [
      { id: 101, name: "新生儿一件事", description: "出生证明、户口登记和医保参保联办。", workflow: ["统一表单", "跨部门提交", "进度跟踪"], serviceIds: [1] },
      { id: 102, name: "退休一件事", description: "待遇核定、医保确认和公积金提取协同。", workflow: ["资格校验", "材料复用", "结果通知"], serviceIds: [1] }
    ]),
    safeLoad("/bus/routes", [{ routeName: "B12", startStation: "市民广场", endStation: "文化宫", firstBus: "06:00", lastBus: "22:00", stations: ["市民广场", "行政中心", "文化宫"] }]),
    safeLoad("/venues", [{ name: "常州市政务服务中心", address: "锦绣路政务服务大厅", openTime: "09:00", closeTime: "17:00", district: "新北区" }]),
    safeLoad("/feedback", [])
  ]);

  state.categories = categories;
  state.services = services;
  renderCategories();
  renderServices();
  renderScenes(scenes);
  renderTransit(routes, venues);
  renderFeedback(feedback);
  await safeRun("个人中心加载", refreshProfile);
  await safeRun("后台数据加载", refreshAdmin);
}

$("#searchInput").addEventListener("input", () => refreshServices().catch(console.error));
$("#categorySelect").addEventListener("change", () => refreshServices().catch(console.error));
$("#resetBtn").addEventListener("click", () => {
  $("#searchInput").value = "";
  $("#categorySelect").value = "全部";
  renderServices();
});

$("#accountForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(event.currentTarget));
  try {
    const result = await api("/auth/login", { method: "POST", body: JSON.stringify(body) });
    $("#accountResult").textContent = JSON.stringify(result, null, 2);
    await refreshProfile();
  } catch (error) {
    $("#accountResult").textContent = error.message || String(error);
  }
});

$("#applicationForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(event.currentTarget));
  try {
    const result = await api("/applications", { method: "POST", body: JSON.stringify(body) });
    $("#applicationResult").textContent = JSON.stringify(result, null, 2);
    await refreshProfile();
    await refreshAdmin();
  } catch (error) {
    $("#applicationResult").textContent = `提交办理失败：${error.message || String(error)}`;
  }
});

$("#feedbackForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(event.currentTarget));
  try {
    const result = await api("/feedback", { method: "POST", body: JSON.stringify(body) });
    renderFeedback(unwrap(result));
    await refreshAdmin();
  } catch (error) {
    $("#feedbackList").innerHTML = `<div class="list-item"><strong>反馈提交失败</strong><p>${error.message || String(error)}</p></div>`;
  }
});

$("#bookingBtn").addEventListener("click", async () => {
  try {
    const result = await api("/venues/bookings", {
      method: "POST",
      body: JSON.stringify({ venueId: 1, bookingDate: new Date().toISOString().slice(0, 10), timeSlot: "09:00-10:00", peopleCount: 2 })
    });
    alert(result.message || "预约成功");
  } catch (error) {
    alert(`预约失败：${error.message || String(error)}`);
  }
});

$("#refreshAdmin").addEventListener("click", () => {
  refreshAdmin().catch((error) => {
    $("#adminSummary").innerHTML = `<div class="metric"><span>后台刷新失败</span><strong>异常</strong></div>`;
    console.error(error);
  });
});

init().catch((error) => {
  $("#healthText").textContent = "异常";
  $("#applicationResult").textContent = `页面已加载，后端连接待恢复：${error.message || String(error)}`;
  console.error(error);
});
