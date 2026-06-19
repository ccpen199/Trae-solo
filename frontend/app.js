const API_BASE = `${location.protocol}//${location.hostname}:${parseInt(location.port || 49229) + 10000}`;

const state = {
  currentRole: "applicant",
  currentPage: "dashboard",
  currentUser: null,
  data: {},
};

const roleNavs = {
  applicant: [
    { group: "业务办理" },
    { id: "dashboard", icon: "🏠", label: "工作台" },
    { id: "certificate", icon: "🛂", label: "签注办理" },
    { id: "violation", icon: "🚗", label: "违章查询缴费" },
    { id: "vehicle-exempt", icon: "✅", label: "六年免检" },
    { id: "idcard", icon: "🪪", label: "身份证补换领" },
    { group: "订单中心" },
    { id: "orders", icon: "📋", label: "我的订单" },
    { id: "payments", icon: "💰", label: "缴费记录" },
    { id: "receipt", icon: "📄", label: "电子回执" },
  ],
  courier: [
    { group: "揽收工作" },
    { id: "courier-dashboard", icon: "🏠", label: "揽收工作台" },
    { id: "workorders", icon: "📦", label: "工单列表" },
    { id: "my-workorders", icon: "✅", label: "我的工单" },
    { group: "个人中心" },
    { id: "courier-stats", icon: "📊", label: "揽收统计" },
  ],
  auditor: [
    { group: "审批工作" },
    { id: "auditor-dashboard", icon: "🏠", label: "审批工作台" },
    { id: "certificate-audit", icon: "🛂", label: "签注审批" },
    { id: "idcard-audit", icon: "🪪", label: "身份证审批" },
    { group: "数据统计" },
    { id: "audit-stats", icon: "📊", label: "审批统计" },
  ],
  operator: [
    { group: "运营管理" },
    { id: "operator-dashboard", icon: "🏠", label: "运营工作台" },
    { id: "city-management", icon: "🏙️", label: "地市运营" },
    { id: "escrow-management", icon: "🏦", label: "资金监管" },
    { id: "alert-center", icon: "⚠️", label: "预警中心" },
    { group: "监控审计" },
    { id: "audit-logs", icon: "📝", label: "审计日志" },
    { id: "business-stats", icon: "📈", label: "业务统计" },
  ],
  thirdparty: [
    { group: "第三方服务" },
    { id: "thirdparty-dashboard", icon: "🏠", label: "服务概览" },
    { id: "traffic-122", icon: "🚓", label: "交管12123接口" },
    { id: "violation-api", icon: "📡", label: "违章库接口" },
    { id: "inspection-api", icon: "🔧", label: "年检站接口" },
  ],
};

const roleNames = {
  applicant: "申请人",
  courier: "邮政揽收员",
  auditor: "审批机关",
  operator: "地市运营",
  thirdparty: "第三方服务",
};

function init() {
  document.getElementById("roleSelect").addEventListener("change", (e) => {
    state.currentRole = e.target.value;
    state.currentPage = roleNavs[state.currentRole].find((n) => !n.group)?.id || "dashboard";
    renderNav();
    renderPage();
    renderUserCard();
  });

  renderNav();
  renderPage();
  loadCurrentUser();
}

function backendBaseUrl() {
  return API_BASE;
}

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function loadCurrentUser() {
  try {
    const res = await apiGet("/api/auth/current");
    if (res.ok) {
      state.currentUser = res.user;
      renderUserCard();
    }
  } catch (e) {
    console.error(e);
  }
}

function renderUserCard() {
  const user = state.currentUser || { real_name_masked: "访客", role: state.currentRole, avatar: "👤" };
  const roleLabel = roleNames[user.role || state.currentRole] || "";
  const name = user.real_name_masked || user.real_name || "用户";
  document.getElementById("userCard").innerHTML = `
    <div class="avatar">
      <div class="avatar-icon">${user.avatar || "👤"}</div>
      <div class="user-info">
        <div class="user-name">${name}</div>
        <div class="user-role">${roleLabel}</div>
      </div>
    </div>
  `;
}

