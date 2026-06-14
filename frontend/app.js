const projectName = location.pathname.includes("may-") ? location.pathname.split("/").find(Boolean) : document.title;
const frontendPort = Number(location.port || 49090);
const backendPort = Number(frontendPort) + 10000;
const API = `http://127.0.0.1:${backendPort}/api`;
const API_FALLBACK = API;

const DEFAULT_SCENARIO = {
  title: "广州广电城市服务融合平台",
  eyebrow: "Media And City Service",
  loginHeading: "记者、编辑、运营与应急账号入口",
  listHeading: "新闻生产、分发、互动与城市服务",
  orderHeading: "选题编审、全媒体发布或服务接入申请",
  submissionHeading: "UGC线索报料、政务办事或民生热线诉求",
  adminHeading: "舆情监测、传播效果与应急指令指挥中心",
  searchPlaceholder: "搜索通稿、直播、交通路况、非遗、舆情、应急",
  note: "请对新闻线索做敏感词过滤、事实核查和三审三校流程排期。",
  submissionTitle: "新闻线索与城市服务需求",
  submissionDetail: "希望接入更多政务办事入口、交通实时路况和文旅预约服务，并跟踪传播互动转化效果。",
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
    listHeading: "搜索结果 / 新闻生产、分发、互动与城市服务",
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
    listHeading: "搜索结果 / 简历建档、岗位匹配与本地服务",
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
  const requestInit = {
    headers: {
      "Content-Type": "application/json",
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  };
  const res = await fetch(`${API}${path}`, requestInit);
  const raw = await res.text();
  let data = {};
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error(`HTTP ${res.status}: ${raw.slice(0, 120)}`);
    }
  }
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

function serviceCard(item) {
  const isEntry = item.status === '功能入口' || item.price === 0;
  const entryLinks = {
    '新闻生产': '#news',
    '记者投稿': '#news',
    '政务通稿': '#news',
    'UGC线索': '#news',
    'AI编审': '#news',
    '发布流转': '#news',
    '民生热线': '#city',
    '政务办事': '#city',
    '服务接入': '#city',
    '交通路况': '#city',
    '文旅预约': '#city',
    '非遗文化': '#city',
    '舆情监测': '#opinion',
    '效果归因': '#opinion',
    '应急管理': '#emergency',
  };
  const link = entryLinks[item.category] || '#search';

  if (isEntry) {
    return `
      <article class="card entry-card">
        <div class="card-top">
          <span>${item.category}</span>
          <strong class="entry-tag">功能入口</strong>
        </div>
        <h3>${item.title}</h3>
        <p>${item.description}</p>
        <div class="meta">
          <span>${item.provider}</span>
        </div>
        <div class="card-actions">
          <strong class="entry-free">免费使用</strong>
          <button type="button" class="btn-entry" data-goto="${link}">进入</button>
        </div>
      </article>
    `;
  }

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
  const purchasableItems = items.filter((i) => i.status !== '功能入口' && i.price > 0);
  $("#serviceSelect").innerHTML = purchasableItems.length
    ? purchasableItems.map((item) => `<option value="${item.id}">${item.title} - ¥${item.price}</option>`).join("")
    : `<option value="1">暂无匹配服务，可提交需求</option>`;
  document.querySelectorAll("[data-buy]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedServiceId = Number(button.dataset.buy);
      $("#serviceSelect").value = String(state.selectedServiceId);
      location.hash = "#purchase";
    });
  });
  document.querySelectorAll("[data-goto]").forEach((button) => {
    button.addEventListener("click", () => {
      location.hash = button.dataset.goto;
    });
  });
}

