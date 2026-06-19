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

function renderCertificatePage(container) {
  container.innerHTML = `
    <div class="page-header">
      <h2>港澳/赴台签注办理</h2>
      <p>上门收件 · OCR识别 · 预审提示 · EMS寄送 · 电子回执</p>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>办理流程</h3>
      </div>
      <div class="card-body">
        <div class="status-timeline" style="flex-direction:row; flex-wrap:wrap; gap:10px;">
          ${[
            "选择业务类型",
            "填写信息",
            "预约上门",
            "材料OCR识别",
            "预审提示",
            "支付费用",
            "EMS寄送",
            "电子回执",
          ]
            .map(
              (s, i) => `
            <div class="timeline-item" style="padding:8px 12px; background:#f8fafc; border-radius:6px;">
              <div class="timeline-dot" style="margin-top:4px;"></div>
              <div class="timeline-content"><h5>${i + 1}. ${s}</h5></div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>立即办理</h3>
      </div>
      <div class="card-body">
        <div class="mask-info">🔒 敏感字段将加密存储，展示时自动脱敏</div>

        <div class="form-row">
          <div class="form-group">
            <label>业务类型<span class="required">*</span></label>
            <select id="certType">
              <option value="hk_macao_endorse">港澳签注</option>
              <option value="taiwan_endorse">赴台签注</option>
            </select>
          </div>
          <div class="form-group">
            <label>证件类型<span class="required">*</span></label>
            <select id="permitType">
              <option value="g-card">卡式往来港澳通行证</option>
              <option value="b-card">本式往来港澳通行证</option>
              <option value="t-card">卡式往来台湾通行证</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>姓名<span class="required">*</span></label>
            <input type="text" id="realName" placeholder="请输入真实姓名" />
          </div>
          <div class="form-group">
            <label>身份证号<span class="required">*</span></label>
            <input type="text" id="idCard" placeholder="请输入身份证号码" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>联系电话<span class="required">*</span></label>
            <input type="tel" id="phone" placeholder="请输入手机号码" />
          </div>
          <div class="form-group">
            <label>所在城市<span class="required">*</span></label>
            <select id="cityCode">
              <option value="440100">广州市</option>
              <option value="440300">深圳市</option>
              <option value="440600">佛山市</option>
              <option value="441900">东莞市</option>
              <option value="440400">珠海市</option>
              <option value="440500">汕头市</option>
              <option value="441300">惠州市</option>
              <option value="440200">韶关市</option>
              <option value="440700">江门市</option>
              <option value="440800">湛江市</option>
              <option value="440900">茂名市</option>
              <option value="441200">肇庆市</option>
              <option value="441400">梅州市</option>
              <option value="441500">汕尾市</option>
              <option value="441600">河源市</option>
              <option value="441700">阳江市</option>
              <option value="441800">清远市</option>
              <option value="442000">中山市</option>
              <option value="445100">潮州市</option>
              <option value="445200">揭阳市</option>
              <option value="445300">云浮市</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>上门收件地址<span class="required">*</span></label>
          <input type="text" id="address" placeholder="请输入详细收件地址" />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>预约上门时间<span class="required">*</span></label>
            <input type="datetime-local" id="pickupTime" />
          </div>
          <div class="form-group">
            <label>支付方式<span class="required">*</span></label>
            <select id="payMethod">
              <option value="wechat">微信支付</option>
              <option value="alipay">支付宝</option>
              <option value="unionpay">银联支付</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>需要携带的材料</label>
          <div style="display:flex; flex-wrap:wrap; gap:10px;">
            ${["身份证原件", "往来港澳通行证", "电子照片回执", "户口本复印件"]
              .map(
                (m, i) => `
              <label style="display:flex; align-items:center; gap:6px; padding:8px 12px; background:#f8fafc; border-radius:6px; cursor:pointer;">
                <input type="checkbox" ${i < 2 ? "checked" : ""} class="material-check" value="${m}" />
                ${m}
              </label>
            `
              )
              .join("")}
          </div>
        </div>

        <div style="margin-top:20px; padding:16px; background:#eff6ff; border-radius:8px;">
          <div style="font-weight:600; color:var(--primary); margin-bottom:8px;">💰 费用明细</div>
          <div style="display:flex; justify-content:space-between; font-size:14px;">
            <span>签注服务费</span><span>¥100.00</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:14px; margin-top:4px;">
            <span>EMS上门取件费</span><span>¥18.00</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:14px; margin-top:4px;">
            <span>寄回证件费用</span><span>¥2.00</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:16px; font-weight:700; margin-top:10px; padding-top:10px; border-top:1px solid var(--line);">
            <span>合计</span><span style="color:var(--danger);">¥120.00</span>
          </div>
        </div>

        <div style="margin-top:20px; display:flex; gap:12px;">
          <button class="btn btn-primary" onclick="submitCertificateOrder()">📤 提交申请并预约</button>
          <button class="btn btn-outline" onclick="navigate('orders')">查看我的订单</button>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>我的签注订单</h3>
      </div>
      <div class="card-body" id="certOrdersList">
        <div class="empty-state"><div class="icon">⏳</div><p>加载中...</p></div>
      </div>
    </div>
  `;
  loadCertificateOrders();
}

async function loadCertificateOrders() {
  try {
    const res = await apiGet("/api/certificate/orders?page_size=10");
    const items = res.items || [];
    const el = document.getElementById("certOrdersList");

    if (items.length === 0) {
      el.innerHTML = `<div class="empty-state"><div class="icon">📭</div><p>暂无签注订单</p></div>`;
      return;
    }

    el.innerHTML = `
      <table class="table">
        <thead>
          <tr><th>订单编号</th><th>业务类型</th><th>申请人</th><th>状态</th><th>超期预警</th><th>创建时间</th><th>操作</th></tr>
        </thead>
        <tbody>
          ${items
            .map(
              (o) => `
            <tr>
              <td>${o.order_no}</td>
              <td>${o.business_type === "hk_macao_endorse" ? "港澳签注" : "赴台签注"}</td>
              <td>${o.real_name_masked || o.real_name}</td>
              <td>${getStatusBadge(o.status)}</td>
              <td>${o.overdue ? '<span class="badge badge-danger">已超期</span>' : '<span class="badge badge-success">正常</span>'}</td>
              <td>${formatDate(o.created_at)}</td>
              <td><button class="btn btn-outline btn-sm" onclick="viewOrderDetail('certificate','${o.order_no}')">详情</button></td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;
  } catch (e) {
    console.error(e);
  }
}

async function submitCertificateOrder() {
  const materials = Array.from(document.querySelectorAll(".material-check:checked")).map((c) => c.value);
  const body = {
    user_id: 1,
    business_type: document.getElementById("certType").value,
    permit_type: document.getElementById("permitType").value,
    real_name: document.getElementById("realName").value,
    id_card: document.getElementById("idCard").value,
    phone: document.getElementById("phone").value,
    city_code: document.getElementById("cityCode").value,
    address: document.getElementById("address").value,
    pickup_time: document.getElementById("pickupTime").value,
    pay_method: document.getElementById("payMethod").value,
    materials,
  };

  if (!body.real_name || !body.id_card || !body.phone || !body.address) {
    openModal("提示", `<p>请填写完整的申请信息</p>`);
    return;
  }

  try {
    const res = await apiPost("/api/certificate/create", body);
    if (res.ok) {
      openModal(
        "提交成功",
        `
          <div style="text-align:center; padding:20px 0;">
            <div style="font-size:48px; margin-bottom:12px;">🎉</div>
            <h4 style="margin-bottom:8px;">申请已提交</h4>
            <p style="color:var(--ink-light); margin-bottom:16px;">订单编号：${res.order.order_no}</p>
            <p style="color:var(--muted); font-size:12px;">揽收员将按预约时间上门收件，请保持电话畅通</p>
            <div style="margin-top:20px; display:flex; gap:10px; justify-content:center;">
              <button class="btn btn-primary" onclick="closeModal(); navigate('orders');">查看订单</button>
              <button class="btn btn-outline" onclick="closeModal();">继续办理</button>
            </div>
          </div>
        `
      );
      loadCertificateOrders();
      loadApplicantDashboardData();
    } else {
      openModal("提交失败", `<p>${res.error || "请稍后重试"}</p>`);
    }
  } catch (e) {
    console.error(e);
    openModal("提交失败", `<p>网络错误，请稍后重试</p>`);
  }
}

function renderViolationPage(container) {
  container.innerHTML = `
    <div class="page-header">
      <h2>违章查询与在线缴费</h2>
      <p>全国400+城市违章查询 · 银联/微信/支付宝直连 · 资金监管账户隔离</p>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>查询车辆</h3>
      </div>
      <div class="card-body">
        <div class="mask-info">🔒 车辆信息加密存储，展示时自动脱敏</div>
        <div class="form-row">
          <div class="form-group">
            <label>车牌号码<span class="required">*</span></label>
            <input type="text" id="plateNo" placeholder="例：粤A12345" />
          </div>
          <div class="form-group">
            <label>号牌类型<span class="required">*</span></label>
            <select id="plateType">
              <option>小型汽车</option>
              <option>大型汽车</option>
              <option>摩托车</option>
              <option>新能源汽车</option>
            </select>
          </div>
        </div>
        <div style="display:flex; gap:10px;">
          <button class="btn btn-primary" onclick="queryViolations()">🔍 查询违章</button>
          <button class="btn btn-outline" onclick="loadAllViolations()">📋 查看全部</button>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>待缴费违章</h3>
        <div>
          <span class="badge badge-warning" id="unpaidCount">-- 条</span>
          <span style="margin-left:8px; font-weight:600; color:var(--danger);" id="unpaidAmount">¥ 0.00</span>
        </div>
      </div>
      <div class="card-body" id="unpaidViolations">
        <div class="empty-state"><div class="icon">⏳</div><p>加载中...</p></div>
      </div>
      <div style="padding:0 18px 18px;">
        <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; background:#fffbeb; border-radius:6px;">
          <div>
            <span style="font-weight:600;">批量缴费：</span>
            <span id="batchInfo">请选择违章记录</span>
          </div>
          <button class="btn btn-primary" onclick="paySelectedViolations()">💰 去缴费</button>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>已缴费违章</h3>
      </div>
      <div class="card-body" id="paidViolations">
        <div class="empty-state"><div class="icon">⏳</div><p>加载中...</p></div>
      </div>
    </div>
  `;
  loadAllViolations();
}

async function loadAllViolations() {
  try {
    const unpaidRes = await apiGet("/api/vehicle/violations?paid=0");
    const paidRes = await apiGet("/api/vehicle/violations?paid=1");

    const unpaidItems = unpaidRes.items || [];
    const paidItems = paidRes.items || [];

    document.getElementById("unpaidCount").textContent = `${unpaidItems.length} 条`;
    document.getElementById("unpaidAmount").textContent = `¥ ${(unpaidRes.total_fine || 0).toFixed(2)}`;

    const unpaidEl = document.getElementById("unpaidViolations");
    if (unpaidItems.length === 0) {
      unpaidEl.innerHTML = `<div class="empty-state"><div class="icon">✅</div><p>暂无待缴费违章记录</p></div>`;
    } else {
      unpaidEl.innerHTML = `
        <table class="table">
          <thead>
            <tr>
              <th style="width:40px;"><input type="checkbox" id="checkAll" onchange="toggleCheckAll(this)" /></th>
              <th>车牌</th><th>违章时间</th><th>违章地点</th><th>违章行为</th><th>罚款</th><th>扣分</th><th>缴费城市</th>
            </tr>
          </thead>
          <tbody>
            ${unpaidItems
              .map(
                (v) => `
              <tr>
                <td><input type="checkbox" class="vio-check" value="${v.id}" data-amount="${v.fine_amount}" onchange="updateBatchInfo()" /></td>
                <td>${v.plate_no_masked || v.plate_no}</td>
                <td>${formatDate(v.violation_time)}</td>
                <td>${v.violation_location}</td>
                <td>${v.violation_desc}</td>
                <td style="color:var(--danger); font-weight:600;">¥${v.fine_amount}</td>
                <td>${v.deduct_points} 分</td>
                <td>${v.city}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      `;
    }

    const paidEl = document.getElementById("paidViolations");
    if (paidItems.length === 0) {
      paidEl.innerHTML = `<div class="empty-state"><div class="icon">📭</div><p>暂无已缴费记录</p></div>`;
    } else {
      paidEl.innerHTML = `
        <table class="table">
          <thead>
            <tr><th>车牌</th><th>违章时间</th><th>违章地点</th><th>违章行为</th><th>罚款</th><th>扣分</th><th>状态</th></tr>
          </thead>
          <tbody>
            ${paidItems
              .map(
                (v) => `
              <tr>
                <td>${v.plate_no_masked || v.plate_no}</td>
                <td>${formatDate(v.violation_time)}</td>
                <td>${v.violation_location}</td>
                <td>${v.violation_desc}</td>
                <td>¥${v.fine_amount}</td>
                <td>${v.deduct_points} 分</td>
                <td><span class="badge badge-success">已缴费</span></td>
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

async function queryViolations() {
  const plate = document.getElementById("plateNo").value;
  if (!plate) {
    openModal("提示", "<p>请输入车牌号码</p>");
    return;
  }
  loadAllViolations();
}

function toggleCheckAll(el) {
  document.querySelectorAll(".vio-check").forEach((c) => (c.checked = el.checked));
  updateBatchInfo();
}

function updateBatchInfo() {
  const checked = Array.from(document.querySelectorAll(".vio-check:checked"));
  const total = checked.reduce((sum, c) => sum + parseFloat(c.dataset.amount || 0), 0);
  document.getElementById("batchInfo").textContent =
    checked.length > 0 ? `已选择 ${checked.length} 条，合计 ¥${total.toFixed(2)}` : "请选择违章记录";
}

async function paySelectedViolations() {
  const checked = Array.from(document.querySelectorAll(".vio-check:checked"));
  if (checked.length === 0) {
    openModal("提示", "<p>请先选择要缴费的违章记录</p>");
    return;
  }

  const ids = checked.map((c) => parseInt(c.value));
  const total = checked.reduce((sum, c) => sum + parseFloat(c.dataset.amount || 0), 0);

  openModal(
    "确认缴费",
    `
      <div style="padding:10px 0;">
        <div class="form-group">
          <label>缴费方式<span class="required">*</span></label>
          <select id="payMethodVio">
            <option value="wechat">微信支付</option>
            <option value="alipay">支付宝</option>
            <option value="unionpay">银联支付</option>
          </select>
        </div>
        <div style="margin-top:16px; padding:16px; background:#fef3c7; border-radius:8px;">
          <div style="font-weight:600; margin-bottom:8px;">缴费信息</div>
          <div style="font-size:13px; color:var(--ink-light);">
            <div style="display:flex; justify-content:space-between;">
              <span>违章条数</span><span>${ids.length} 条</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin-top:4px;">
              <span>罚款合计</span><span style="font-weight:700; color:var(--danger); font-size:18px;">¥${total.toFixed(2)}</span>
            </div>
            <div style="margin-top:10px; padding-top:10px; border-top:1px dashed var(--line); font-size:12px; color:var(--muted);">
              💰 资金将进入监管账户，处理完成后结算至财政账户
            </div>
          </div>
        </div>
        <div style="margin-top:20px; display:flex; gap:10px; justify-content:flex-end;">
          <button class="btn btn-outline" onclick="closeModal()">取消</button>
          <button class="btn btn-primary" onclick="confirmPayViolation([${ids.join(",")}], ${total.toFixed(2)})">确认支付</button>
        </div>
      </div>
    `
  );
}

async function confirmPayViolation(ids, amount) {
  try {
    const payMethod = document.getElementById("payMethodVio")?.value || "wechat";
    const res = await apiPost("/api/vehicle/pay-violation", { violation_ids: ids, pay_method: payMethod, user_id: 1 });
    if (res.ok) {
      closeModal();
      openModal(
        "缴费成功",
        `
          <div style="text-align:center; padding:20px 0;">
            <div style="font-size:48px; margin-bottom:12px;">✅</div>
            <h4 style="margin-bottom:8px;">缴费成功</h4>
            <p style="color:var(--ink-light);">已处理 ${res.paid_count} 条违章，合计 ¥${res.total_amount.toFixed(2)}</p>
            <div style="margin-top:16px;">
              <button class="btn btn-primary" onclick="closeModal(); loadAllViolations();">完成</button>
            </div>
          </div>
        `
      );
    }
  } catch (e) {
    console.error(e);
  }
}

function renderVehicleExemptPage(container) {
  container.innerHTML = `
    <div class="page-header">
      <h2>六年免检上门取件</h2>
      <p>上门取件 · 检测站对接 · 合格标志寄达 · 全流程时效预警</p>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>申请六年免检</h3>
      </div>
      <div class="card-body">
        <div class="mask-info">🔒 车辆信息加密存储，展示时自动脱敏</div>

        <div class="form-row">
          <div class="form-group">
            <label>车牌号码<span class="required">*</span></label>
            <input type="text" id="exemptPlate" placeholder="例：粤A12345" />
          </div>
          <div class="form-group">
            <label>号牌类型<span class="required">*</span></label>
            <select id="exemptType">
              <option>小型汽车</option>
              <option>大型汽车</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>车辆品牌</label>
            <input type="text" id="exemptBrand" placeholder="例：丰田" />
          </div>
          <div class="form-group">
            <label>所在城市<span class="required">*</span></label>
            <select id="exemptCity">
              <option value="440100">广州市</option>
              <option value="440300">深圳市</option>
              <option value="440600">佛山市</option>
              <option value="441900">东莞市</option>
              <option value="440400">珠海市</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>车主姓名<span class="required">*</span></label>
            <input type="text" id="exemptName" placeholder="请输入车主姓名" />
          </div>
          <div class="form-group">
            <label>联系电话<span class="required">*</span></label>
            <input type="tel" id="exemptPhone" placeholder="请输入手机号码" />
          </div>
        </div>

        <div class="form-group">
          <label>取件地址<span class="required">*</span></label>
          <input type="text" id="exemptAddress" placeholder="请输入详细取件地址" />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>预约取件时间<span class="required">*</span></label>
            <input type="datetime-local" id="exemptTime" />
          </div>
          <div class="form-group">
            <label>检测站</label>
            <select id="exemptStation">
              <option>广州市天河区机动车检测站</option>
              <option>广州市越秀区机动车检测站</option>
              <option>深圳市南山区机动车检测站</option>
            </select>
          </div>
        </div>

        <div style="margin-top:20px; padding:16px; background:#eff6ff; border-radius:8px;">
          <div style="font-weight:600; color:var(--primary); margin-bottom:8px;">💰 费用明细</div>
          <div style="display:flex; justify-content:space-between; font-size:14px;">
            <span>检测服务费</span><span>¥120.00</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:14px; margin-top:4px;">
            <span>EMS上门取件费</span><span>¥18.00</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:14px; margin-top:4px;">
            <span>合格标志寄回费</span><span>¥12.00</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:16px; font-weight:700; margin-top:10px; padding-top:10px; border-top:1px solid var(--line);">
            <span>合计</span><span style="color:var(--danger);">¥150.00</span>
          </div>
        </div>

        <div style="margin-top:20px; display:flex; gap:12px;">
          <button class="btn btn-primary" onclick="submitVehicleExempt()">📤 提交申请</button>
          <button class="btn btn-outline" onclick="navigate('orders')">查看我的订单</button>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>我的免检订单</h3>
      </div>
      <div class="card-body" id="exemptOrders">
        <div class="empty-state"><div class="icon">⏳</div><p>加载中...</p></div>
      </div>
    </div>
  `;
  loadVehicleExemptOrders();
}

async function loadVehicleExemptOrders() {
  try {
    const res = await apiGet("/api/vehicle/orders?page_size=10");
    const items = res.items || [];
    const el = document.getElementById("exemptOrders");

    if (items.length === 0) {
      el.innerHTML = `<div class="empty-state"><div class="icon">📭</div><p>暂无免检订单</p></div>`;
      return;
    }

    el.innerHTML = `
      <table class="table">
        <thead>
          <tr><th>订单编号</th><th>车牌号</th><th>车辆品牌</th><th>检测站</th><th>状态</th><th>超期预警</th><th>创建时间</th><th>操作</th></tr>
        </thead>
        <tbody>
          ${items
            .map(
              (o) => `
            <tr>
              <td>${o.order_no}</td>
              <td>${o.plate_no_masked || o.plate_no}</td>
              <td>${o.vehicle_brand || "-"}</td>
              <td>${o.inspection_station || "-"}</td>
              <td>${getStatusBadge(o.status)}</td>
              <td>${o.overdue ? '<span class="badge badge-danger">已超期</span>' : '<span class="badge badge-success">正常</span>'}</td>
              <td>${formatDate(o.created_at)}</td>
              <td><button class="btn btn-outline btn-sm" onclick="viewOrderDetail('vehicle','${o.order_no}')">详情</button></td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;
  } catch (e) {
    console.error(e);
  }
}

async function submitVehicleExempt() {
  const body = {
    user_id: 1,
    plate_no: document.getElementById("exemptPlate").value,
    plate_type: document.getElementById("exemptType").value,
    vehicle_brand: document.getElementById("exemptBrand").value,
    real_name: document.getElementById("exemptName").value,
    phone: document.getElementById("exemptPhone").value,
    city_code: document.getElementById("exemptCity").value,
    address: document.getElementById("exemptAddress").value,
    pickup_time: document.getElementById("exemptTime").value,
    inspection_station: document.getElementById("exemptStation").value,
  };

  if (!body.plate_no || !body.real_name || !body.phone || !body.address) {
    openModal("提示", "<p>请填写完整的申请信息</p>");
    return;
  }

  try {
    const res = await apiPost("/api/vehicle/create-exempt", body);
    if (res.ok) {
      openModal(
        "提交成功",
        `
          <div style="text-align:center; padding:20px 0;">
            <div style="font-size:48px; margin-bottom:12px;">🎉</div>
            <h4 style="margin-bottom:8px;">申请已提交</h4>
            <p style="color:var(--ink-light); margin-bottom:16px;">订单编号：${res.order.order_no}</p>
            <p style="color:var(--muted); font-size:12px;">揽收员将按预约时间上门取件</p>
            <div style="margin-top:20px;">
              <button class="btn btn-primary" onclick="closeModal(); loadVehicleExemptOrders();">确定</button>
            </div>
          </div>
        `
      );
    }
  } catch (e) {
    console.error(e);
  }
}

function renderIdcardPage(container) {
  container.innerHTML = `
    <div class="page-header">
      <h2>身份证补换领</h2>
      <p>预填邮寄信息 · 同步公安人口库 · 全流程时效预警</p>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>申请身份证补换领</h3>
      </div>
      <div class="card-body">
        <div class="mask-info">🔒 身份证信息加密存储，展示时自动脱敏</div>

        <div class="form-row">
          <div class="form-group">
            <label>业务类型<span class="required">*</span></label>
            <select id="idcType">
              <option value="reissue">证件丢失补办</option>
              <option value="renew">证件到期换领</option>
              <option value="damage">证件损坏换领</option>
            </select>
          </div>
          <div class="form-group">
            <label>所在城市<span class="required">*</span></label>
            <select id="idcCity">
              <option value="440100">广州市</option>
              <option value="440300">深圳市</option>
              <option value="440600">佛山市</option>
              <option value="441900">东莞市</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>姓名<span class="required">*</span></label>
            <input type="text" id="idcName" placeholder="请输入真实姓名" />
          </div>
          <div class="form-group">
            <label>身份证号<span class="required">*</span></label>
            <input type="text" id="idcCard" placeholder="请输入身份证号码" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>联系电话<span class="required">*</span></label>
            <input type="tel" id="idcPhone" placeholder="请输入手机号码" />
          </div>
          <div class="form-group">
            <label>原身份证号</label>
            <input type="text" id="idcOld" placeholder="（如有）请输入原身份证号" />
          </div>
        </div>

        <div class="form-group">
          <label>申请原因<span class="required">*</span></label>
          <textarea id="idcReason" rows="3" placeholder="请简要说明申请原因"></textarea>
        </div>

        <div class="form-group">
          <label>邮寄地址<span class="required">*</span></label>
          <input type="text" id="idcAddress" placeholder="请输入新证件的邮寄地址" />
        </div>

        <div style="margin-top:16px; padding:12px; background:#ecfdf5; border-radius:6px; font-size:12px; color:var(--success);">
          📍 邮寄信息将同步至公安人口库，确保新证件准确寄达
        </div>

        <div style="margin-top:20px; padding:16px; background:#eff6ff; border-radius:8px;">
          <div style="font-weight:600; color:var(--primary); margin-bottom:8px;">💰 费用明细</div>
          <div style="display:flex; justify-content:space-between; font-size:14px;">
            <span>证件工本费</span><span>¥40.00</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:14px; margin-top:4px;">
            <span>EMS寄递费</span><span>¥18.00</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:16px; font-weight:700; margin-top:10px; padding-top:10px; border-top:1px solid var(--line);">
            <span>合计</span><span style="color:var(--danger);">¥58.00</span>
          </div>
        </div>

        <div style="margin-top:20px; display:flex; gap:12px;">
          <button class="btn btn-primary" onclick="submitIdcard()">📤 提交申请</button>
          <button class="btn btn-outline" onclick="navigate('orders')">查看我的订单</button>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>我的身份证订单</h3>
      </div>
      <div class="card-body" id="idcOrders">
        <div class="empty-state"><div class="icon">⏳</div><p>加载中...</p></div>
      </div>
    </div>
  `;
  loadIdcardOrders();
}

async function loadIdcardOrders() {
  try {
    const res = await apiGet("/api/idcard/orders?page_size=10");
    const items = res.items || [];
    const el = document.getElementById("idcOrders");

    if (items.length === 0) {
      el.innerHTML = `<div class="empty-state"><div class="icon">📭</div><p>暂无身份证订单</p></div>`;
      return;
    }

    el.innerHTML = `
      <table class="table">
        <thead>
          <tr><th>订单编号</th><th>业务类型</th><th>申请人</th><th>公安核验</th><th>状态</th><th>超期预警</th><th>创建时间</th><th>操作</th></tr>
        </thead>
        <tbody>
          ${items
            .map(
              (o) => `
            <tr>
              <td>${o.order_no}</td>
              <td>${o.business_type === "reissue" ? "补办" : o.business_type === "renew" ? "到期换领" : "损坏换领"}</td>
              <td>${o.real_name_masked || o.real_name}</td>
              <td>${o.police_verified ? '<span class="badge badge-success">已核验</span>' : '<span class="badge badge-warning">待核验</span>'}</td>
              <td>${getStatusBadge(o.status)}</td>
              <td>${o.overdue ? '<span class="badge badge-danger">已超期</span>' : '<span class="badge badge-success">正常</span>'}</td>
              <td>${formatDate(o.created_at)}</td>
              <td><button class="btn btn-outline btn-sm" onclick="viewOrderDetail('idcard','${o.order_no}')">详情</button></td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;
  } catch (e) {
    console.error(e);
  }
}

async function submitIdcard() {
  const body = {
    user_id: 1,
    business_type: document.getElementById("idcType").value,
    real_name: document.getElementById("idcName").value,
    id_card: document.getElementById("idcCard").value,
    phone: document.getElementById("idcPhone").value,
    old_id_card: document.getElementById("idcOld").value,
    reason: document.getElementById("idcReason").value,
    mailing_address: document.getElementById("idcAddress").value,
    city_code: document.getElementById("idcCity").value,
  };

  if (!body.real_name || !body.id_card || !body.phone || !body.mailing_address) {
    openModal("提示", "<p>请填写完整的申请信息</p>");
    return;
  }

  try {
    const res = await apiPost("/api/idcard/create", body);
    if (res.ok) {
      openModal(
        "提交成功",
        `
          <div style="text-align:center; padding:20px 0;">
            <div style="font-size:48px; margin-bottom:12px;">🎉</div>
            <h4 style="margin-bottom:8px;">申请已提交</h4>
            <p style="color:var(--ink-light); margin-bottom:8px;">订单编号：${res.order.order_no}</p>
            <p style="color:var(--muted); font-size:12px;">公安部门将在5个工作日内完成审核</p>
            <div style="margin-top:20px;">
              <button class="btn btn-primary" onclick="closeModal(); loadIdcardOrders();">确定</button>
            </div>
          </div>
        `
      );
    }
  } catch (e) {
    console.error(e);
  }
}

function renderOrdersPage(container) {
  container.innerHTML = `
    <div class="page-header">
      <h2>我的订单</h2>
      <p>查看所有业务订单的办理进度和详细信息</p>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>全部订单</h3>
      </div>
      <div class="card-body">
        <div class="tabs">
          <div class="tab active" data-tab="all" onclick="switchOrdersTab('all')">全部</div>
          <div class="tab" data-tab="certificate" onclick="switchOrdersTab('certificate')">签注办理</div>
          <div class="tab" data-tab="vehicle" onclick="switchOrdersTab('vehicle')">车管业务</div>
          <div class="tab" data-tab="idcard" onclick="switchOrdersTab('idcard')">身份证</div>
        </div>
        <div id="ordersContent"></div>
      </div>
    </div>
  `;
  loadAllOrders("all");
}

async function loadAllOrders(tab) {
  const [certRes, vehRes, idcRes] = await Promise.all([
    apiGet("/api/certificate/orders?page_size=20"),
    apiGet("/api/vehicle/orders?page_size=20"),
    apiGet("/api/idcard/orders?page_size=20"),
  ]);

  let all = [];
  if (tab === "all" || tab === "certificate") {
    all = all.concat((certRes.items || []).map((o) => ({ ...o, _type: "certificate", _typeName: "签注办理" })));
  }
  if (tab === "all" || tab === "vehicle") {
    all = all.concat((vehRes.items || []).map((o) => ({ ...o, _type: "vehicle", _typeName: "车管业务" })));
  }
  if (tab === "all" || tab === "idcard") {
    all = all.concat((idcRes.items || []).map((o) => ({ ...o, _type: "idcard", _typeName: "身份证" })));
  }

  all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const el = document.getElementById("ordersContent");
  if (all.length === 0) {
    el.innerHTML = `<div class="empty-state"><div class="icon">📭</div><p>暂无订单记录</p></div>`;
    return;
  }

  el.innerHTML = `
    <table class="table">
      <thead>
        <tr><th>订单编号</th><th>业务类型</th><th>申请人/车主</th><th>状态</th><th>超期</th><th>创建时间</th><th>操作</th></tr>
      </thead>
      <tbody>
        ${all
          .map(
            (o) => `
          <tr>
            <td>${o.order_no}</td>
            <td>${o._typeName}</td>
            <td>${o.real_name_masked || o.real_name}</td>
            <td>${getStatusBadge(o.status)}</td>
            <td>${o.overdue ? '<span class="badge badge-danger">已超期</span>' : '<span class="badge badge-success">正常</span>'}</td>
            <td>${formatDate(o.created_at)}</td>
            <td><button class="btn btn-outline btn-sm" onclick="viewOrderDetail('${o._type}','${o.order_no}')">详情</button></td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function switchOrdersTab(tab) {
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === tab));
  loadAllOrders(tab);
}

function renderPaymentsPage(container) {
  container.innerHTML = `
    <div class="page-header">
      <h2>缴费记录</h2>
      <p>所有缴费均进入监管账户，资金流向全程可追溯</p>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>缴费流水</h3>
      </div>
      <div class="card-body" id="paymentsList">
        <div class="empty-state"><div class="icon">⏳</div><p>加载中...</p></div>
      </div>
    </div>
  `;
  loadPayments();
}

async function loadPayments() {
  try {
    const res = await apiGet("/api/payments?user_id=1&page_size=20");
    const items = res.items || [];
    const el = document.getElementById("paymentsList");

    if (items.length === 0) {
      el.innerHTML = `<div class="empty-state"><div class="icon">💰</div><p>暂无缴费记录</p></div>`;
      return;
    }

    el.innerHTML = `
      <table class="table">
        <thead>
          <tr><th>支付单号</th><th>关联订单</th><th>支付方式</th><th>金额</th><th>状态</th><th>监管账户</th><th>结算状态</th><th>支付时间</th></tr>
        </thead>
        <tbody>
          ${items
            .map(
              (p) => `
            <tr>
              <td>${p.pay_no}</td>
              <td>${p.order_no}</td>
              <td>${p.pay_method === "wechat" ? "微信" : p.pay_method === "alipay" ? "支付宝" : "银联"}</td>
              <td style="font-weight:600;">¥${p.amount.toFixed(2)}</td>
              <td>${getStatusBadge(p.status)}</td>
              <td style="font-family:monospace; font-size:12px;">${p.escrow_account}</td>
              <td>${p.settled ? '<span class="badge badge-success">已结算</span>' : '<span class="badge badge-warning">待结算</span>'}</td>
              <td>${p.paid_at ? formatDate(p.paid_at) : "-"}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;
  } catch (e) {
    console.error(e);
  }
}

function renderReceiptPage(container) {
  container.innerHTML = `
    <div class="page-header">
      <h2>电子回执</h2>
      <p>业务完成后可获取电子回执，支持扫码核验</p>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>查询电子回执</h3>
      </div>
      <div class="card-body">
        <div class="form-row">
          <div class="form-group">
            <label>回执编号</label>
            <input type="text" id="receiptNo" placeholder="请输入回执编号" />
          </div>
          <div class="form-group">
            <label>订单编号</label>
            <input type="text" id="receiptOrderNo" placeholder="请输入订单编号" />
          </div>
        </div>
        <div style="display:flex; gap:10px;">
          <button class="btn btn-primary" onclick="queryReceipt()">🔍 查询</button>
        </div>
      </div>
    </div>

    <div id="receiptResult" style="margin-top:16px;"></div>
  `;
}

async function queryReceipt() {
  const receiptNo = document.getElementById("receiptNo").value;
  const orderNo = document.getElementById("receiptOrderNo").value;

  let url = "/api/receipt?";
  if (receiptNo) url += `receipt_no=${receiptNo}`;
  else if (orderNo) url += `order_no=${orderNo}`;
  else {
    openModal("提示", "<p>请输入回执编号或订单编号</p>");
    return;
  }

  try {
    const res = await apiGet(url);
    const receipt = res.receipt;
    const el = document.getElementById("receiptResult");

    if (!receipt || !receipt.receipt_no) {
      el.innerHTML = `
        <div class="card">
          <div class="card-body">
            <div class="empty-state"><div class="icon">❓</div><p>未找到对应电子回执</p></div>
          </div>
        </div>
      `;
      return;
    }

    el.innerHTML = `
      <div class="card">
        <div class="card-header"><h3>电子回执</h3></div>
        <div class="card-body">
          <div class="receipt-card">
            <h4>政务便民服务电子回执</h4>
            <div class="receipt-no">${receipt.receipt_no}</div>
            <div class="qr-placeholder">📱</div>
            <div style="font-size:12px; color:var(--ink-light); margin-bottom:4px;">
              业务类型：${receipt.business_type === "hk_macao_endorse" ? "港澳签注" : "其他"}
            </div>
            <div style="font-size:12px; color:var(--ink-light); margin-bottom:4px;">
              关联订单：${receipt.order_no}
            </div>
            <div style="font-size:12px; color:var(--ink-light); margin-bottom:4px;">
              核验码：${receipt.verify_code}
            </div>
            <div class="valid-info">
              签发日期：${formatDate(receipt.issue_date)} · 有效期至：${formatDate(receipt.valid_date)}
            </div>
          </div>
          <div style="margin-top:16px; display:flex; gap:10px; justify-content:center;">
            <button class="btn btn-outline">📥 下载回执</button>
            <button class="btn btn-primary">📤 发送至邮箱</button>
          </div>
        </div>
      </div>
    `;
  } catch (e) {
    console.error(e);
  }
}

function renderCourierDashboard(container) {
  container.innerHTML = `
    <div class="page-header">
      <h2>揽收工作台</h2>
      <p>邮政揽收员 · LBS调度 · 工单闭环</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">待揽收工单</div>
        <div class="stat-value" id="courier-pending">--</div>
        <div class="stat-trend">等待接单</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">今日已完成</div>
        <div class="stat-value" id="courier-completed">--</div>
        <div class="stat-trend">今日统计</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">进行中</div>
        <div class="stat-value" id="courier-ongoing">--</div>
        <div class="stat-trend warning">处理中</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">累计揽收</div>
        <div class="stat-value" id="courier-total">--</div>
        <div class="stat-trend">历史总计</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>LBS 调度地图</h3>
      </div>
      <div class="card-body">
        <div class="workorder-map">
          <div class="map-icon">📍</div>
          <p>揽收范围：广州市天河区 · 附近待揽收工单 5 单</p>
          <p style="margin-top:8px;">当前位置：23.1291° N, 113.2644° E</p>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>待处理工单</h3>
        <button class="btn btn-outline btn-sm" onclick="navigate('workorders')">查看全部</button>
      </div>
      <div class="card-body" id="courierWorkorders">
        <div class="empty-state"><div class="icon">⏳</div><p>加载中...</p></div>
      </div>
    </div>
  `;
  loadCourierDashboard();
}

async function loadCourierDashboard() {
  try {
    const pendingRes = await apiGet("/api/workorders?status=pending");
    const acceptedRes = await apiGet("/api/workorders?status=accepted&courier_id=2");
    const completedRes = await apiGet("/api/workorders?status=completed&courier_id=2");
    const allRes = await apiGet("/api/workorders?courier_id=2");

    document.getElementById("courier-pending").textContent = pendingRes.total || 0;
    document.getElementById("courier-ongoing").textContent = acceptedRes.total || 0;
    document.getElementById("courier-completed").textContent = completedRes.items?.length || 0;
    document.getElementById("courier-total").textContent = allRes.total || 0;

    const items = pendingRes.items || [];
    const el = document.getElementById("courierWorkorders");
    if (items.length === 0) {
      el.innerHTML = `<div class="empty-state"><div class="icon">✅</div><p>暂无待处理工单</p></div>`;
    } else {
      el.innerHTML = `
        <table class="table">
          <thead>
            <tr><th>工单编号</th><th>业务类型</th><th>联系人</th><th>联系电话</th><th>地址</th><th>预约时间</th><th>操作</th></tr>
          </thead>
          <tbody>
            ${items
              .slice(0, 5)
              .map(
                (w) => `
              <tr>
                <td>${w.work_no}</td>
                <td>${w.business_type === "hk_macao_endorse" ? "港澳签注" : w.business_type === "six_year_exempt" ? "六年免检" : "其他"}</td>
                <td>${w.contact_name_masked || w.contact_name}</td>
                <td>${w.contact_phone_masked || w.contact_phone}</td>
                <td>${w.address}</td>
                <td>${w.scheduled_time ? formatDate(w.scheduled_time) : "-"}</td>
                <td><button class="btn btn-primary btn-sm" onclick="acceptWorkorder('${w.work_no}')">抢单</button></td>
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

async function acceptWorkorder(workNo) {
  try {
    const res = await apiPost("/api/workorders/accept", { work_no: workNo, courier_id: 2, courier_name: "李快递" });
    if (res.ok) {
      openModal(
        "接单成功",
        `
          <div style="text-align:center; padding:20px 0;">
            <div style="font-size:48px; margin-bottom:12px;">✅</div>
            <h4 style="margin-bottom:8px;">已成功接单</h4>
            <p style="color:var(--ink-light);">请按预约时间上门揽收</p>
            <div style="margin-top:16px;">
              <button class="btn btn-primary" onclick="closeModal(); loadCourierDashboard();">确定</button>
            </div>
          </div>
        `
      );
    }
  } catch (e) {
    console.error(e);
  }
}

function renderWorkordersPage(container) {
  container.innerHTML = `
    <div class="page-header">
      <h2>工单列表</h2>
      <p>所有待揽收工单，支持抢单模式</p>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>待揽收工单池</h3>
      </div>
      <div class="card-body" id="allWorkorders">
        <div class="empty-state"><div class="icon">⏳</div><p>加载中...</p></div>
      </div>
    </div>
  `;
  loadAllWorkorders();
}

async function loadAllWorkorders() {
  try {
    const res = await apiGet("/api/workorders?status=pending&page_size=20");
    const items = res.items || [];
    const el = document.getElementById("allWorkorders");

    if (items.length === 0) {
      el.innerHTML = `<div class="empty-state"><div class="icon">✅</div><p>暂无待揽收工单</p></div>`;
      return;
    }

    el.innerHTML = `
      <table class="table">
        <thead>
          <tr><th>工单编号</th><th>业务类型</th><th>联系人</th><th>联系电话</th><th>地址</th><th>预约时间</th><th>操作</th></tr>
        </thead>
        <tbody>
          ${items
            .map(
              (w) => `
            <tr>
              <td>${w.work_no}</td>
              <td>${w.business_type === "hk_macao_endorse" ? "港澳签注" : w.business_type === "six_year_exempt" ? "六年免检" : "其他"}</td>
              <td>${w.contact_name_masked || w.contact_name}</td>
              <td>${w.contact_phone_masked || w.contact_phone}</td>
              <td>${w.address}</td>
              <td>${w.scheduled_time ? formatDate(w.scheduled_time) : "-"}</td>
              <td><button class="btn btn-primary btn-sm" onclick="acceptWorkorder('${w.work_no}')">抢单</button></td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;
  } catch (e) {
    console.error(e);
  }
}

function renderMyWorkordersPage(container) {
  container.innerHTML = `
    <div class="page-header">
      <h2>我的工单</h2>
      <p>已接单的工单列表</p>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>进行中</h3>
      </div>
      <div class="card-body" id="myWorkordersOngoing">
        <div class="empty-state"><div class="icon">⏳</div><p>加载中...</p></div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>已完成</h3>
      </div>
      <div class="card-body" id="myWorkordersDone">
        <div class="empty-state"><div class="icon">⏳</div><p>加载中...</p></div>
      </div>
    </div>
  `;
  loadMyWorkorders();
}

async function loadMyWorkorders() {
  try {
    const [ongoingRes, doneRes] = await Promise.all([
      apiGet("/api/workorders?status=accepted&courier_id=2"),
      apiGet("/api/workorders?status=completed&courier_id=2"),
    ]);

    const ongoingItems = ongoingRes.items || [];
    const doneItems = doneRes.items || [];

    const ongoingEl = document.getElementById("myWorkordersOngoing");
    if (ongoingItems.length === 0) {
      ongoingEl.innerHTML = `<div class="empty-state"><div class="icon">📭</div><p>暂无进行中工单</p></div>`;
    } else {
      ongoingEl.innerHTML = `
        <table class="table">
          <thead>
            <tr><th>工单编号</th><th>业务类型</th><th>联系人</th><th>地址</th><th>预约时间</th><th>操作</th></tr>
          </thead>
          <tbody>
            ${ongoingItems
              .map(
                (w) => `
              <tr>
                <td>${w.work_no}</td>
                <td>${w.business_type === "hk_macao_endorse" ? "港澳签注" : "其他"}</td>
                <td>${w.contact_name_masked || w.contact_name}</td>
                <td>${w.address}</td>
                <td>${w.scheduled_time ? formatDate(w.scheduled_time) : "-"}</td>
                <td><button class="btn btn-success btn-sm" onclick="completeWorkorder('${w.work_no}')">完成揽收</button></td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      `;
    }

    const doneEl = document.getElementById("myWorkordersDone");
    if (doneItems.length === 0) {
      doneEl.innerHTML = `<div class="empty-state"><div class="icon">📭</div><p>暂无已完成工单</p></div>`;
    } else {
      doneEl.innerHTML = `
        <table class="table">
          <thead>
            <tr><th>工单编号</th><th>业务类型</th><th>联系人</th><th>地址</th><th>完成时间</th><th>状态</th></tr>
          </thead>
          <tbody>
            ${doneItems
              .map(
                (w) => `
              <tr>
                <td>${w.work_no}</td>
                <td>${w.business_type === "hk_macao_endorse" ? "港澳签注" : "其他"}</td>
                <td>${w.contact_name_masked || w.contact_name}</td>
                <td>${w.address}</td>
                <td>${w.completed_time ? formatDate(w.completed_time) : "-"}</td>
                <td><span class="badge badge-success">已完成</span></td>
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

async function completeWorkorder(workNo) {
  try {
    const res = await apiPost("/api/workorders/complete", { work_no: workNo });
    if (res.ok) {
      openModal(
        "揽收完成",
        `
          <div style="text-align:center; padding:20px 0;">
            <div style="font-size:48px; margin-bottom:12px;">✅</div>
            <h4 style="margin-bottom:8px;">揽收完成</h4>
            <p style="color:var(--ink-light);">工单 ${workNo} 已完成揽收</p>
            <div style="margin-top:16px;">
              <button class="btn btn-primary" onclick="closeModal(); loadMyWorkorders();">确定</button>
            </div>
          </div>
        `
      );
    }
  } catch (e) {
    console.error(e);
  }
}

function renderCourierStats(container) {
  container.innerHTML = `
    <div class="page-header">
      <h2>揽收统计</h2>
      <p>个人揽收业绩统计</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">今日揽收</div>
        <div class="stat-value">12</div>
        <div class="stat-trend">+15% ↑</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">本周揽收</div>
        <div class="stat-value">68</div>
        <div class="stat-trend">+8% ↑</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">本月揽收</div>
        <div class="stat-value">256</div>
        <div class="stat-trend">+12% ↑</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">平均响应</div>
        <div class="stat-value">12min</div>
        <div class="stat-trend">良好</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>近期揽收记录</h3>
      </div>
      <div class="card-body">
        <div class="empty-state"><div class="icon">📊</div><p>统计功能完善中...</p></div>
      </div>
    </div>
  `;
}

function renderAuditorDashboard(container) {
  container.innerHTML = `
    <div class="page-header">
      <h2>审批工作台</h2>
      <p>审批机关 · 港澳签注/赴台签注省级政务系统对接</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">待审批</div>
        <div class="stat-value" id="audit-pending">--</div>
        <div class="stat-trend warning">待处理</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">今日已审批</div>
        <div class="stat-value">--</div>
        <div class="stat-trend">今日统计</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">超期预警</div>
        <div class="stat-value" id="audit-overdue">--</div>
        <div class="stat-trend danger">需紧急处理</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">审批通过率</div>
        <div class="stat-value">96%</div>
        <div class="stat-trend">本月平均</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>待审批列表</h3>
      </div>
      <div class="card-body" id="auditPendingList">
        <div class="empty-state"><div class="icon">⏳</div><p>加载中...</p></div>
      </div>
    </div>
  `;
  loadAuditorDashboard();
}

async function loadAuditorDashboard() {
  try {
    const res = await apiGet("/api/certificate/orders?page_size=20");
    const all = res.items || [];
    const pending = all.filter(
      (o) => ["materials_received", "pre_auditing", "auditing"].includes(o.status)
    );
    const overdue = all.filter((o) => o.overdue && o.status !== "completed");

    document.getElementById("audit-pending").textContent = pending.length;
    document.getElementById("audit-overdue").textContent = overdue.length;

    const el = document.getElementById("auditPendingList");
    if (pending.length === 0) {
      el.innerHTML = `<div class="empty-state"><div class="icon">✅</div><p>暂无待审批申请</p></div>`;
    } else {
      el.innerHTML = `
        <table class="table">
          <thead>
            <tr><th>订单编号</th><th>业务类型</th><th>申请人</th><th>预审状态</th><th>超期</th><th>提交时间</th><th>操作</th></tr>
          </thead>
          <tbody>
            ${pending
              .slice(0, 8)
              .map(
                (o) => `
              <tr>
                <td>${o.order_no}</td>
                <td>${o.business_type === "hk_macao_endorse" ? "港澳签注" : "赴台签注"}</td>
                <td>${o.real_name_masked || o.real_name}</td>
                <td>${o.pre_audit_status === "passed" ? '<span class="badge badge-success">通过</span>' : '<span class="badge badge-warning">待预审</span>'}</td>
                <td>${o.overdue ? '<span class="badge badge-danger">已超期</span>' : '<span class="badge badge-success">正常</span>'}</td>
                <td>${formatDate(o.created_at)}</td>
                <td>
                  <button class="btn btn-primary btn-sm" onclick="viewOrderDetail('certificate','${o.order_no}')">审批</button>
                </td>
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

function renderCertificateAuditPage(container) {
  container.innerHTML = `
    <div class="page-header">
      <h2>签注审批</h2>
      <p>港澳/赴台签注的审批管理</p>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>审批列表</h3>
      </div>
      <div class="card-body">
        <div class="tabs">
          <div class="tab active" onclick="switchAuditTab('pending')">待审批</div>
          <div class="tab" onclick="switchAuditTab('approved')">已通过</div>
          <div class="tab" onclick="switchAuditTab('rejected')">已驳回</div>
        </div>
        <div id="certAuditContent">
          <div class="empty-state"><div class="icon">⏳</div><p>加载中...</p></div>
        </div>
      </div>
    </div>
  `;
  loadCertificateAudit("pending");
}

async function loadCertificateAudit(tab) {
  try {
    const res = await apiGet("/api/certificate/orders?page_size=20");
    let items = res.items || [];

    if (tab === "pending") {
      items = items.filter((o) => ["materials_received", "pre_auditing", "auditing"].includes(o.status));
    } else if (tab === "approved") {
      items = items.filter((o) => ["approved", "mailing", "completed"].includes(o.status));
    } else {
      items = items.filter((o) => o.status === "rejected");
    }

    const el = document.getElementById("certAuditContent");
    if (items.length === 0) {
      el.innerHTML = `<div class="empty-state"><div class="icon">📭</div><p>暂无数据</p></div>`;
      return;
    }

    el.innerHTML = `
      <table class="table">
        <thead>
          <tr><th>订单编号</th><th>业务类型</th><th>申请人</th><th>身份证</th><th>预审状态</th><th>状态</th><th>操作</th></tr>
        </thead>
        <tbody>
          ${items
            .map(
              (o) => `
            <tr>
              <td>${o.order_no}</td>
              <td>${o.business_type === "hk_macao_endorse" ? "港澳签注" : "赴台签注"}</td>
              <td>${o.real_name_masked || o.real_name}</td>
              <td>${o.id_card_masked || o.id_card}</td>
              <td>${o.pre_audit_status === "passed" ? '<span class="badge badge-success">通过</span>' : '<span class="badge badge-warning">待预审</span>'}</td>
              <td>${getStatusBadge(o.status)}</td>
              <td><button class="btn btn-outline btn-sm" onclick="viewOrderDetail('certificate','${o.order_no}')">详情</button></td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;
  } catch (e) {
    console.error(e);
  }
}

function switchAuditTab(tab) {
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.textContent.includes(tab === "pending" ? "待" : tab === "approved" ? "通" : "驳")));
  loadCertificateAudit(tab);
}

function renderIdcardAuditPage(container) {
  container.innerHTML = `
    <div class="page-header">
      <h2>身份证审批</h2>
      <p>身份证补换领的公安核验</p>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>待核验列表</h3>
      </div>
      <div class="card-body" id="idcardAuditList">
        <div class="empty-state"><div class="icon">⏳</div><p>加载中...</p></div>
      </div>
    </div>
  `;
  loadIdcardAudit();
}

async function loadIdcardAudit() {
  try {
    const res = await apiGet("/api/idcard/orders?page_size=20");
    const items = (res.items || []).filter((o) => !o.police_verified);
    const el = document.getElementById("idcardAuditList");

    if (items.length === 0) {
      el.innerHTML = `<div class="empty-state"><div class="icon">✅</div><p>暂无待核验申请</p></div>`;
      return;
    }

    el.innerHTML = `
      <table class="table">
        <thead>
          <tr><th>订单编号</th><th>业务类型</th><th>申请人</th><th>身份证号</th><th>公安核验</th><th>操作</th></tr>
        </thead>
        <tbody>
          ${items
            .map(
              (o) => `
            <tr>
              <td>${o.order_no}</td>
              <td>${o.business_type === "reissue" ? "补办" : "换领"}</td>
              <td>${o.real_name_masked || o.real_name}</td>
              <td>${o.id_card_masked || o.id_card}</td>
              <td><span class="badge badge-warning">待核验</span></td>
              <td><button class="btn btn-outline btn-sm" onclick="viewOrderDetail('idcard','${o.order_no}')">详情</button></td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;
  } catch (e) {
    console.error(e);
  }
}

function renderAuditStatsPage(container) {
  container.innerHTML = `
    <div class="page-header">
      <h2>审批统计</h2>
      <p>审批业务数据统计</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">今日审批</div>
        <div class="stat-value">58</div>
        <div class="stat-trend">+10% ↑</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">本月审批</div>
        <div class="stat-value">1,256</div>
        <div class="stat-trend">+15% ↑</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">通过率</div>
        <div class="stat-value">96.2%</div>
        <div class="stat-trend">稳定</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">平均时长</div>
        <div class="stat-value">4.2h</div>
        <div class="stat-trend">良好</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3>业务分布</h3></div>
      <div class="card-body">
        <div class="empty-state"><div class="icon">📊</div><p>统计图表完善中...</p></div>
      </div>
    </div>
  `;
}

function renderOperatorDashboard(container) {
  container.innerHTML = `
    <div class="page-header">
      <h2>地市运营工作台</h2>
      <p>广东省21地市独立服务配置 · 分级运营管理</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">今日总订单</div>
        <div class="stat-value" id="op-today">--</div>
        <div class="stat-trend">全省合计</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">在途工单</div>
        <div class="stat-value" id="op-wo">--</div>
        <div class="stat-trend">处理中</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">超期预警</div>
        <div class="stat-value" id="op-overdue">--</div>
        <div class="stat-trend danger">需关注</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">监管资金</div>
        <div class="stat-value" id="op-money">--</div>
        <div class="stat-trend">元</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>最新预警</h3>
        <button class="btn btn-outline btn-sm" onclick="navigate('alert-center')">预警中心</button>
      </div>
      <div class="card-body" id="opAlerts">
        <div class="empty-state"><div class="icon">⏳</div><p>加载中...</p></div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>最近审计日志</h3>
        <button class="btn btn-outline btn-sm" onclick="navigate('audit-logs')">全部日志</button>
      </div>
      <div class="card-body" id="opAuditLogs">
        <div class="empty-state"><div class="icon">⏳</div><p>加载中...</p></div>
      </div>
    </div>
  `;
  loadOperatorDashboard();
}

async function loadOperatorDashboard() {
  try {
    const [statsRes, alertRes, auditRes, escrowRes] = await Promise.all([
      apiGet("/api/stats/overview"),
      apiGet("/api/alerts?handled=0&page_size=5"),
      apiGet("/api/audit?page_size=5"),
      apiGet("/api/escrow"),
    ]);

    document.getElementById("op-today").textContent = statsRes.today_orders?.total || 0;
    document.getElementById("op-wo").textContent = statsRes.pending_workorders || 0;
    document.getElementById("op-overdue").textContent = statsRes.overdue_count || 0;

    const totalEscrow = (escrowRes.items || []).reduce((sum, e) => sum + (e.total_balance || 0), 0);
    document.getElementById("op-money").textContent = totalEscrow.toLocaleString();

    const alerts = alertRes.items || [];
    const alertEl = document.getElementById("opAlerts");
    if (alerts.length === 0) {
      alertEl.innerHTML = `<div class="empty-state"><div class="icon">✅</div><p>暂无预警</p></div>`;
    } else {
      alertEl.innerHTML = alerts
        .map(
          (a) => `
        <div class="alert-item ${a.level}">
          <div class="alert-icon">${a.level === "high" ? "🚨" : a.level === "medium" ? "⚠️" : "ℹ️"}</div>
          <div class="alert-content">
            <h4>${a.title}</h4>
            <p>${a.content || ""}</p>
            <div class="alert-time">${formatDate(a.created_at)}</div>
          </div>
          <button class="btn btn-outline btn-sm" onclick="handleAlert(${a.id})">处理</button>
        </div>
      `
        )
        .join("");
    }

    const logs = auditRes.items || [];
    const logEl = document.getElementById("opAuditLogs");
    if (logs.length === 0) {
      logEl.innerHTML = `<div class="empty-state"><div class="icon">📭</div><p>暂无日志</p></div>`;
    } else {
      logEl.innerHTML = `
        <table class="table">
          <thead>
            <tr><th>操作人</th><th>操作</th><th>模块</th><th>详情</th><th>IP</th><th>时间</th></tr>
          </thead>
          <tbody>
            ${logs
              .map(
                (l) => `
              <tr>
                <td>${l.username || "-"}</td>
                <td>${l.action}</td>
                <td><span class="badge badge-info">${l.module}</span></td>
                <td>${l.detail || "-"}</td>
                <td>${l.ip || "-"}</td>
                <td>${formatDate(l.created_at)}</td>
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

async function handleAlert(alertId) {
  try {
    await apiPost("/api/alerts/handle", { alert_id: alertId, handled_by: "operator_gz" });
    openModal(
      "处理完成",
      `
        <div style="text-align:center; padding:20px 0;">
          <div style="font-size:48px; margin-bottom:12px;">✅</div>
          <h4>预警已处理</h4>
          <div style="margin-top:16px;">
            <button class="btn btn-primary" onclick="closeModal(); loadOperatorDashboard();">确定</button>
          </div>
        </div>
      `
    );
  } catch (e) {
    console.error(e);
  }
}

function renderCityManagementPage(container) {
  container.innerHTML = `
    <div class="page-header">
      <h2>地市运营管理</h2>
      <p>广东省21地市独立服务配置 · 分级运营</p>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>广东省21地市服务概览</h3>
      </div>
      <div class="card-body" id="cityGrid">
        <div class="empty-state"><div class="icon">⏳</div><p>加载中...</p></div>
      </div>
    </div>
  `;
  loadCityManagement();
}

async function loadCityManagement() {
  try {
    const res = await apiGet("/api/operator/city-stats");
    const cities = res.cities || [];
    const el = document.getElementById("cityGrid");

    el.innerHTML = `
      <div class="city-grid">
        ${cities
          .map(
            (c) => `
          <div class="city-card" onclick="openCityDetail('${c.city_code}','${c.city_name}')">
            <h4>${c.city_name}</h4>
            <div class="city-stats">
              <span>订单总数</span><strong>${c.total_orders}</strong>
              <span>签注</span><strong>${c.cert_total}</strong>
              <span>车管</span><strong>${c.vehicle_total}</strong>
              <span>身份证</span><strong>${c.idcard_total}</strong>
              <span>在途工单</span><strong>${c.workorder_total}</strong>
              <span>超期预警</span><strong style="color:${c.overdue_count > 0 ? "var(--danger)" : "var(--success)"};">${c.overdue_count}</strong>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    `;
  } catch (e) {
    console.error(e);
  }
}

function openCityDetail(code, name) {
  openModal(
    `${name} 运营详情`,
    `
      <div style="text-align:center; padding:20px 0;">
        <div style="font-size:48px; margin-bottom:12px;">🏙️</div>
        <h4 style="margin-bottom:8px;">${name}</h4>
        <p style="color:var(--ink-light);">城市代码：${code}</p>
        <div style="margin-top:20px; text-align:left;">
          <div style="padding:12px; background:#f8fafc; border-radius:6px; margin-bottom:10px;">
            <strong>服务配置：</strong>快递费 ¥18，审批时限 48小时
          </div>
          <div style="padding:12px; background:#f8fafc; border-radius:6px;">
            <strong>监管账户：</strong>已开通中国建设银行广州分行监管账户
          </div>
        </div>
        <div style="margin-top:20px; display:flex; gap:10px; justify-content:center;">
          <button class="btn btn-outline" onclick="closeModal()">关闭</button>
          <button class="btn btn-primary">查看详情</button>
        </div>
      </div>
    `
  );
}

function renderEscrowManagementPage(container) {
  container.innerHTML = `
    <div class="page-header">
      <h2>资金监管</h2>
      <p>代缴资金监管账户隔离 · 资金流向全程可追溯</p>
    </div>

    <div class="mask-info">🏦 所有代缴资金进入专用监管账户，与运营资金严格隔离，按日对账结算</div>

    <div id="escrowList"></div>
  `;
  loadEscrowManagement();
}

async function loadEscrowManagement() {
  try {
    const res = await apiGet("/api/escrow");
    const items = res.items || [];
    const el = document.getElementById("escrowList");

    if (items.length === 0) {
      el.innerHTML = `<div class="empty-state"><div class="icon">🏦</div><p>暂无监管账户</p></div>`;
      return;
    }

    el.innerHTML = items
      .map(
        (e) => `
      <div class="escrow-card">
        <h4>${e.bank_name}</h4>
        <div class="amount">¥${(e.total_balance || 0).toLocaleString("zh-CN", { minimumFractionDigits: 2 })}</div>
        <div class="account-no">${e.account_no}</div>
        <div class="escrow-stats">
          <div>
            <span>冻结资金</span>
            <strong>¥${(e.frozen_balance || 0).toLocaleString("zh-CN", { minimumFractionDigits: 2 })}</strong>
          </div>
          <div>
            <span>可用资金</span>
            <strong>¥${(e.available_balance || 0).toLocaleString("zh-CN", { minimumFractionDigits: 2 })}</strong>
          </div>
        </div>
        <div style="margin-top:12px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.2); display:flex; justify-content:space-between; font-size:12px; opacity:0.8;">
          <span>城市：${e.city_code}</span>
          <span>更新：${formatDate(e.updated_at)}</span>
        </div>
      </div>
    `
      )
      .join("");
  } catch (e) {
    console.error(e);
  }
}

function renderAlertCenterPage(container) {
  container.innerHTML = `
    <div class="page-header">
      <h2>预警中心</h2>
      <p>全流程时效预警 · 超期自动提醒</p>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>预警列表</h3>
      </div>
      <div class="card-body">
        <div class="tabs">
          <div class="tab active" onclick="switchAlertTab('unhandled')">待处理</div>
          <div class="tab" onclick="switchAlertTab('handled')">已处理</div>
          <div class="tab" onclick="switchAlertTab('all')">全部</div>
        </div>
        <div id="alertListContent"></div>
      </div>
    </div>
  `;
  loadAlertCenter("unhandled");
}

async function loadAlertCenter(tab) {
  let url = "/api/alerts?page_size=20";
  if (tab === "unhandled") url += "&handled=0";
  else if (tab === "handled") url += "&handled=1";

  try {
    const res = await apiGet(url);
    const items = res.items || [];
    const el = document.getElementById("alertListContent");

    if (items.length === 0) {
      el.innerHTML = `<div class="empty-state"><div class="icon">✅</div><p>暂无预警</p></div>`;
      return;
    }

    el.innerHTML = items
      .map(
        (a) => `
      <div class="alert-item ${a.level}">
        <div class="alert-icon">${a.level === "high" ? "🚨" : a.level === "medium" ? "⚠️" : "ℹ️"}</div>
        <div class="alert-content">
          <h4>${a.title}</h4>
          <p>${a.content || ""}</p>
          <div class="alert-time">${formatDate(a.created_at)}${a.related_order_no ? ` · 关联订单：${a.related_order_no}` : ""}${a.handled_by ? ` · 处理人：${a.handled_by}` : ""}</div>
        </div>
        ${!a.handled ? `<button class="btn btn-primary btn-sm" onclick="handleAlert(${a.id})">处理</button>` : `<span class="badge badge-success">已处理</span>`}
      </div>
    `
      )
      .join("");
  } catch (e) {
    console.error(e);
  }
}

function switchAlertTab(tab) {
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.textContent.includes(tab === "unhandled" ? "待" : tab === "handled" ? "已" : "全")));
  loadAlertCenter(tab);
}

function renderAuditLogsPage(container) {
  container.innerHTML = `
    <div class="page-header">
      <h2>审计日志</h2>
      <p>所有操作全程留痕 · 合规审计</p>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>操作日志</h3>
      </div>
      <div class="card-body" id="auditLogsList">
        <div class="empty-state"><div class="icon">⏳</div><p>加载中...</p></div>
      </div>
    </div>
  `;
  loadAuditLogs();
}

async function loadAuditLogs() {
  try {
    const res = await apiGet("/api/audit?page_size=20");
    const items = res.items || [];
    const el = document.getElementById("auditLogsList");

    if (items.length === 0) {
      el.innerHTML = `<div class="empty-state"><div class="icon">📭</div><p>暂无日志</p></div>`;
      return;
    }

    el.innerHTML = `
      <table class="table">
        <thead>
          <tr><th>操作人</th><th>操作</th><th>模块</th><th>详情</th><th>IP地址</th><th>时间</th></tr>
        </thead>
        <tbody>
          ${items
            .map(
              (l) => `
            <tr>
              <td>${l.username || "-"}</td>
              <td style="font-weight:500;">${l.action}</td>
              <td><span class="badge badge-info">${l.module}</span></td>
              <td>${l.detail || "-"}</td>
              <td style="font-family:monospace; font-size:12px;">${l.ip || "-"}</td>
              <td>${formatDate(l.created_at)}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;
  } catch (e) {
    console.error(e);
  }
}

function renderBusinessStatsPage(container) {
  container.innerHTML = `
    <div class="page-header">
      <h2>业务统计</h2>
      <p>全省业务数据统计分析</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">累计订单</div>
        <div class="stat-value">12,586</div>
        <div class="stat-trend">+18% ↑</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">累计交易金额</div>
        <div class="stat-value">¥286万</div>
        <div class="stat-trend">+22% ↑</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">服务城市</div>
        <div class="stat-value">21</div>
        <div class="stat-trend">广东全省</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">用户满意度</div>
        <div class="stat-value">98.5%</div>
        <div class="stat-trend">优秀</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3>业务类型分布</h3></div>
      <div class="card-body">
        <div class="empty-state"><div class="icon">📊</div><p>统计图表完善中...</p></div>
      </div>
    </div>
  `;
}

function renderThirdpartyDashboard(container) {
  container.innerHTML = `
    <div class="page-header">
      <h2>第三方服务概览</h2>
      <p>交管12123 / 公安部违章库 / 车辆年检检测站API接口监控</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">今日调用</div>
        <div class="stat-value">3,256</div>
        <div class="stat-trend">+8% ↑</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">成功率</div>
        <div class="stat-value">99.2%</div>
        <div class="stat-trend">稳定</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">平均响应</div>
        <div class="stat-value">320ms</div>
        <div class="stat-trend">良好</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">接口健康度</div>
        <div class="stat-value">3/3</div>
        <div class="stat-trend">全部正常</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3>接口状态</h3></div>
      <div class="card-body">
        <table class="table">
          <thead>
            <tr><th>接口名称</th><th>今日调用量</th><th>成功率</th><th>平均响应</th><th>状态</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>🚓 交管12123接口</td><td>1,256</td><td>99.5%</td><td>280ms</td><td><span class="badge badge-success">正常</span></td>
            </tr>
            <tr>
              <td>📡 公安部违章库</td><td>1,520</td><td>98.8%</td><td>350ms</td><td><span class="badge badge-success">正常</span></td>
            </tr>
            <tr>
              <td>🔧 车辆年检检测站API</td><td>480</td><td>99.8%</td><td>220ms</td><td><span class="badge badge-success">正常</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderTraffic122Page(container) {
  container.innerHTML = `
    <div class="page-header">
      <h2>交管12123接口</h2>
      <p>省级政务系统对接网关</p>
    </div>

    <div class="card">
      <div class="card-header"><h3>接口详情</h3></div>
      <div class="card-body">
        <div class="mask-info">🔌 已对接广东省交管12123平台，支持违章查询、在线缴费等接口</div>
        <div style="padding:16px; background:#f8fafc; border-radius:8px;">
          <div style="font-family:monospace; font-size:12px; line-height:2;">
            <div><strong>接口地址：</strong>/api/gateway/122/{action}</div>
            <div><strong>认证方式：</strong>AppKey + AppSecret 签名</div>
            <div><strong>限流策略：</strong>1000次/分钟</div>
            <div><strong>超时时间：</strong>5秒</div>
            <div><strong>加密方式：</strong>AES-256 + RSA-2048</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderViolationApiPage(container) {
  container.innerHTML = `
    <div class="page-header">
      <h2>公安部违章库接口</h2>
      <p>全国400+城市违章数据聚合接口</p>
    </div>

    <div class="card">
      <div class="card-header"><h3>接口详情</h3></div>
      <div class="card-body">
        <div class="mask-info">🔌 已对接公安部违章数据库，支持全国400+城市违章查询</div>
        <div style="padding:16px; background:#f8fafc; border-radius:8px;">
          <div style="font-family:monospace; font-size:12px; line-height:2;">
            <div><strong>接口地址：</strong>/api/gateway/violation/{action}</div>
            <div><strong>覆盖城市：</strong>400+</div>
            <div><strong>数据延迟：</strong>T+1小时</div>
            <div><strong>数据来源：</strong>公安部交通管理局</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderInspectionApiPage(container) {
  container.innerHTML = `
    <div class="page-header">
      <h2>车辆年检检测站API</h2>
      <p>全省检测站数据实时对接</p>
    </div>

    <div class="card">
      <div class="card-header"><h3>接口详情</h3></div>
      <div class="card-body">
        <div class="mask-info">🔌 已对接全省120+机动车检测站，支持年检预约、结果查询</div>
        <div style="padding:16px; background:#f8fafc; border-radius:8px;">
          <div style="font-family:monospace; font-size:12px; line-height:2;">
            <div><strong>接口地址：</strong>/api/gateway/inspection/{action}</div>
            <div><strong>接入检测站：</strong>126家</div>
            <div><strong>数据同步：</strong>实时</div>
            <div><strong>支持业务：</strong>预约、结果查询、合格标志申领</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

init();