function renderNav() {
  const nav = document.getElementById("navMenu");
  const items = roleNavs[state.currentRole] || [];
  let html = "";
  items.forEach((item) => {
    if (item.group) {
      html += `<div class="nav-group-title">${item.group}</div>`;
    } else {
      const active = item.id === state.currentPage ? "active" : "";
      html += `
        <div class="nav-item ${active}" onclick="navigate('${item.id}')">
          <span class="icon">${item.icon}</span>
          <span>${item.label}</span>
        </div>
      `;
    }
  });
  nav.innerHTML = html;
}

function navigate(pageId) {
  state.currentPage = pageId;
  renderNav();
  renderPage();
}

function renderPage() {
  const content = document.getElementById("contentArea");
  const breadcrumb = document.getElementById("breadcrumb");
  const navItems = roleNavs[state.currentRole] || [];
  const current = navItems.find((n) => n.id === state.currentPage);
  breadcrumb.textContent = current ? current.label : "工作台";

  const pageRenderers = {
    dashboard: renderApplicantDashboard,
    certificate: renderCertificatePage,
    violation: renderViolationPage,
    "vehicle-exempt": renderVehicleExemptPage,
    idcard: renderIdcardPage,
    orders: renderOrdersPage,
    payments: renderPaymentsPage,
    receipt: renderReceiptPage,
    "courier-dashboard": renderCourierDashboard,
    workorders: renderWorkordersPage,
    "my-workorders": renderMyWorkordersPage,
    "courier-stats": renderCourierStats,
    "auditor-dashboard": renderAuditorDashboard,
    "certificate-audit": renderCertificateAuditPage,
    "idcard-audit": renderIdcardAuditPage,
    "audit-stats": renderAuditStatsPage,
    "operator-dashboard": renderOperatorDashboard,
    "city-management": renderCityManagementPage,
    "escrow-management": renderEscrowManagementPage,
    "alert-center": renderAlertCenterPage,
    "audit-logs": renderAuditLogsPage,
    "business-stats": renderBusinessStatsPage,
    "thirdparty-dashboard": renderThirdpartyDashboard,
    "traffic-122": renderTraffic122Page,
    "violation-api": renderViolationApiPage,
    "inspection-api": renderInspectionApiPage,
  };

  const renderer = pageRenderers[state.currentPage] || renderApplicantDashboard;
  content.innerHTML = `<div class="empty-state"><div class="icon">⏳</div><p>加载中...</p></div>`;
  setTimeout(() => renderer(content), 50);
}

function renderApplicantDashboard(container) {
  container.innerHTML = `
    <div class="page-header">
      <h2>欢迎回来，${state.currentUser?.real_name_masked || "用户"}</h2>
      <p>办理广东政务便民服务，足不出户，证件到家</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">进行中订单</div>
        <div class="stat-value" id="stat-active">--</div>
        <div class="stat-trend">实时更新</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">已完成订单</div>
        <div class="stat-value" id="stat-completed">--</div>
        <div class="stat-trend">累计办理</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">待支付</div>
        <div class="stat-value" id="stat-pending-pay">--</div>
        <div class="stat-trend warning">待处理</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">超期预警</div>
        <div class="stat-value" id="stat-overdue">--</div>
        <div class="stat-trend danger">需关注</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>快捷办理</h3>
      </div>
      <div class="card-body">
        <div class="quick-entries">
          <div class="quick-entry" onclick="navigate('certificate')">
            <div class="entry-icon">🛂</div>
            <h4>港澳/赴台签注</h4>
            <p>上门收件 · 全程线上</p>
          </div>
          <div class="quick-entry" onclick="navigate('violation')">
            <div class="entry-icon">🚗</div>
            <h4>违章查询缴费</h4>
            <p>全国400+城市</p>
          </div>
          <div class="quick-entry" onclick="navigate('vehicle-exempt')">
            <div class="entry-icon">✅</div>
            <h4>六年免检</h4>
            <p>上门取件 · 寄达标志</p>
          </div>
          <div class="quick-entry" onclick="navigate('idcard')">
            <div class="entry-icon">🪪</div>
            <h4>身份证补换领</h4>
            <p>预填邮寄信息</p>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>最近订单</h3>
        <button class="btn btn-outline btn-sm" onclick="navigate('orders')">查看全部</button>
      </div>
      <div class="card-body" id="recentOrders">
        <div class="empty-state"><div class="icon">📋</div><p>加载中...</p></div>
      </div>
    </div>
  `;

  loadApplicantDashboardData();
}