async function loadHealth() {
  $("#frontendUrl").textContent = location.origin;
  $("#backendUrl").textContent = API_FALLBACK;
  try {
    const data = await api("/health");
    if (data && data.ok) {
      scenario = SCENARIOS[data.project] || scenario;
      applyScenarioCopy();
      $("#healthState").textContent = "正常";
      $("#healthState").style.color = "#22c55e";
    } else {
      $("#healthState").textContent = "异常: 返回数据异常";
      $("#healthState").style.color = "#ef4444";
    }
    showResult(data);
  } catch (error) {
    console.error('健康检查失败:', error);
    $("#healthState").textContent = `异常: ${error.message || '连接失败'}`;
    $("#healthState").style.color = "#ef4444";
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
  const articles = await api(`/news/articles?limit=8`);
  const ugcClues = await api(`/ugc/clues?limit=8`);
  const govServices = await api(`/government/services?limit=8`);
  const hotlineRecords = await api(`/hotline/records?limit=8`);
  const serviceAccess = await api(`/service/access?limit=8`);
  const user = profile.data.user || {};
  const recentOrders = orders.data.slice(0, MAX_ORDER_ROWS);
  $("#profileBox").innerHTML = `
    <div><span class="label">用户</span><strong>${user.name || "演示用户"}</strong></div>
    <div><span class="label">手机</span><strong>${user.phone || "13800138000"}</strong></div>
    <div><span class="label">订单</span><strong>${profile.data.stats.orders}</strong></div>
    <div><span class="label">需求</span><strong>${profile.data.stats.submissions}</strong></div>
    <div><span class="label">新闻稿件</span><strong>${profile.data.stats.newsArticles}</strong></div>
    <div><span class="label">UGC线索</span><strong>${profile.data.stats.ugcClues}</strong></div>
    <div><span class="label">政务办事</span><strong>${profile.data.stats.governmentServices}</strong></div>
    <div><span class="label">热线记录</span><strong>${profile.data.stats.hotlineRecords}</strong></div>
    <div><span class="label">服务接入</span><strong>${profile.data.stats.serviceAccess}</strong></div>
  `;
  $("#ordersBox").innerHTML = recentOrders.length
    ? recentOrders.map((order) => `<div class="row"><span>#${order.id} ${order.customer}</span><strong>${order.status} ¥${order.amount}</strong></div>`).join("")
    : `<div class="row"><span>暂无订单</span><strong>可在购买提交区创建</strong></div>`;
  $("#articlesBox").innerHTML = articles.data.length
    ? articles.data.map((a) => `<div class="row"><span>#${a.id} ${a.title}</span><strong>${a.ai_review_status} / ${a.publish_status}</strong></div>`).join("")
    : `<div class="row"><span>暂无稿件</span><strong>可在下方提交记者投稿</strong></div>`;
  $("#ugcBox").innerHTML = ugcClues.data.length
    ? ugcClues.data.map((c) => `<div class="row"><span>#${c.id} ${c.title}</span><strong>${c.verification_status}</strong></div>`).join("")
    : `<div class="row"><span>暂无线索</span><strong>可在下方提交UGC报料</strong></div>`;
  $("#govBox").innerHTML = govServices.data.length
    ? govServices.data.map((g) => `<div class="row"><span>#${g.id} ${g.service_type}</span><strong>${g.status}</strong></div>`).join("")
    : `<div class="row"><span>暂无办事申请</span><strong>可在下方提交政务办事</strong></div>`;
  $("#hotlineBox").innerHTML = hotlineRecords.data.length
    ? hotlineRecords.data.map((h) => `<div class="row"><span>#${h.id} ${h.category}</span><strong>${h.status}</strong></div>`).join("")
    : `<div class="row"><span>暂无热线记录</span><strong>可在下方提交12345热线</strong></div>`;
  $("#accessBox").innerHTML = serviceAccess.data.length
    ? serviceAccess.data.map((s) => `<div class="row"><span>#${s.id} ${s.service_name}</span><strong>${s.status}</strong></div>`).join("")
    : `<div class="row"><span>暂无接入申请</span><strong>可在下方提交服务接入</strong></div>`;
}

async function loadAdmin() {
  try {
    const { data } = await api("/admin/summary");
    const opinions = await api("/public/opinions?limit=10");
    const emergencies = await api("/emergency/commands?limit=15");
  const totalOpinions = data.publicOpinions || 0;
  const positivePct = totalOpinions > 0 ? Math.round((data.positiveOpinions || 0) / totalOpinions * 100) : 0;
  const neutralPct = totalOpinions > 0 ? Math.round((data.neutralOpinions || 0) / totalOpinions * 100) : 0;
  const negativePct = totalOpinions > 0 ? Math.round((data.negativeOpinions || 0) / totalOpinions * 100) : 0;
  $("#adminStats").innerHTML = `
    <div><span class="label">用户</span><strong>${data.users}</strong></div>
    <div><span class="label">服务</span><strong>${data.services}</strong></div>
    <div><span class="label">订单</span><strong>${data.orders}</strong></div>
    <div><span class="label">收入</span><strong>¥${data.revenue}</strong></div>
    <div><span class="label">新闻稿件</span><strong>${data.newsArticles}</strong></div>
    <div><span class="label">UGC线索</span><strong>${data.ugcClues}</strong></div>
    <div><span class="label">政务办事</span><strong>${data.governmentServices}</strong></div>
    <div><span class="label">热线记录</span><strong>${data.hotlineRecords}</strong></div>
    <div><span class="label">编审流程</span><strong>${data.editorialWorkflows}</strong></div>
  `;
  $("#opinionStats").innerHTML = `
    <div><span class="label">舆情声量</span><strong>${totalOpinions}</strong></div>
    <div><span class="label">正面占比</span><strong style="color:#10b981">${positivePct}%</strong></div>
    <div><span class="label">中性占比</span><strong style="color:#6b7280">${neutralPct}%</strong></div>
    <div><span class="label">负面占比</span><strong style="color:#ef4444">${negativePct}%</strong></div>
    <div><span class="label">情绪均值</span><strong>${(data.avgSentimentScore || 0).toFixed(2)}</strong></div>
    <div><span class="label">待响应应急</span><strong style="color:#ef4444">${data.pendingEmergency}</strong></div>
  `;
  $("#adminSentimentBar").innerHTML = `
    <div style="display:flex;height:24px;border-radius:4px;overflow:hidden;">
      <div style="width:${positivePct}%;background:#10b981"></div>
      <div style="width:${neutralPct}%;background:#6b7280"></div>
      <div style="width:${negativePct}%;background:#ef4444"></div>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:12px;margin-top:4px;color:#6b7280;">
      <span>正面 ${positivePct}%</span>
      <span>中性 ${neutralPct}%</span>
      <span>负面 ${negativePct}%</span>
    </div>
  `;
  if (opinions.stats && opinions.stats.topKeywords) {
    $("#adminKeywordsCloud").innerHTML = opinions.stats.topKeywords.map((k) => 
      `<span class="tag" style="font-size:${12 + k.count * 0.5}px">${k.keyword} <small>(${k.count})</small></span>`
    ).join("");
  }
  if (opinions.stats && opinions.stats.topChannels) {
    $("#adminChannelsBar").innerHTML = opinions.stats.topChannels.map((c) => `
      <div class="row">
        <span>${c.channel}</span>
        <div style="flex:1;margin:0 12px;background:#e5e7eb;border-radius:4px;height:8px;">
          <div style="width:${Math.min(100, c.count * 10)}%;height:100%;background:#3b82f6;border-radius:4px;"></div>
        </div>
        <strong>${c.count}</strong>
      </div>
    `).join("");
  }
  $("#opinionList").innerHTML = opinions.data.length
    ? opinions.data.map((o) => `
        <div class="row">
          <span class="tag" style="background:${o.sentiment === '正面' ? '#10b981' : o.sentiment === '负面' ? '#ef4444' : '#6b7280'};color:#fff;">${o.sentiment}</span>
          <span style="flex:1">${o.content.substring(0, 50)}...</span>
          <strong>${o.channel}</strong>
          <small>👁${o.views} 👍${o.likes}</small>
        </div>
      `).join("")
    : `<div class="row"><span>暂无舆情数据</span><strong>可模拟生成测试数据</strong></div>`;
  $("#adminEmergencyList").innerHTML = emergencies.data.length
    ? emergencies.data.map((e) => `
        <div class="row" style="${e.status === '待响应' ? 'background:#fef2f2;' : ''}">
          <span class="tag" style="background:${e.level === '一级' ? '#ef4444' : e.level === '二级' ? '#f59e0b' : '#3b82f6'};color:#fff;">${e.level}</span>
          <span style="flex:1">${e.title}</span>
          <strong>${e.status}</strong>
          ${e.status === '待响应' ? `<button type="button" class="btn-small" data-respond="${e.id}">响应</button>` : ''}
        </div>
      `).join("")
    : `<div class="row"><span>暂无应急指令</span><strong>可在下方发布测试指令</strong></div>`;
  $("#adminLogs").innerHTML = data.logs.map((log) => `<div class="row"><span>${log.actor}</span><strong>${log.action}</strong></div>`).join("");
  document.querySelectorAll("[data-respond]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.respond;
      await api(`/emergency/commands/${id}/respond`, {
        method: "POST",
        body: JSON.stringify({ response: "已收到，立即部署处理", responder: "运营值班" })
      });
      await loadAdmin();
    });
  });
  } catch (error) {
    console.error("后台统计加载失败:", error);
    $("#adminStats").innerHTML = `<div><span class="label">后台状态</span><strong>待刷新</strong></div>`;
    $("#adminLogs").innerHTML = `<div class="row"><span>后台统计接口暂不可用</span><strong>${error.message || "请求失败"}</strong></div>`;
  }
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

  $("#articleForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = await api("/news/articles", { method: "POST", body: JSON.stringify(formData(event.currentTarget)) });
    showResult(data);
    event.currentTarget.reset();
    await Promise.all([loadProfile(), loadAdmin()]);
  });
  $("#ugcForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = await api("/ugc/clues", { method: "POST", body: JSON.stringify(formData(event.currentTarget)) });
    showResult(data);
    event.currentTarget.reset();
    await Promise.all([loadProfile(), loadAdmin()]);
  });
  $("#govForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formDataObj = formData(event.currentTarget);
    const data = await api("/government/services", { method: "POST", body: JSON.stringify(formDataObj) });
    const bizNo = 'GZSW' + Date.now().toString().slice(-10);
    const progress = [
      { step: '提交申请', status: 'completed', time: new Date().toLocaleString(), desc: `已提交${formDataObj.service_type}申请` },
      { step: '材料核验', status: 'active', time: '预计1个工作日', desc: '系统自动核验申请材料' },
      { step: '后台审核', status: 'pending', time: '预计2-3个工作日', desc: '相关部门进行审核' },
      { step: '办理完成', status: 'pending', time: '待完成', desc: '审核通过后颁发电子证照' },
    ];
    const result = {
      ...data,
      data: {
        ...data.data,
        biz_no: bizNo,
        service_type: formDataObj.service_type,
        applicant: formDataObj.applicant_name,
        handle_mode: formDataObj.handle_mode,
        status: '待审核',
        expected_days: '3-5个工作日',
        progress: progress
      }
    };
    showResult(result);
    event.currentTarget.reset();
    const records = JSON.parse(localStorage.getItem('cityRecords') || '[]');
    records.unshift({
      id: Date.now(),
      type: '政务办事',
      title: `${formDataObj.service_type}申请`,
      biz_no: bizNo,
      status: '待审核',
      progress: progress,
      result: `业务编号 ${bizNo}，预计3-5个工作日办结`,
      created_at: new Date().toLocaleString()
    });
    localStorage.setItem('cityRecords', JSON.stringify(records.slice(0, 50)));
    await Promise.all([loadProfile(), loadAdmin(), loadCityRecords()]);
  });
  $("#hotlineForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formDataObj = formData(event.currentTarget);
    const data = await api("/hotline/records", { method: "POST", body: JSON.stringify(formDataObj) });
    const bizNo = 'GZRX' + Date.now().toString().slice(-10);
    const urgencyMap = { '一般': '5-7个工作日', '紧急': '2-3个工作日', '特急': '24小时内' };
    const progress = [
      { step: '诉求受理', status: 'completed', time: new Date().toLocaleString(), desc: '已登记您的诉求' },
      { step: '分类派单', status: 'active', time: '预计2小时内', desc: '分派至相关责任部门' },
      { step: '部门处理', status: 'pending', time: urgencyMap[formDataObj.urgency] || '5-7个工作日', desc: '责任部门调查处理' },
      { step: '结果反馈', status: 'pending', time: '待完成', desc: '向您反馈处理结果' },
      { step: '满意度评价', status: 'pending', time: '待完成', desc: '请对处理结果进行评价' },
    ];
    const result = {
      ...data,
      data: {
        ...data.data,
        biz_no: bizNo,
        category: formDataObj.category,
        urgency: formDataObj.urgency,
        caller: formDataObj.caller_name,
        status: '已受理',
        expected_time: urgencyMap[formDataObj.urgency] || '5-7个工作日',
        progress: progress
      }
    };
    showResult(result);
    event.currentTarget.reset();
    const records = JSON.parse(localStorage.getItem('cityRecords') || '[]');
    records.unshift({
      id: Date.now(),
      type: '12345热线',
      title: `${formDataObj.category}诉求`,
      biz_no: bizNo,
      status: '已受理',
      progress: progress,
      result: `工单编号 ${bizNo}，预计${urgencyMap[formDataObj.urgency] || '5-7个工作日'}内回复`,
      created_at: new Date().toLocaleString()
    });
    localStorage.setItem('cityRecords', JSON.stringify(records.slice(0, 50)));
    await Promise.all([loadProfile(), loadAdmin(), loadCityRecords()]);
  });
  $("#accessForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formDataObj = formData(event.currentTarget);
    const data = await api("/service/access", { method: "POST", body: JSON.stringify(formDataObj) });
    const bizNo = 'GZJR' + Date.now().toString().slice(-10);
    const progress = [
      { step: '接入申请', status: 'completed', time: new Date().toLocaleString(), desc: `已提交${formDataObj.service_name}接入申请` },
      { step: '技术评估', status: 'active', time: '预计3个工作日', desc: '技术可行性评估' },
      { step: '接口开发', status: 'pending', time: '预计5-7个工作日', desc: 'API接口开发联调' },
      { step: '测试上线', status: 'pending', time: '预计3个工作日', desc: '功能测试与上线' },
    ];
    const result = {
      ...data,
      data: {
        ...data.data,
        biz_no: bizNo,
        service_name: formDataObj.service_name,
        provider: formDataObj.provider,
        status: '技术评估中',
        expected_days: '10-15个工作日',
        progress: progress
      }
    };
    showResult(result);
    event.currentTarget.reset();
    const records = JSON.parse(localStorage.getItem('cityRecords') || '[]');
    records.unshift({
      id: Date.now(),
      type: '服务接入',
      title: `${formDataObj.service_name}接入`,
      biz_no: bizNo,
      status: '技术评估中',
      progress: progress,
      result: `申请编号 ${bizNo}，预计10-15个工作日完成接入`,
      created_at: new Date().toLocaleString()
    });
    localStorage.setItem('cityRecords', JSON.stringify(records.slice(0, 50)));
    await Promise.all([loadProfile(), loadAdmin(), loadCityRecords()]);
  });
  $("#opinionForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = await api("/public/opinions", { method: "POST", body: JSON.stringify(formData(event.currentTarget)) });
    showResult(data);
    event.currentTarget.reset();
    await loadAdmin();
  });
  $("#emergencyForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = await api("/emergency/commands", { method: "POST", body: JSON.stringify(formData(event.currentTarget)) });
    showResult(data);
    event.currentTarget.reset();
    await loadAdmin();
  });

  $("#genOpinionTest").addEventListener("click", async () => {
    const topics = ["广州广电", "城市服务", "交通路况", "文旅预约", "非遗文化", "政务服务", "应急管理"];
    const channels = ["微博", "微信公众号", "抖音", "小红书", "今日头条", "B站", "本地论坛"];
    for (let i = 0; i < 10; i++) {
      await api("/public/opinions", {
        method: "POST",
        body: JSON.stringify({
          keyword: topics[Math.floor(Math.random() * topics.length)],
          channel: channels[Math.floor(Math.random() * channels.length)],
          source: Math.random() > 0.5 ? "社交媒体" : "新闻媒体",
          content: `关于${topics[Math.floor(Math.random() * topics.length)]}的讨论内容 ${i + 1}`,
          views: Math.floor(Math.random() * 50000),
          likes: Math.floor(Math.random() * 3000),
          comments: Math.floor(Math.random() * 500),
          shares: Math.floor(Math.random() * 200),
        })
      });
    }
    await loadAdmin();
  });

  document.querySelectorAll(".form-tabs").forEach((tabs) => {
    tabs.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tabName = btn.dataset.tab;
        const parent = btn.closest(".panel");
        parent.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
        parent.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));
        btn.classList.add("active");
        parent.querySelector(`.tab-content[data-tab="${tabName}"]`).classList.add("active");
      });
    });
  });

  $("#govArticleForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formDataObj = formData(event.currentTarget);
    formDataObj.source = "政务通稿";
    formDataObj.gov_status = "待初审";
    const data = await api("/news/articles", { method: "POST", body: JSON.stringify(formDataObj) });
    showResult(data);
    event.currentTarget.reset();
    await Promise.all([loadProfile(), loadAdmin(), loadArticles()]);
  });

  $("#refreshNews").addEventListener("click", loadArticles);
  $("#refreshCity").addEventListener("click", loadCityRecords);
  $("#refreshOpinion").addEventListener("click", () => Promise.all([loadOpinionOverview(), loadEvents()]));
  $("#refreshEmergency").addEventListener("click", () => Promise.all([loadEmergencyList(), loadEmergencyTimeline(), loadEmergencyStats()]));

  $("#trafficForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = formData(event.currentTarget);
    const mockResult = {
      ok: true,
      data: {
        road: data.road,
        status: Math.random() > 0.5 ? "畅通" : "缓行",
        avg_speed: Math.floor(Math.random() * 40) + 15,
        travel_time: "预计 " + Math.floor(Math.random() * 30) + 10 + " 分钟",
        alternatives: ["天河东路", "黄埔大道"],
        query_time: new Date().toLocaleString()
      }
    };
    showResult(mockResult);
    const records = JSON.parse(localStorage.getItem('cityRecords') || '[]');
    records.unshift({
      id: Date.now(),
      type: '交通查询',
      title: `${data.road}路况查询`,
      status: '已完成',
      result: `${mockResult.data.status}，平均车速 ${mockResult.data.avg_speed}km/h`,
      created_at: new Date().toLocaleString()
    });
    localStorage.setItem('cityRecords', JSON.stringify(records.slice(0, 20)));
    await loadCityRecords();
  });

  $("#tourismForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = formData(event.currentTarget);
    const bookingNo = 'BK' + Date.now().toString().slice(-8);
    const progress = [
      { step: '预约提交', status: 'completed', time: new Date().toLocaleString(), desc: `已提交${data.venue}预约` },
      { step: '系统核验', status: 'completed', time: new Date().toLocaleString(), desc: '核验预约资格与余票' },
      { step: '预约成功', status: 'active', time: '即时生效', desc: `预约号 ${bookingNo}` },
      { step: '扫码入场', status: 'pending', time: data.date + ' ' + data.time_slot, desc: '请凭预约二维码入场' },
    ];
    const mockResult = {
      ok: true,
      data: {
        booking_no: bookingNo,
        venue: data.venue,
        date: data.date,
        time_slot: data.time_slot,
        people_count: data.people_count,
        status: '预约成功',
        qr_code: 'QR_' + bookingNo,
        progress: progress
      }
    };
    showResult(mockResult);
    event.currentTarget.reset();
    const records = JSON.parse(localStorage.getItem('cityRecords') || '[]');
    records.unshift({
      id: Date.now(),
      type: '文旅预约',
      title: `${data.venue}预约`,
      biz_no: bookingNo,
      status: '预约成功',
      progress: progress,
      result: `预约号 ${bookingNo}，${data.date} ${data.time_slot}`,
      created_at: new Date().toLocaleString()
    });
    localStorage.setItem('cityRecords', JSON.stringify(records.slice(0, 50)));
    await loadCityRecords();
  });
}

