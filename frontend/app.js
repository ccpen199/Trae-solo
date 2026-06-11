const projectName = location.pathname.includes("may-") ? location.pathname.split("/").find(Boolean) : document.title;
const frontendPort = Number(location.port || 49089);
const backendPort = frontendPort + 10000;
const API = `http://127.0.0.1:${backendPort}/api`;

const DEFAULT_SCENARIO = {
  title: "PinAI 本地服务台",
  eyebrow: "Local SQLite Full Stack",
  loginHeading: "演示账号快速进入",
  listHeading: "服务与方案",
  orderHeading: "提交购买或业务需求",
  submissionHeading: "没有合适服务时创建需求",
  adminHeading: "运营看板",
  searchPlaceholder: "搜索资产、预算、账本、报销",
  note: "请安排顾问跟进本次服务。",
  submissionTitle: "现金流诊断需求",
  submissionDetail: "希望按月分析收支并给出提醒规则。",
};

const SCENARIOS = {
  "may-89089": {
    title: "新能源汽车充电运营平台",
    eyebrow: "EV Charging Operations",
    loginHeading: "车主、场站、桩企与电网账号入口",
    listHeading: "充电站、桩设备与监管能力",
    orderHeading: "发起预约充电、远程启停或运维工单",
    submissionHeading: "提交私桩共享、绿电溯源或监管需求",
    adminHeading: "充电行为、碳减排与设施监管看板",
    searchPlaceholder: "搜索空闲桩、OCPP、峰谷电价、碳减排",
    note: "请按车辆电量、排队预测和峰谷电价生成预约充电方案。",
    submissionTitle: "家用桩共享收益申请",
    submissionDetail: "接入私桩可用时段，要求收益自动分账并同步绿电溯源凭证。",
  },
  "may-89090": {
    title: "广州广电城市服务融合平台",
    eyebrow: "Media And City Service",
    loginHeading: "记者、编辑、运营与应急账号入口",
    listHeading: "新闻生产、分发、互动与城市服务",
    orderHeading: "提交选题编审、全媒体发布或服务接入",
    submissionHeading: "提交UGC线索、政务办事或民生热线需求",
    adminHeading: "舆情监测、传播效果与应急指令看板",
    searchPlaceholder: "搜索通稿、直播、交通路况、非遗、舆情",
    note: "请对本地新闻线索做敏感词过滤、事实核查和多端发布排期。",
    submissionTitle: "广州城市服务聚合需求",
    submissionDetail: "希望接入政务办事入口、交通实时路况和文旅预约，并跟踪互动转化。",
  },
  "may-89093": {
    title: "社区物联网门禁与生活服务平台",
    eyebrow: "IoT Access And Community Service",
    loginHeading: "住户、访客、商户与物业账号入口",
    listHeading: "门禁认证、访客授权与生活服务",
    orderHeading: "提交开门授权、访客登记或商户服务",
    submissionHeading: "提交异常滞留、设备预警或公告通知需求",
    adminHeading: "设备健康、安全事件与公告触达看板",
    searchPlaceholder: "搜索人脸识别、NFC、二维码、体温、券核销",
    note: "请为访客生成限时通行权限，限定楼栋、单元和有效期。",
    submissionTitle: "访客OCR登记与体温联动",
    submissionDetail: "访客扫码登记需识别身份证OCR并触发体温检测，异常滞留推送物业弹窗。",
  },
  "may-89094": {
    title: "山东区域垂直招聘平台",
    eyebrow: "Regional Talent Matching",
    loginHeading: "求职者、企业HR、院校与监管账号入口",
    listHeading: "简历建档、岗位匹配与本地服务",
    orderHeading: "提交岗位匹配、面试预约或录用意向",
    submissionHeading: "提交资质审核、补贴申领或培训报名需求",
    adminHeading: "人才供需热力、招聘效能与虚假职位拦截",
    searchPlaceholder: "搜索山东地市、LBS、简历OCR、社保核验",
    note: "请根据地市、经验年限、技能栈和期望薪资推荐岗位并预约面试。",
    submissionTitle: "企业资质强审核申请",
    submissionDetail: "需要核验营业执照、社保缴纳数据和用工黑名单，并进入招聘效能分析。",
  },
};

const SCENARIO_BY_PORT = {
  49089: "may-89089",
  49090: "may-89090",
  49093: "may-89093",
  49094: "may-89094",
};

let scenario = SCENARIOS[SCENARIO_BY_PORT[frontendPort]] || DEFAULT_SCENARIO;

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

function applyScenarioCopy() {
  document.title = scenario.title;
  $("#projectTitle").textContent = scenario.title;
  document.querySelector(".topbar .eyebrow").textContent = scenario.eyebrow;
  document.querySelector("#auth h2").textContent = scenario.loginHeading;
  document.querySelector("#search h2").textContent = scenario.listHeading;
  document.querySelector("#purchase h2").textContent = scenario.orderHeading;
  document.querySelector("#submit h2").textContent = scenario.submissionHeading;
  document.querySelector("#admin h2").textContent = scenario.adminHeading;
  $("#searchInput").placeholder = scenario.searchPlaceholder;
  document.querySelector("#orderForm textarea[name='note']").value = scenario.note;
  document.querySelector("#submissionForm input[name='title']").value = scenario.submissionTitle;
  document.querySelector("#submissionForm textarea[name='detail']").value = scenario.submissionDetail;
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
    : `<article class="card empty-state"><h3>未找到匹配服务</h3><p>搜索词“${searchTerm || "当前条件"}”暂无结果，可重置筛选或提交业务需求。</p></article>`;
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
    scenario = SCENARIOS[data.project] || scenario;
    applyScenarioCopy();
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
  const recentOrders = orders.data.slice(0, MAX_ORDER_ROWS);
  $("#profileBox").innerHTML = `
    <div><span class="label">用户</span><strong>${user.name || "演示用户"}</strong></div>
    <div><span class="label">手机</span><strong>${user.phone || "13800138000"}</strong></div>
    <div><span class="label">订单</span><strong>${profile.data.stats.orders}</strong></div>
    <div><span class="label">需求</span><strong>${profile.data.stats.submissions}</strong></div>
  `;
  $("#ordersBox").innerHTML = recentOrders.length
    ? recentOrders.map((order) => `<div class="row"><span>#${order.id} ${order.customer}</span><strong>${order.status} ¥${order.amount}</strong></div>`).join("")
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
  applyScenarioCopy();
  bindEvents();
  await loadHealth();
  await loadCategories();
  await loadServices();
  await loadProfile();
  await loadAdmin();
  document.body.dataset.pinaiReady = "true";
}

boot().catch((error) => {
  $("#healthState").textContent = `异常: ${error.message}`;
  showResult({ ok: false, error: error.message, api: API });
});