async function loadApplicantDashboardData() {
  try {
    const [certRes, vehRes, idcRes, payRes] = await Promise.all([
      apiGet("/api/certificate/orders?page_size=20"),
      apiGet("/api/vehicle/orders?page_size=20"),
      apiGet("/api/idcard/orders?page_size=20"),
      apiGet("/api/payments?user_id=1&page_size=20"),
    ]);

    const allOrders = [
      ...(certRes.items || []).map((o) => ({ ...o, type: "certificate", typeName: "签注办理" })),
      ...(vehRes.items || []).map((o) => ({ ...o, type: "vehicle", typeName: "车管业务" })),
      ...(idcRes.items || []).map((o) => ({ ...o, type: "idcard", typeName: "身份证" })),
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const activeCount = allOrders.filter((o) => !["completed", "cancelled"].includes(o.status)).length;
    const completedCount = allOrders.filter((o) => o.status === "completed").length;
    const pendingPayCount = (payRes.items || []).filter((p) => p.status !== "success").length;

    const overdueCert = (certRes.items || []).filter((o) => o.overdue && o.status !== "completed").length;

    document.getElementById("stat-active").textContent = activeCount;
    document.getElementById("stat-completed").textContent = completedCount;
    document.getElementById("stat-pending-pay").textContent = pendingPayCount;
    document.getElementById("stat-overdue").textContent = overdueCert;

    const recentEl = document.getElementById("recentOrders");
    if (allOrders.length === 0) {
      recentEl.innerHTML = `<div class="empty-state"><div class="icon">📭</div><p>暂无订单记录</p></div>`;
    } else {
      const recent = allOrders.slice(0, 5);
      recentEl.innerHTML = `
        <table class="table">
          <thead>
            <tr><th>订单编号</th><th>业务类型</th><th>状态</th><th>创建时间</th><th>操作</th></tr>
          </thead>
          <tbody>
            ${recent
              .map(
                (o) => `
              <tr>
                <td>${o.order_no}</td>
                <td>${o.typeName}</td>
                <td>${getStatusBadge(o.status)}</td>
                <td>${formatDate(o.created_at)}</td>
                <td><button class="btn btn-outline btn-sm" onclick="viewOrderDetail('${o.type}','${o.order_no}')">详情</button></td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      `;
    }
  } catch (e) {
    console.error(e);
  }
}

function getStatusBadge(status) {
  const statusMap = {
    created: ["待处理", "badge-default"],
    pickup_scheduled: ["待揽收", "badge-info"],
    materials_received: ["材料已收", "badge-primary"],
    pre_auditing: ["预审中", "badge-warning"],
    pre_audit_passed: ["预审通过", "badge-success"],
    auditing: ["审批中", "badge-warning"],
    approved: ["已审批", "badge-success"],
    rejected: ["已驳回", "badge-danger"],
    mailing: ["寄送中", "badge-info"],
    completed: ["已完成", "badge-success"],
    pending: ["待处理", "badge-default"],
    accepted: ["已接单", "badge-primary"],
    on_the_way: ["途中", "badge-info"],
    picked_up: ["已取件", "badge-success"],
    inspecting: ["检测中", "badge-warning"],
    qualified: ["检测合格", "badge-success"],
    police_auditing: ["公安审核中", "badge-warning"],
    success: ["支付成功", "badge-success"],
  };
  const [label, cls] = statusMap[status] || [status, "badge-default"];
  return `<span class="badge ${cls}">${label}</span>`;
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatMoney(n) {
  return "¥" + Number(n || 0).toFixed(2);
}

function openModal(title, content) {
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalBody").innerHTML = content;
  document.getElementById("modal").style.display = "flex";
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}

function viewOrderDetail(type, orderNo) {
  const typeNames = { certificate: "签注订单详情", vehicle: "车管订单详情", idcard: "身份证订单详情" };
  openModal(typeNames[type] || "订单详情", `<div class="empty-state"><div class="icon">⏳</div><p>加载中...</p></div>`);
  loadOrderDetail(type, orderNo);
}

async function loadOrderDetail(type, orderNo) {
  try {
    let api = "";
    if (type === "certificate") api = `/api/certificate/orders?page_size=1`;
    else if (type === "vehicle") api = `/api/vehicle/orders?page_size=1`;
    else if (type === "idcard") api = `/api/idcard/orders?page_size=1`;

    const res = await apiGet(api);
    const items = res.items || [];
    const order = items.find((o) => o.order_no === orderNo) || items[0];

    if (!order) {
      document.getElementById("modalBody").innerHTML =
        `<div class="empty-state"><div class="icon">❓</div><p>订单不存在</p></div>`;
      return;
    }

    const logRes = await apiGet(`/api/logistics?order_no=${orderNo}`);
    const logistics = logRes.items || [];

    let infoHtml = "";
    if (type === "certificate") {
      infoHtml = `
        <div class="form-row">
          <div class="form-group"><label>业务类型</label><div>${order.business_type === "hk_macao_endorse" ? "港澳签注" : "赴台签注"}</div></div>
          <div class="form-group"><label>证件类型</label><div>${order.permit_type === "g-card" ? "卡式" : "本式"}</div></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>申请人</label><div>${order.real_name_masked || order.real_name}</div></div>
          <div class="form-group"><label>身份证号</label><div>${order.id_card_masked || order.id_card}</div></div>
        </div>
        <div class="form-group"><label>联系电话</label><div>${order.phone_masked || order.phone}</div></div>
        <div class="form-group"><label>收件地址</label><div>${order.address || "-"}</div></div>
        <div class="form-row">
          <div class="form-group"><label>预审状态</label><div>${order.pre_audit_status === "passed" ? "通过" : order.pre_audit_status === "rejected" ? "不通过" : "待预审"}</div></div>
          <div class="form-group"><label>快递单号</label><div>${order.express_no || "-"}</div></div>
        </div>
      `;
    } else if (type === "vehicle") {
      infoHtml = `
        <div class="form-row">
          <div class="form-group"><label>业务类型</label><div>${order.business_type === "six_year_exempt" ? "六年免检" : "车管业务"}</div></div>
          <div class="form-group"><label>车牌号码</label><div>${order.plate_no_masked || order.plate_no}</div></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>车辆品牌</label><div>${order.vehicle_brand || "-"}</div></div>
          <div class="form-group"><label>检测站</label><div>${order.inspection_station || "-"}</div></div>
        </div>
        <div class="form-group"><label>检测结果</label><div>${order.qualified_flag || "-"}</div></div>
        <div class="form-group"><label>联系电话</label><div>${order.phone_masked || order.phone}</div></div>
      `;
    } else {
      infoHtml = `
        <div class="form-row">
          <div class="form-group"><label>业务类型</label><div>${order.business_type === "reissue" ? "补办" : "换领"}</div></div>
          <div class="form-group"><label>身份证号</label><div>${order.id_card_masked || order.id_card}</div></div>
        </div>
        <div class="form-group"><label>申请人</label><div>${order.real_name_masked || order.real_name}</div></div>
        <div class="form-group"><label>申请原因</label><div>${order.reason || "-"}</div></div>
        <div class="form-group"><label>邮寄地址</label><div>${order.mailing_address || "-"}</div></div>
        <div class="form-group"><label>公安核验</label><div>${order.police_verified ? "已核验" : "待核验"}</div></div>
      `;
    }

    const timelineHtml = logistics.length
      ? `
        <div class="status-timeline">
          ${logistics
            .map(
              (l, i) => `
            <div class="timeline-item ${i === 0 ? "active" : "done"}">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <h5>${l.status}</h5>
                <p>${l.description || ""}</p>
                <div class="time">${formatDate(l.created_at)} · ${l.operator || ""}</div>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      `
      : `<div class="empty-state"><div class="icon">📦</div><p>暂无物流信息</p></div>`;

    document.getElementById("modalBody").innerHTML = `
      <div class="mask-info">🔒 敏感字段已加密存储，展示已脱敏</div>
      ${infoHtml}
      <div class="card" style="margin-top: 16px;">
        <div class="card-header"><h3>物流轨迹</h3></div>
        <div class="card-body">${timelineHtml}</div>
      </div>
    `;
  } catch (e) {
    console.error(e);
    document.getElementById("modalBody").innerHTML =
      `<div class="empty-state"><div class="icon">❌</div><p>加载失败</p></div>`;
  }
}