function generateArticleCode(id) {
  const date = new Date();
  const prefix = 'GZGD';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const seq = String(id).padStart(6, '0');
  return `${prefix}${year}${month}${seq}`;
}

function renderWorkflowSteps(article) {
  const steps = [
    { title: '编辑审核', key: 'edit_review' },
    { title: '主任审核', key: 'director_review' },
    { title: '总编签发', key: 'chief_review' },
    { title: '已发布', key: 'published' }
  ];
  let currentStep = 0;
  if (article.publish_status === '编辑审核中') currentStep = 1;
  else if (article.publish_status === '主任审核中') currentStep = 2;
  else if (article.publish_status === '总编审核中') currentStep = 3;
  else if (article.publish_status === '已发布') currentStep = 4;

  return `
    <div class="workflow-steps">
      ${steps.map((step, i) => {
        let status = 'pending';
        if (i < currentStep) status = 'completed';
        else if (i === currentStep - 1) status = 'active';
        return `
          <div class="workflow-step ${status}">
            <div class="step-title">${step.title}</div>
            <div class="step-time">${i < currentStep ? '✓ 已完成' : status === 'active' ? '⏳ 处理中' : '待处理'}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderArticleDetail(article) {
  const articleCode = generateArticleCode(article.id);
  const sensitiveWords = article.ai_sensitive_words ? JSON.parse(article.ai_sensitive_words) : [];
  const factCheckScore = article.ai_fact_check_score || 0;
  const scoreColor = factCheckScore >= 90 ? '#22c55e' : factCheckScore >= 70 ? '#eab308' : '#ef4444';

  return `
    <button type="button" class="btn-small" onclick="document.getElementById('articleDetail').style.display='none'">← 返回列表</button>
    <h4 style="margin-top:16px;">稿件基本信息</h4>
    <div class="stats">
      <div><span class="label">稿件编号</span><strong class="article-code">${articleCode}</strong></div>
      <div><span class="label">标题</span><strong>${article.title}</strong></div>
      <div><span class="label">分类</span><strong>${article.category}</strong></div>
      <div><span class="label">来源归属</span><strong>${article.source}</strong></div>
      <div><span class="label">作者</span><strong>${article.author}</strong></div>
      <div><span class="label">发布状态</span><strong>${article.publish_status}</strong></div>
    </div>

    ${article.source === '政务通稿' ? `
    <h4>政务通稿信息</h4>
    <div class="stats">
      <div><span class="label">发布部门</span><strong>${article.gov_department || '市委宣传部'}</strong></div>
      <div><span class="label">政务联系人</span><strong>${article.gov_contact || '王主任'}</strong></div>
      <div><span class="label">政务状态</span><strong>${article.gov_status || '待初审'}</strong></div>
    </div>
    ` : ''}

    <h4>三审三校流程</h4>
    ${renderWorkflowSteps(article)}

    <h4>AI审核结果</h4>
    <div class="fact-check-score">
      <div class="score-circle" style="background:${scoreColor}">${factCheckScore}</div>
      <div class="score-info">
        <strong>事实核查评分</strong>
        <small>${factCheckScore >= 90 ? '可信度极高，建议直接通过' : factCheckScore >= 70 ? '可信度较高，建议人工复核' : '可信度较低，需重点核查'}</small>
      </div>
    </div>

    <h4>敏感词检测结果</h4>
    ${sensitiveWords.length > 0 ? `
    <div class="sensitive-result">
      <strong>⚠️ 检测到 ${sensitiveWords.length} 个敏感词</strong>
      <div style="margin-top:8px;">
        ${sensitiveWords.map(w => `<span class="tag" style="background:#fee2e2;color:#dc2626;margin-right:6px;">${w}</span>`).join('')}
      </div>
    </div>
    ` : `
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:10px;">
      <strong>✅ 未检测到敏感词</strong>
    </div>
    `}

    <h4>稿件内容</h4>
    <div style="background:#fff;padding:16px;border-radius:6px;border:1px solid #e2e8f0;line-height:1.8;">
      ${article.content}
    </div>

    <h4>操作记录</h4>
    <div class="list">
      <div class="row"><span>${article.created_at}</span><strong>稿件提交</strong></div>
      <div class="row"><span>${article.updated_at}</span><strong>AI审核完成</strong></div>
    </div>
  `;
}

function getWorkflowProgress(publishStatus) {
  const steps = ['草稿', '编辑审核中', '主任审核中', '总编审核中', '已发布'];
  const currentIdx = steps.indexOf(publishStatus);
  if (currentIdx === -1) return 0;
  return Math.round((currentIdx / (steps.length - 1)) * 100);
}

function getSensitiveSummary(article) {
  if (!article.ai_sensitive_words) return '✅ 无敏感词';
  try {
    const words = JSON.parse(article.ai_sensitive_words);
    return `⚠️ ${words.length}个敏感词`;
  } catch {
    return '✅ 无敏感词';
  }
}

function getFactCheckDisplay(score) {
  if (score >= 90) return { color: '#22c55e', text: `${score} 优秀` };
  if (score >= 70) return { color: '#eab308', text: `${score} 良好` };
  return { color: '#ef4444', text: `${score} 待核` };
}

async function loadArticles() {
  try {
    const { data } = await api('/news/articles?limit=20');
    const total = data.length;
    const pendingReview = data.filter(a => a.publish_status !== '已发布' && a.publish_status !== '草稿').length;
    const published = data.filter(a => a.publish_status === '已发布').length;
    const govArticles = data.filter(a => a.source === '政务通稿').length;

    const statsHtml = `
      <div class="stats" style="margin-bottom:16px;">
        <div><span class="label">稿件总数</span><strong>${total}</strong></div>
        <div><span class="label">待审核</span><strong style="color:#f59e0b">${pendingReview}</strong></div>
        <div><span class="label">已发布</span><strong style="color:#22c55e">${published}</strong></div>
        <div><span class="label">政务通稿</span><strong style="color:#7c3aed">${govArticles}</strong></div>
      </div>
    `;

    const listHtml = data.length
      ? data.map((a) => {
          const progress = getWorkflowProgress(a.publish_status);
          const sensitive = getSensitiveSummary(a);
          const factCheck = getFactCheckDisplay(a.ai_fact_check_score || 0);
          return `
            <div class="row" style="cursor:pointer;flex-wrap:wrap;gap:8px;padding:12px;" onclick="viewArticle(${a.id})">
              <span class="article-code">${generateArticleCode(a.id)}</span>
              <span style="flex:1;min-width:200px;">${a.title}</span>
              <span class="tag" style="background:${a.source === '政务通稿' ? '#7c3aed' : '#0ea5e9'};color:#fff;">${a.source}</span>
              <span class="tag" style="background:${a.publish_status === '已发布' ? '#22c55e' : a.publish_status === '草稿' ? '#6b7280' : '#f59e0b'};color:#fff;">${a.publish_status}</span>
              <span class="tag" style="background:${sensitive.includes('无') ? '#dcfce7' : '#fef2f2'};color:${sensitive.includes('无') ? '#16a34a' : '#dc2626'};">${sensitive}</span>
              <span class="tag" style="background:#f0f9ff;color:${factCheck.color};">事实核查 ${factCheck.text}</span>
              <div style="width:100%;margin-top:4px;">
                <div style="display:flex;align-items:center;gap:8px;">
                  <small style="color:#6b7280;">编审进度:</small>
                  <div style="flex:1;background:#e5e7eb;height:6px;border-radius:3px;">
                    <div style="width:${progress}%;height:100%;background:linear-gradient(90deg,#0ea5e9,#22c55e);border-radius:3px;"></div>
                  </div>
                  <small style="color:#6b7280;">${progress}%</small>
                </div>
              </div>
              <small style="width:100%;color:#94a3b8;text-align:right;">${a.created_at}</small>
            </div>
          `;
        }).join('')
      : `<div class="row"><span>暂无稿件</span><strong>可在上方提交记者投稿或政务通稿</strong></div>`;

    $("#articlesList").innerHTML = statsHtml + listHtml;
  } catch (error) {
    console.error('加载稿件失败:', error);
    $("#articlesList").innerHTML = `<div class="row"><span>加载失败</span><strong style="color:#ef4444;">${error.message}</strong></div>`;
  }
}

async function viewArticle(id) {
  try {
    const { data } = await api(`/news/articles?id=${id}`);
    const article = Array.isArray(data) ? data.find(a => a.id === id) : data;
    if (article) {
      $("#articleDetail").innerHTML = renderArticleDetail(article);
      $("#articleDetail").style.display = 'block';
      $("#articleDetail").scrollIntoView({ behavior: 'smooth' });
    }
  } catch (error) {
    console.error('加载稿件详情失败:', error);
  }
}

function getProgressColor(type) {
  const colors = {
    '交通查询': '#3b82f6',
    '文旅预约': '#8b5cf6',
    '12345热线': '#f59e0b',
    '政务办事': '#10b981',
    '服务接入': '#ec4899',
  };
  return colors[type] || '#6b7280';
}

function getProgressPercentage(progress) {
  if (!progress || progress.length === 0) return 0;
  const completed = progress.filter(p => p.status === 'completed').length;
  return Math.round((completed / progress.length) * 100);
}

async function loadCityRecords() {
  const records = JSON.parse(localStorage.getItem('cityRecords') || '[]');
  const total = records.length;
  const processing = records.filter(r => r.progress && r.progress.some(p => p.status === 'active')).length;
  const completed = records.filter(r => r.progress && r.progress.every(p => p.status === 'completed')).length;

  const statsHtml = total > 0 ? `
    <div class="stats" style="margin-bottom:16px;">
      <div><span class="label">办理总数</span><strong>${total}</strong></div>
      <div><span class="label">办理中</span><strong style="color:#f59e0b">${processing}</strong></div>
      <div><span class="label">已完成</span><strong style="color:#22c55e">${completed}</strong></div>
      <div><span class="label">今日新增</span><strong style="color:#3b82f6">${records.filter(r => r.created_at && r.created_at.includes(new Date().toLocaleDateString())).length}</strong></div>
    </div>
  ` : '';

  $("#cityRecords").innerHTML = records.length
    ? statsHtml + records.map((r) => {
        const progressPct = getProgressPercentage(r.progress);
        const color = getProgressColor(r.type);
        return `
          <div class="row" style="flex-wrap:wrap;gap:8px;padding:12px;">
            <span class="tag" style="background:${color};color:#fff;">${r.type}</span>
            ${r.biz_no ? `<span class="article-code" style="background:#f1f5f9;color:#3b82f6;">${r.biz_no}</span>` : ''}
            <span style="flex:1;min-width:150px;">${r.title}</span>
            <span class="tag" style="background:${r.status.includes('成功') || r.status.includes('已完成') ? '#dcfce7' : r.status.includes('待') ? '#fef9c3' : '#dbeafe'};color:${r.status.includes('成功') || r.status.includes('已完成') ? '#16a34a' : r.status.includes('待') ? '#ca8a04' : '#1d4ed8'};">${r.status}</span>
            <small style="color:#64748b;">${r.result}</small>
            ${r.progress ? `
              <div style="width:100%;margin-top:8px;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                  <small style="color:#6b7280;">办理进度:</small>
                  <div style="flex:1;background:#e5e7eb;height:6px;border-radius:3px;">
                    <div style="width:${progressPct}%;height:100%;background:${color};border-radius:3px;"></div>
                  </div>
                  <small style="color:#6b7280;">${progressPct}%</small>
                </div>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                  ${r.progress.map((p, i) => `
                    <span class="tag" style="font-size:11px;background:${p.status === 'completed' ? '#dcfce7' : p.status === 'active' ? '#dbeafe' : '#f3f4f6'};color:${p.status === 'completed' ? '#16a34a' : p.status === 'active' ? '#1d4ed8' : '#6b7280'};">
                      ${p.status === 'completed' ? '✓' : p.status === 'active' ? '⏳' : '○'} ${p.step}
                    </span>
                  `).join('')}
                </div>
              </div>
            ` : ''}
            <small style="width:100%;color:#94a3b8;text-align:right;">${r.created_at}</small>
          </div>
        `;
      }).join('')
    : `<div class="row"><span>暂无办理记录</span><strong>可在上方提交交通查询、文旅预约、政务办事或热线诉求</strong></div>`;
}

async function loadOpinionOverview() {
  try {
    const { stats } = await api('/public/opinions?limit=50');
    const total = stats?.total || 256;
    const positive = stats?.positive || 156;
    const neutral = stats?.neutral || 72;
    const negative = stats?.negative || 28;

    $("#opinionOverviewStats").innerHTML = `
      <div><span class="label">总声量</span><strong>${total}</strong></div>
      <div><span class="label">正面</span><strong style="color:#10b981">${positive}</strong></div>
      <div><span class="label">中性</span><strong style="color:#6b7280">${neutral}</strong></div>
      <div><span class="label">负面</span><strong style="color:#ef4444">${negative}</strong></div>
      <div><span class="label">环比增长</span><strong style="color:#f59e0b">+12.5%</strong></div>
      <div><span class="label">预警事件</span><strong style="color:#ef4444">3</strong></div>
    `;

    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const values = [180, 220, 195, 280, 245, 310, 275];
    const maxVal = Math.max(...values);
    $("#trendChart").innerHTML = `
      <div class="trend-bar">
        ${values.map((v, i) => `
          <div class="trend-bar-item" style="height:${(v / maxVal) * 100}%">
            <span class="bar-value">${v}</span>
            <span class="bar-label">${days[i]}</span>
          </div>
        `).join('')}
      </div>
    `;

    const posPct = Math.round(positive / total * 100);
    const neuPct = Math.round(neutral / total * 100);
    const negPct = 100 - posPct - neuPct;
    $("#sentimentDistribution").innerHTML = `
      <div class="row"><span style="color:#10b981;">正面情感</span><strong>${positive} 条</strong><div style="flex:1;margin:0 12px;background:#e5e7eb;border-radius:4px;height:8px;"><div style="width:${posPct}%;height:100%;background:#10b981;border-radius:4px;"></div></div><small>${posPct}%</small></div>
      <div class="row"><span style="color:#6b7280;">中性情感</span><strong>${neutral} 条</strong><div style="flex:1;margin:0 12px;background:#e5e7eb;border-radius:4px;height:8px;"><div style="width:${neuPct}%;height:100%;background:#6b7280;border-radius:4px;"></div></div><small>${neuPct}%</small></div>
      <div class="row"><span style="color:#ef4444;">负面情感</span><strong>${negative} 条</strong><div style="flex:1;margin:0 12px;background:#e5e7eb;border-radius:4px;height:8px;"><div style="width:${negPct}%;height:100%;background:#ef4444;border-radius:4px;"></div></div><small>${negPct}%</small></div>
    `;

    $("#attributionStats").innerHTML = `
      <div><span class="label">总曝光量</span><strong>128.5万</strong></div>
      <div><span class="label">总互动量</span><strong>25.3万</strong></div>
      <div><span class="label">平均转发链</span><strong>3.2层</strong></div>
      <div><span class="label">核心传播者</span><strong>12人</strong></div>
      <div><span class="label">媒体参与度</span><strong>68%</strong></div>
      <div><span class="label">传播峰值</span><strong>14:30</strong></div>
    `;

    $("#topSpreaders").innerHTML = `
      <div class="row"><span>@广州发布</span><strong>影响力 98</strong><small>转发 1.2万</small></div>
      <div class="row"><span>@广州本地博主</span><strong>影响力 92</strong><small>转发 8,560</small></div>
      <div class="row"><span>@南方日报</span><strong>影响力 88</strong><small>转发 6,230</small></div>
      <div class="row"><span>@羊城晚报</span><strong>影响力 85</strong><small>转发 5,120</small></div>
      <div class="row"><span>@广州交警</span><strong>影响力 82</strong><small>转发 3,890</small></div>
    `;

    $("#contentFeatures").innerHTML = `
      <div class="row"><span>视频内容占比</span><strong style="color:#ef4444">62%</strong><small>高传播力</small></div>
      <div class="row"><span>话题标签</span><strong style="color:#3b82f6">#广州城市服务</strong><small>阅读 89万</small></div>
      <div class="row"><span>发布时段</span><strong style="color:#10b981">14:00-18:00</strong><small>高峰时段</small></div>
      <div class="row"><span>地域分布</span><strong style="color:#8b5cf6">广州占 75%</strong><small>本地为主</small></div>
    `;
  } catch (error) {
    console.error('加载舆情总览失败:', error);
  }
}

async function loadEvents() {
  const mockEvents = [
    { id: 1, title: '广州广电平台上线', status: '监测中', volume: '12,580', sentiment: '正面为主', trend: '上升', created_at: '2026-01-15' },
    { id: 2, title: '天河路交通拥堵', status: '已处理', volume: '8,920', sentiment: '负面', trend: '下降', created_at: '2026-01-14' },
    { id: 3, title: '文旅预约系统故障', status: '预警', volume: '3,450', sentiment: '负面', trend: '上升', created_at: '2026-01-13' },
    { id: 4, title: '12345热线满意度', status: '监测中', volume: '5,680', sentiment: '正面为主', trend: '平稳', created_at: '2026-01-12' },
  ];
  $("#eventList").innerHTML = mockEvents.map((e) => `
    <div class="row" style="cursor:pointer;" onclick="viewEvent(${e.id})">
      <span class="tag" style="background:${e.status === '预警' ? '#ef4444' : e.status === '已处理' ? '#10b981' : '#f59e0b'};color:#fff;">${e.status}</span>
      <span style="flex:1;">${e.title}</span>
      <strong>声量 ${e.volume}</strong>
      <small>${e.sentiment}</small>
      <small>趋势 ${e.trend}</small>
    </div>
  `).join('');
}

async function viewEvent(id) {
  const events = {
    1: {
      title: '广州广电城市服务融合平台上线',
      timeline: [
        { time: '01-15 09:00', title: '平台正式上线', desc: '官方发布公告，首批功能上线' },
        { time: '01-15 10:30', title: '媒体报道', desc: '南方日报、羊城晚报等12家媒体报道' },
        { time: '01-15 12:00', title: '用户讨论高峰', desc: '社交媒体讨论量突破5000条' },
        { time: '01-15 14:30', title: '传播峰值', desc: '总声量达到12,580条' },
      ],
      sentiment: { positive: 72, neutral: 23, negative: 5 },
      channels: { 微博: 4520, 微信: 3280, 抖音: 2850, 小红书: 1930 }
    }
  };
  const event = events[id] || events[1];
  const total = Object.values(event.channels).reduce((a, b) => a + b, 0);
  $("#eventDetail").innerHTML = `
    <button type="button" class="btn-small" onclick="document.getElementById('eventDetail').style.display='none'">← 返回列表</button>
    <h4 style="margin-top:16px;">${event.title}</h4>
    <h4>传播时间线</h4>
    <div class="timeline">
      ${event.timeline.map((t, i) => `
        <div class="timeline-item completed">
          <div class="timeline-time">${t.time}</div>
          <div class="timeline-title">${t.title}</div>
          <div class="timeline-desc">${t.desc}</div>
        </div>
      `).join('')}
    </div>
    <h4>情绪分布</h4>
    <div id="sentimentBar" style="margin:12px 0;">
      <div style="display:flex;height:24px;border-radius:4px;overflow:hidden;">
        <div style="width:${event.sentiment.positive}%;background:#10b981"></div>
        <div style="width:${event.sentiment.neutral}%;background:#6b7280"></div>
        <div style="width:${event.sentiment.negative}%;background:#ef4444"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-top:4px;color:#6b7280;">
        <span>正面 ${event.sentiment.positive}%</span>
        <span>中性 ${event.sentiment.neutral}%</span>
        <span>负面 ${event.sentiment.negative}%</span>
      </div>
    </div>
    <h4>传播渠道分布 (总声量 ${total.toLocaleString()})</h4>
    ${Object.entries(event.channels).map(([channel, count]) => `
      <div class="row">
        <span>${channel}</span>
        <div style="flex:1;margin:0 12px;background:#e5e7eb;border-radius:4px;height:8px;">
          <div style="width:${Math.min(100, count / total * 100)}%;height:100%;background:#3b82f6;border-radius:4px;"></div>
        </div>
        <strong>${count.toLocaleString()}</strong>
      </div>
    `).join('')}
  `;
  $("#eventDetail").style.display = 'block';
  $("#eventDetail").scrollIntoView({ behavior: 'smooth' });
}

async function loadEmergencyList() {
  try {
    const { data } = await api('/emergency/commands?limit=10');
    $("#emergencyList").innerHTML = data.length
      ? data.map((e) => `
          <div class="row" style="${e.status === '待响应' ? 'background:#fef2f2;' : ''}">
            <span class="tag" style="background:${e.level === '一级' ? '#ef4444' : e.level === '二级' ? '#f59e0b' : '#3b82f6'};color:#fff;">${e.level}</span>
            <span style="flex:1;">${e.title}</span>
            <strong>${e.status}</strong>
            <small>${e.created_at || ''}</small>
            ${e.status === '待响应' ? `<button type="button" class="btn-small" data-respond="${e.id}">响应</button>` : ''}
          </div>
        `).join('')
      : `<div class="row"><span>暂无应急指令</span><strong>可在左侧发布测试指令</strong></div>`;
    document.querySelectorAll("[data-respond]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.respond;
        await api(`/emergency/commands/${id}/respond`, {
          method: "POST",
          body: JSON.stringify({ response: "已收到，立即部署处理", responder: "运营值班" })
        });
        await Promise.all([loadEmergencyList(), loadEmergencyTimeline()]);
      });
    });
  } catch (error) {
    console.error('加载应急指令失败:', error);
  }
}

async function loadEmergencyTimeline() {
  const mockTimeline = [
    { time: '2026-01-15 14:30', title: '发布台风预警指令', desc: '应急指挥中心发布一级指令', status: 'completed' },
    { time: '2026-01-15 14:45', title: '响应确认', desc: '全台各部门确认接收指令', status: 'completed' },
    { time: '2026-01-15 15:00', title: '启动应急预案', desc: '新闻采编、技术保障、后勤保障全员到位', status: 'completed' },
    { time: '2026-01-15 15:30', title: '现场报道部署', desc: '6路记者分赴重点区域', status: 'completed' },
    { time: '2026-01-15 16:00', title: '实时直播', desc: '开启24小时滚动直播', status: 'active' },
    { time: '预计 18:00', title: '台风登陆', desc: '预计最大风力12级', status: 'pending' },
  ];
  $("#emergencyTimeline").innerHTML = mockTimeline.map((t) => `
    <div class="timeline-item ${t.status}">
      <div class="timeline-time">${t.time}</div>
      <div class="timeline-title">${t.title}</div>
      <div class="timeline-desc">${t.desc}</div>
    </div>
  `).join('');
}

async function loadEmergencyStats() {
  $("#emergencyStats").innerHTML = `
    <div><span class="label">总指令数</span><strong>28</strong></div>
    <div><span class="label">一级指令</span><strong style="color:#ef4444">3</strong></div>
    <div><span class="label">待响应</span><strong style="color:#f59e0b">2</strong></div>
    <div><span class="label">平均响应时间</span><strong>18分钟</strong></div>
    <div><span class="label">按时完成率</span><strong style="color:#10b981">96.4%</strong></div>
    <div><span class="label">闭环完成率</span><strong style="color:#10b981">100%</strong></div>
  `;
  $("#emergencyAssessment").innerHTML = `
    <div class="row"><span>新闻采访部</span><strong>响应 12次</strong><small>平均 15分钟</small><span style="color:#10b981;">优秀</span></div>
    <div class="row"><span>技术保障部</span><strong>响应 8次</strong><small>平均 22分钟</small><span style="color:#10b981;">良好</span></div>
    <div class="row"><span>编辑中心</span><strong>响应 15次</strong><small>平均 12分钟</small><span style="color:#10b981;">优秀</span></div>
    <div class="row"><span>新媒体中心</span><strong>响应 10次</strong><small>平均 25分钟</small><span style="color:#f59e0b;">需改进</span></div>
  `;
}

async function boot() {
  applyScenarioCopy();
  bindEvents();
  await loadHealth();
  await loadCategories();
  await loadServices();
  await loadProfile();
  await loadAdmin();
  await loadArticles();
  await loadCityRecords();
  await loadOpinionOverview();
  await loadEvents();
  await loadEmergencyList();
  await loadEmergencyTimeline();
  await loadEmergencyStats();
  document.body.dataset.pinaiReady = "true";
}

boot().catch((error) => {
  $("#healthState").textContent = `异常: ${error.message}`;
  showResult({ ok: false, error: error.message, api: API });
});
