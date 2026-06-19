const config = window.APP_CONFIG || {};
const backendUrl = config.backendUrl || "http://127.0.0.1:59137";

const contentNode = document.querySelector("#content");
const pageTitleNode = document.querySelector("#pageTitle");
const refreshBtn = document.querySelector("#refreshBtn");
const systemStatusNode = document.querySelector("#systemStatus");

const routeConfig = {
  "dashboard": { title: "工作台首页" },
  "access": { title: "门禁通行" },
  "devices": { title: "设备纳管" },
  "repair": { title: "报事报修" },
  "neighborhood": { title: "邻里圈审核" },
  "property": { title: "物业费缴纳" },
  "announcements": { title: "公告推送" },
  "org": { title: "组织架构" },
  "permissions": { title: "权限矩阵" },
  "boundaries": { title: "权责边界" },
  "complaints": { title: "诉求工单" },
  "stats": { title: "响应时效统计" }
};

const state = {
  currentRoute: null,
  accessTab: "bluetooth"
};

async function api(path, options = {}) {
  try {
    const response = await fetch(`${backendUrl}${path}`, {
      cache: "no-store",
      ...options
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Error:", error);
    return { ok: false, error: error.message };
  }
}

function formatDate(isoString) {
  if (!isoString) return "-";
  try {
    return new Date(isoString).toLocaleString("zh-CN", {
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return isoString;
  }
}

function formatTimeAgo(isoString) {
  if (!isoString) return "-";
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "刚刚";
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 30) return `${days}天前`;
    return formatDate(isoString);
  } catch {
    return isoString;
  }
}

function getStatusClass(status) {
  const map = {
    "online": "badge-online",
    "offline": "badge-offline",
    "warning": "badge-warning",
    "pending": "badge-pending",
    "processing": "badge-processing",
    "completed": "badge-completed",
    "approved": "badge-approved",
    "rejected": "badge-rejected",
    "draft": "badge-draft",
    "published": "badge-published",
    "paid": "badge-paid",
    "unpaid": "badge-unpaid",
    "overdue": "badge-overdue",
    "submitted": "badge-submitted",
    "closed": "badge-closed",
    "success": "badge-approved",
    "failed": "badge-rejected",
    "critical": "badge-critical",
    "info": "badge-info",
    "updating": "badge-processing"
  };
  return map[status] || "badge-pending";
}

function getStatusLabel(status) {
  const map = {
    "online": "在线",
    "offline": "离线",
    "warning": "告警",
    "pending": "待处理",
    "processing": "处理中",
    "completed": "已完成",
    "approved": "已通过",
    "rejected": "已拒绝",
    "draft": "草稿",
    "published": "已发布",
    "paid": "已缴",
    "unpaid": "未缴",
    "overdue": "逾期",
    "submitted": "已提交",
    "closed": "已关闭",
    "success": "成功",
    "failed": "失败",
    "critical": "严重",
    "info": "提示",
    "updating": "升级中"
  };
  return map[status] || status;
}

function getMethodLabel(method) {
  const map = {
    "bluetooth": "蓝牙",
    "nfc": "NFC",
    "qr_code": "二维码",
    "face": "人脸识别"
  };
  return map[method] || method;
}

function getPriorityLabel(priority) {
  const map = {
    "high": "高",
    "medium": "中",
    "low": "低"
  };
  return map[priority] || priority;
}

function showLoading() {
  contentNode.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>正在加载...</p>
    </div>
  `;
}

function showError(message) {
  contentNode.innerHTML = `
    <div class="panel">
      <div class="panel-body">
        <div class="empty">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <p>加载失败：${message}</p>
          <button class="btn btn-primary" style="margin-top: 16px;" onclick="router()">重试</button>
        </div>
      </div>
    </div>
  `;
}

function updateActiveNav(routeKey) {
  document.querySelectorAll(".nav-item").forEach(item => {
    const itemRoute = item.dataset.route;
    if (itemRoute === routeKey) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });
}

function renderDashboard() {
  showLoading();
  Promise.all([
    api("/api/dashboard"),
    api("/api/health")
  ]).then(([dashboard, health]) => {
    if (!dashboard.ok) {
      showError(dashboard.error || "无法加载工作台数据");
      return;
    }

    if (health.ok) {
      systemStatusNode.innerHTML = `<span class="status-dot"></span><span>系统运行中</span>`;
    }

    const data = dashboard;

    contentNode.innerHTML = `
      <div class="page-header">
        <h1>工作台首页</h1>
        <p>社区数字治理概览，实时掌握各项业务状态</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-card-title">门禁设备</span>
            <div class="stat-icon accent">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
          </div>
          <div class="stat-card-value">${data.devices.total}</div>
          <div class="stat-card-sub">
            <span class="badge badge-online">在线 ${data.devices.online}</span>
            <span class="badge badge-warning" style="margin-left: 8px;">告警 ${data.devices.warning}</span>
            <span class="badge badge-offline" style="margin-left: 8px;">离线 ${data.devices.offline}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-card-title">设备告警</span>
            <div class="stat-icon danger">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
          </div>
          <div class="stat-card-value">${data.alarms.total}</div>
          <div class="stat-card-sub">
            <span class="badge badge-pending">待处理 ${data.alarms.pending}</span>
            <span class="badge badge-critical" style="margin-left: 8px;">严重 ${data.alarms.critical}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-card-title">报修工单</span>
            <div class="stat-icon warn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
            </div>
          </div>
          <div class="stat-card-value">${data.repairs.total}</div>
          <div class="stat-card-sub">
            <span class="badge badge-pending">待处理 ${data.repairs.pending}</span>
            <span class="badge badge-processing" style="margin-left: 8px;">处理中 ${data.repairs.processing}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-card-title">物业费收取</span>
            <div class="stat-icon success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
          </div>
          <div class="stat-card-value">¥${data.fees.paid_amount.toFixed(0)}</div>
          <div class="stat-card-sub">
            <span class="badge badge-unpaid">未缴 ${data.fees.unpaid}</span>
            <span class="badge badge-overdue" style="margin-left: 8px;">逾期 ${data.fees.overdue}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-card-title">邻里圈待审</span>
            <div class="stat-icon info">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
              </svg>
            </div>
          </div>
          <div class="stat-card-value">${data.posts.pending}</div>
          <div class="stat-card-sub">
            <span class="badge badge-pending">待审核</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-card-title">业主诉求</span>
            <div class="stat-icon accent">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
              </svg>
            </div>
          </div>
          <div class="stat-card-value">${data.complaints.total}</div>
          <div class="stat-card-sub">
            <span class="badge badge-submitted">待响应 ${data.complaints.submitted}</span>
          </div>
        </div>
      </div>

      <div class="grid">
        <div class="col-8">
          <div class="panel">
            <div class="panel-header">
              <h3 class="panel-title">最近通行记录</h3>
              <a href="#/access" class="btn btn-outline btn-sm">查看全部</a>
            </div>
            <div class="panel-body">
              <div class="recent-list">
                ${data.recent_access.map(record => `
                  <div class="list-item">
                    <div class="list-item-content">
                      <div class="list-item-title">
                        ${record.user_name} · ${getMethodLabel(record.method)}
                        <span class="badge ${record.status === 'success' ? 'badge-approved' : 'badge-rejected'}" style="margin-left: 8px;">
                          ${record.status === 'success' ? '成功' : '失败'}
                        </span>
                      </div>
                      <div class="list-item-desc">${record.device_name || record.device_id}</div>
                      <div class="list-item-meta">
                        <span>${formatTimeAgo(record.created_at)}</span>
                      </div>
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>
          </div>
        </div>

        <div class="col-4">
          <div class="panel">
            <div class="panel-header">
              <h3 class="panel-title">快捷入口</h3>
            </div>
            <div class="panel-body" style="display: grid; gap: 12px;">
              <a href="#/access" class="btn btn-outline" style="justify-content: flex-start; padding: 12px 16px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span>门禁通行管理</span>
              </a>
              <a href="#/repair" class="btn btn-outline" style="justify-content: flex-start; padding: 12px 16px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                </svg>
                <span>报事报修处理</span>
              </a>
              <a href="#/property" class="btn btn-outline" style="justify-content: flex-start; padding: 12px 16px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
                <span>物业费收缴</span>
              </a>
              <a href="#/admin/stats" class="btn btn-outline" style="justify-content: flex-start; padding: 12px 16px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
                <span>服务响应统计</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  });
}

function renderAccess() {
  showLoading();
  Promise.all([
    api("/api/access/records?limit=20"),
    api("/api/access/devices")
  ]).then(([records, devices]) => {
    if (!records.ok || !devices.ok) {
      showError(records.error || devices.error || "无法加载门禁数据");
      return;
    }

    const methods = [
      { key: "bluetooth", name: "蓝牙开锁", desc: "手机蓝牙近场感应", icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5"/></svg>` },
      { key: "nfc", name: "NFC刷卡", desc: "门禁卡/手机NFC感应", icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/></svg>` },
      { key: "qr_code", name: "二维码", desc: "扫码开门，支持访客", icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>` },
      { key: "face", name: "人脸识别", desc: "刷脸通行，无感进出", icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>` }
    ];

    contentNode.innerHTML = `
      <div class="page-header">
        <h1>门禁通行</h1>
        <p>支持蓝牙、NFC、二维码、人脸识别四模开锁，实时掌握通行状态</p>
      </div>

      <div class="access-methods">
        ${methods.map(m => `
          <div class="method-card ${state.accessTab === m.key ? 'active' : ''}" onclick="setAccessTab('${m.key}')${m.key === 'qr_code' ? '; showQrVisitorFlow();' : ''}">
            <div class="method-icon">${m.icon}</div>
            <div class="method-name">${m.name}</div>
            <div class="method-desc">${m.desc}</div>
            <div class="method-status">
              <span class="status-indicator on"></span>
              <span>模块在线</span>
            </div>
          </div>
        `).join("")}
      </div>

      <div class="grid">
        <div class="col-6">
          <div class="panel">
            <div class="panel-header">
              <h3 class="panel-title">设备状态</h3>
              <a href="#/access/devices" class="btn btn-outline btn-sm">设备管理</a>
            </div>
            <div class="panel-body">
              <div class="device-grid" style="grid-template-columns: 1fr 1fr; margin-bottom: 0;">
                ${devices.devices.slice(0, 4).map(d => `
                  <div class="device-card" style="padding: 16px;">
                    <div class="device-header" style="margin-bottom: 12px;">
                      <div class="device-info">
                        <h3 style="font-size: 14px;">${d.name}</h3>
                        <p>${d.location}</p>
                      </div>
                      <span class="badge ${getStatusClass(d.status)}">${getStatusLabel(d.status)}</span>
                    </div>
                    <div class="device-features" style="margin-bottom: 0;">
                      <span class="feature-tag ${d.has_bluetooth ? 'on' : 'off'}">蓝牙</span>
                      <span class="feature-tag ${d.has_nfc ? 'on' : 'off'}">NFC</span>
                      <span class="feature-tag ${d.has_qr ? 'on' : 'off'}">二维码</span>
                      <span class="feature-tag ${d.has_face ? 'on' : 'off'}">人脸</span>
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>
          </div>
        </div>

        <div class="col-6">
          <div class="panel">
            <div class="panel-header">
              <h3 class="panel-title">通行统计（今日）</h3>
            </div>
            <div class="panel-body">
              <div class="stats-summary">
                <div class="summary-card">
                  <div class="summary-label">总通行人次</div>
                  <div class="summary-value">${records.records.length * 5}<span class="summary-unit">次</span></div>
                </div>
                <div class="summary-card">
                  <div class="summary-label">蓝牙开锁</div>
                  <div class="summary-value">${Math.floor(records.records.length * 1.5)}<span class="summary-unit">次</span></div>
                </div>
                <div class="summary-card">
                  <div class="summary-label">人脸识别</div>
                  <div class="summary-value">${Math.floor(records.records.length * 1.2)}<span class="summary-unit">次</span></div>
                </div>
                <div class="summary-card">
                  <div class="summary-label">通行成功率</div>
                  <div class="summary-value">98.5<span class="summary-unit">%</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <h3 class="panel-title">通行记录</h3>
          <div class="filter-bar" style="margin: 0; padding: 0; border: none; background: transparent;">
            <div class="filter-group">
              <select onchange="filterAccessRecords(this.value)">
                <option value="">全部方式</option>
                <option value="bluetooth">蓝牙</option>
                <option value="nfc">NFC</option>
                <option value="qr_code">二维码</option>
                <option value="face">人脸识别</option>
              </select>
            </div>
          </div>
        </div>
        <div class="panel-body" style="padding: 0;">
          <table class="table" id="accessRecordsTable">
            <thead>
              <tr>
                <th>时间</th>
                <th>人员</th>
                <th>设备</th>
                <th>开锁方式</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              ${records.records.map(r => `
                <tr>
                  <td>${formatDate(r.created_at)}</td>
                  <td>${r.user_name}</td>
                  <td>${r.device_name}</td>
                  <td>
                    <span class="badge badge-info">${getMethodLabel(r.method)}</span>
                  </td>
                  <td>
                    <span class="badge ${getStatusClass(r.status)}">${getStatusLabel(r.status)}</span>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  });
}

function setAccessTab(key) {
  state.accessTab = key;
  renderAccess();
}

function filterAccessRecords(method) {
  const rows = document.querySelectorAll("#accessRecordsTable tbody tr");
  rows.forEach(row => {
    if (!method || row.cells[3].textContent.includes(getMethodLabel(method))) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
}

function renderDevices() {
  showLoading();
  Promise.all([
    api("/api/access/devices"),
    api("/api/access/alarms"),
    api("/api/access/ota")
  ]).then(([devices, alarms, ota]) => {
    if (!devices.ok || !alarms.ok || !ota.ok) {
      showError("无法加载设备数据");
      return;
    }

    contentNode.innerHTML = `
      <div class="page-header">
        <h1>设备纳管</h1>
        <p>门禁设备全生命周期管理：离线缓存、心跳检测、固件OTA、告警分级响应</p>
      </div>

      <div class="filter-bar">
        <div class="filter-group">
          <label>设备状态</label>
          <select onchange="filterDevices(this.value)">
            <option value="">全部</option>
            <option value="online">在线</option>
            <option value="warning">告警</option>
            <option value="offline">离线</option>
          </select>
        </div>
        <div class="filter-group">
          <label>设备类型</label>
          <select>
            <option value="">全部</option>
            <option value="gate">大门</option>
            <option value="unit_door">单元门</option>
          </select>
        </div>
      </div>

      <div class="device-grid" id="deviceGrid">
        ${devices.devices.map(d => `
          <div class="device-card" data-status="${d.status}">
            <div class="device-header">
              <div class="device-info">
                <h3>${d.name}</h3>
                <p>${d.location} · ${d.type === 'gate' ? '大门' : '单元门'}</p>
              </div>
              <span class="badge ${getStatusClass(d.status)}">${getStatusLabel(d.status)}</span>
            </div>
            <div class="device-meta">
              <div class="meta-item">
                <div class="meta-label">设备编号</div>
                <div class="meta-value">${d.id}</div>
              </div>
              <div class="meta-item">
                <div class="meta-label">固件版本</div>
                <div class="meta-value">${d.firmware_version}</div>
              </div>
              <div class="meta-item">
                <div class="meta-label">最后心跳</div>
                <div class="meta-value">${formatTimeAgo(d.last_heartbeat)}</div>
              </div>
              <div class="meta-item">
                <div class="meta-label">离线缓存</div>
                <div class="meta-value">${d.offline_cache} 条</div>
              </div>
            </div>
            <div class="device-features">
              <span class="feature-tag ${d.has_bluetooth ? 'on' : 'off'}">蓝牙</span>
              <span class="feature-tag ${d.has_nfc ? 'on' : 'off'}">NFC</span>
              <span class="feature-tag ${d.has_qr ? 'on' : 'off'}">二维码</span>
              <span class="feature-tag ${d.has_face ? 'on' : 'off'}">人脸</span>
            </div>
            <div class="progress-bar" title="离线缓存使用">
              <div class="progress-fill" style="width: ${Math.min(d.offline_cache, 100)}%; background: ${d.offline_cache > 100 ? 'var(--warn)' : 'var(--accent)'}"></div>
            </div>
            <div class="device-actions">
              <button class="btn btn-outline btn-sm" onclick="showDeviceDetail('${d.id}')">查看详情</button>
              <button class="btn btn-primary btn-sm">远程重启</button>
            </div>
          </div>
        `).join("")}
      </div>

      <div class="grid" style="margin-top: 24px;">
        <div class="col-6">
          <div class="panel">
            <div class="panel-header">
              <h3 class="panel-title">告警分级响应</h3>
              <span class="badge badge-pending">${alarms.alarms.filter(a => a.status === 'pending').length} 待处理</span>
            </div>
            <div class="panel-body">
              <div class="alarm-list">
                ${alarms.alarms.map(a => `
                  <div class="alarm-item ${a.level}">
                    <div class="alarm-icon">
                      ${a.level === 'critical' 
                        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>'
                        : a.level === 'warning'
                        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>'
                        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
                      }
                    </div>
                    <div class="alarm-content">
                      <div class="alarm-title">${a.device_name} · ${a.message}</div>
                      <div class="alarm-desc">${a.device_location} · ${a.type}</div>
                      <div class="alarm-meta">
                        <span>${formatTimeAgo(a.created_at)}</span>
                        <span class="badge ${getStatusClass(a.status)}">${getStatusLabel(a.status)}</span>
                      </div>
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>
          </div>
        </div>

        <div class="col-6">
          <div class="panel">
            <div class="panel-header">
              <h3 class="panel-title">固件OTA升级</h3>
            </div>
            <div class="panel-body">
              <table class="table">
                <thead>
                  <tr>
                    <th>设备</th>
                    <th>当前版本</th>
                    <th>目标版本</th>
                    <th>进度</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  ${ota.ota_records.map(o => `
                    <tr>
                      <td>${o.device_name}</td>
                      <td>${o.current_version}</td>
                      <td>${o.version}</td>
                      <td style="width: 160px;">
                        <div class="progress-bar" style="margin-top: 0;">
                          <div class="progress-fill" style="width: ${o.progress}%"></div>
                        </div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">${o.progress}%</div>
                      </td>
                      <td><span class="badge ${getStatusClass(o.status)}">${getStatusLabel(o.status)}</span></td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  });
}

function filterDevices(status) {
  const cards = document.querySelectorAll("#deviceGrid .device-card");
  cards.forEach(card => {
    if (!status || card.dataset.status === status) {
      card.style.display = "";
    } else {
      card.style.display = "none";
    }
  });
}

function showModal(title, contentHtml, actionsHtml = "") {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3 class="modal-title">${title}</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="modal-body">${contentHtml}</div>
      ${actionsHtml ? `<div class="modal-footer">${actionsHtml}</div>` : ""}
    </div>
  `;
  overlay.addEventListener("click", e => {
    if (e.target === overlay) overlay.remove();
  });
  document.body.appendChild(overlay);
  return overlay;
}

function getActionLabel(action) {
  const map = {
    "create": "工单创建",
    "auto_assign": "自动派单",
    "accept": "维修接单",
    "arrive": "到达现场",
    "diagnose": "故障诊断",
    "repair": "维修作业",
    "test": "测试验收",
    "complete": "工单完成",
    "feedback": "业主评价",
    "assign": "工单派单",
    "response": "响应诉求",
    "process": "现场处理",
    "close": "工单关闭",
    "submit": "提交申请"
  };
  return map[action] || action;
}

function getActionIcon(action) {
  const map = {
    "create": "📝",
    "auto_assign": "🤖",
    "accept": "👷",
    "arrive": "📍",
    "diagnose": "🔍",
    "repair": "🔧",
    "test": "✅",
    "complete": "🏁",
    "feedback": "⭐",
    "assign": "📤",
    "response": "📢",
    "process": "🛠️",
    "close": "🔒",
    "submit": "📨"
  };
  return map[action] || "•";
}

function renderTimeline(logs) {
  if (!logs || logs.length === 0) {
    return `<div class="empty" style="padding: 24px;"><p>暂无流转记录</p></div>`;
  }
  return `
    <div class="timeline">
      ${logs.map((log, idx) => `
        <div class="timeline-item ${idx === logs.length - 1 ? 'last' : ''}">
          <div class="timeline-dot ${log.action === 'complete' || log.action === 'close' ? 'success' : log.action === 'create' || log.action === 'submit' ? 'primary' : log.action === 'auto_assign' || log.action === 'assign' ? 'info' : ''}">${getActionIcon(log.action)}</div>
          <div class="timeline-content">
            <div class="timeline-title">
              ${getActionLabel(log.action)}
            </div>
            <div class="timeline-meta">
              <span>操作人：${log.operator}</span>
              <span>${formatDate(log.created_at)}</span>
            </div>
            ${log.detail ? `<div class="timeline-desc">${log.detail}</div>` : ''}
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderStars(count, size = 16) {
  let html = "";
  for (let i = 1; i <= 5; i++) {
    html += `<span class="star ${i <= count ? 'on' : ''}" style="font-size: ${size}px;">★</span>`;
  }
  return html;
}

function showDashboardDetail() {
  showLoading();
  Promise.all([
    api("/api/dashboard"),
    api("/api/dashboard/detail")
  ]).then(([base, detail]) => {
    if (!base.ok || !detail.ok) {
      showError(base.error || detail.error || "加载失败");
      return;
    }
    const levelLabels = { critical: "严重", warning: "警告", info: "提示" };
    contentNode.innerHTML = `
      <div class="page-header">
        <h1>工作台首页</h1>
        <p>社区数字治理概览，可追溯各项业务处置状态</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-card-title">门禁设备</span>
            <div class="stat-icon accent">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
          </div>
          <div class="stat-card-value">${base.devices.total}</div>
          <div class="stat-card-sub">
            <span class="badge badge-online">在线 ${base.devices.online}</span>
            <span class="badge badge-warning" style="margin-left: 8px;">告警 ${base.devices.warning}</span>
            <span class="badge badge-offline" style="margin-left: 8px;">离线 ${base.devices.offline}</span>
          </div>
        </div>

        <div class="stat-card" onclick="window.location.hash='#/access/devices'" style="cursor: pointer;">
          <div class="stat-card-header">
            <span class="stat-card-title">设备告警</span>
            <div class="stat-icon danger">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
              </svg>
            </div>
          </div>
          <div class="stat-card-value">${base.alarms.total}</div>
          <div class="stat-card-sub">
            <span class="badge badge-pending">待处理 ${base.alarms.pending}</span>
            <span class="badge badge-critical" style="margin-left: 8px;">严重 ${base.alarms.critical}</span>
          </div>
        </div>

        <div class="stat-card" onclick="window.location.hash='#/repair'" style="cursor: pointer;">
          <div class="stat-card-header">
            <span class="stat-card-title">报修工单</span>
            <div class="stat-icon warn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
            </div>
          </div>
          <div class="stat-card-value">${base.repairs.total}</div>
          <div class="stat-card-sub">
            <span class="badge badge-pending">待处理 ${base.repairs.pending}</span>
            <span class="badge badge-processing" style="margin-left: 8px;">处理中 ${base.repairs.processing}</span>
          </div>
        </div>

        <div class="stat-card" onclick="window.location.hash='#/property'" style="cursor: pointer;">
          <div class="stat-card-header">
            <span class="stat-card-title">物业费收取</span>
            <div class="stat-icon success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
          </div>
          <div class="stat-card-value">¥${base.fees.paid_amount.toFixed(0)}</div>
          <div class="stat-card-sub">
            <span class="badge badge-unpaid">未缴 ${base.fees.unpaid}</span>
            <span class="badge badge-overdue" style="margin-left: 8px;">逾期 ${base.fees.overdue}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-card-title">邻里圈待审</span>
            <div class="stat-icon info">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
              </svg>
            </div>
          </div>
          <div class="stat-card-value">${base.posts.pending}</div>
          <div class="stat-card-sub">
            <span class="badge badge-pending">待审核</span>
          </div>
        </div>

        <div class="stat-card" onclick="window.location.hash='#/admin/complaints'" style="cursor: pointer;">
          <div class="stat-card-header">
            <span class="stat-card-title">业主诉求</span>
            <div class="stat-icon accent">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
              </svg>
            </div>
          </div>
          <div class="stat-card-value">${base.complaints.total}</div>
          <div class="stat-card-sub">
            <span class="badge badge-submitted">待响应 ${base.complaints.submitted}</span>
          </div>
        </div>
      </div>

      <div class="grid">
        <div class="col-6">
          <div class="panel">
            <div class="panel-header">
              <h3 class="panel-title">🚨 告警处置状态</h3>
              <a href="#/access/devices" class="btn btn-outline btn-sm">设备纳管</a>
            </div>
            <div class="panel-body" style="padding: 0;">
              ${detail.recent_alarms.length === 0 ? '<div class="empty" style="padding: 24px;"><p>暂无告警</p></div>' : `
              <div class="recent-list">
                ${detail.recent_alarms.map(a => `
                  <div class="list-item clickable" onclick="showDeviceDetail('${a.device_id}')">
                    <div class="alarm-icon" style="flex-shrink: 0; margin-right: 12px;">
                      ${a.level === 'critical' 
                        ? '<svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" style="width: 28px; height: 28px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>'
                        : a.level === 'warning'
                        ? '<svg viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" style="width: 28px; height: 28px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>'
                        : '<svg viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2" style="width: 28px; height: 28px;"><circle cx="12" cy="12" r="10"/></svg>'
                      }
                    </div>
                    <div class="list-item-content">
                      <div class="list-item-title">
                        ${a.device_name || a.device_id} · ${a.message}
                        <span class="badge badge-${a.level === 'critical' ? 'critical' : a.level === 'warning' ? 'warning' : 'info'}" style="margin-left: 8px;">${levelLabels[a.level] || a.level}</span>
                      </div>
                      <div class="list-item-desc">
                        ${a.type} · <span class="badge ${getStatusClass(a.status)}" style="font-size: 11px;">${getStatusLabel(a.status)}</span>
                      </div>
                      <div class="list-item-meta"><span>${formatTimeAgo(a.created_at)}</span></div>
                    </div>
                  </div>
                `).join("")}
              </div>`}
            </div>
          </div>
        </div>

        <div class="col-6">
          <div class="panel">
            <div class="panel-header">
              <h3 class="panel-title">🔧 报修工单处置</h3>
              <a href="#/repair" class="btn btn-outline btn-sm">全部工单</a>
            </div>
            <div class="panel-body" style="padding: 0;">
              ${detail.recent_repairs.length === 0 ? '<div class="empty" style="padding: 24px;"><p>暂无工单</p></div>' : `
              <div class="recent-list">
                ${detail.recent_repairs.map(r => `
                  <div class="list-item clickable" onclick="showRepairDetail('${r.id}')">
                    <div class="list-item-content">
                      <div class="list-item-title">
                        <strong>${r.title}</strong>
                        <span class="badge ${r.priority === 'high' ? 'badge-danger' : r.priority === 'medium' ? 'badge-warn' : 'badge-info'}" style="margin-left: 8px;">${getPriorityLabel(r.priority)}</span>
                      </div>
                      <div class="list-item-desc">${r.location} · ${r.reporter} · ${r.phone}</div>
                      <div class="list-item-meta">
                        <span class="badge ${getStatusClass(r.status)}" style="font-size: 11px;">${getStatusLabel(r.status)}</span>
                        <span>${formatTimeAgo(r.created_at)}</span>
                        ${r.assignee ? `<span>处理人：${r.assignee}</span>` : ''}
                      </div>
                    </div>
                  </div>
                `).join("")}
              </div>`}
            </div>
          </div>
        </div>
      </div>

      <div class="grid" style="margin-top: 24px;">
        <div class="col-6">
          <div class="panel">
            <div class="panel-header">
              <h3 class="panel-title">💰 物业费缴纳状态</h3>
              <a href="#/property" class="btn btn-outline btn-sm">收费管理</a>
            </div>
            <div class="panel-body" style="padding: 0;">
              ${detail.recent_fees.length === 0 ? '<div class="empty" style="padding: 24px;"><p>暂无缴费记录</p></div>' : `
              <table class="table" style="border: none;">
                <thead>
                  <tr>
                    <th>业主</th>
                    <th>房间</th>
                    <th>账期</th>
                    <th>金额</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  ${detail.recent_fees.map(f => `
                    <tr>
                      <td><strong>${f.owner}</strong></td>
                      <td>${f.room}</td>
                      <td>${f.period}</td>
                      <td style="font-weight: 600;">¥${f.amount.toFixed(2)}</td>
                      <td><span class="badge ${getStatusClass(f.status)}">${getStatusLabel(f.status)}</span></td>
                      <td>
                        ${f.status === 'paid' 
                          ? `<button class="btn btn-outline btn-sm" onclick="showFeeDetail(${f.id})">票据</button>`
                          : `<button class="btn btn-outline btn-sm" onclick="showFeeDetail(${f.id})">催缴</button>`
                        }
                      </td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>`}
            </div>
          </div>
        </div>

        <div class="col-6">
          <div class="panel">
            <div class="panel-header">
              <h3 class="panel-title">📢 诉求处置流转</h3>
              <a href="#/admin/complaints" class="btn btn-outline btn-sm">诉求管理</a>
            </div>
            <div class="panel-body" style="padding: 0;">
              ${detail.complaint_logs.length === 0 ? '<div class="empty" style="padding: 24px;"><p>暂无流转记录</p></div>' : `
              <div class="recent-list" style="max-height: 360px; overflow-y: auto;">
                ${detail.complaint_logs.slice(0, 8).map(c => `
                  <div class="list-item clickable" onclick="showComplaintDetail('${c.complaint_id}')">
                    <div class="timeline-dot" style="flex-shrink: 0; margin-right: 12px; background: var(--accent); color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px;">
                      ${getActionIcon(c.action)}
                    </div>
                    <div class="list-item-content">
                      <div class="list-item-title">
                        ${getActionLabel(c.action)} · <strong style="color: var(--accent);">${c.complaint_title || c.complaint_id}</strong>
                      </div>
                      <div class="list-item-desc">${c.detail}</div>
                      <div class="list-item-meta">
                        <span>操作人：${c.operator}</span>
                        <span>${formatTimeAgo(c.created_at)}</span>
                      </div>
                    </div>
                  </div>
                `).join("")}
              </div>`}
            </div>
          </div>
        </div>
      </div>

      <div class="panel" style="margin-top: 24px;">
        <div class="panel-header">
          <h3 class="panel-title">🚪 最近通行记录</h3>
          <a href="#/access" class="btn btn-outline btn-sm">查看全部</a>
        </div>
        <div class="panel-body" style="padding: 0;">
          <div class="recent-list">
            ${base.recent_access.map(record => `
              <div class="list-item">
                <div class="list-item-content">
                  <div class="list-item-title">
                    ${record.user_name} · ${getMethodLabel(record.method)}
                    <span class="badge ${record.status === 'success' ? 'badge-approved' : 'badge-rejected'}" style="margin-left: 8px;">
                      ${record.status === 'success' ? '成功' : '失败'}
                    </span>
                  </div>
                  <div class="list-item-desc">${record.device_name || record.device_id}</div>
                  <div class="list-item-meta">
                    <span>${formatTimeAgo(record.created_at)}</span>
                  </div>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `;
  });
}

function showDeviceDetail(deviceId) {
  const loading = showModal("设备详情", `<div class="loading"><div class="spinner"></div><p>加载中...</p></div>`);
  api(`/api/access/devices/${deviceId}`).then(data => {
    loading.remove();
    if (!data.ok) {
      showModal("加载失败", `<p>${data.error}</p>`);
      return;
    }
    const d = data.device;
    const inspectionLabels = { daily: "日检", weekly: "周检", monthly: "月检", fault: "故障复查" };
    const stageLabels = { download: "下载固件", verify: "校验完整性", backup: "备份配置", flash: "刷写固件", reboot: "设备重启", verify_version: "版本验证" };
    const content = `
      <div style="display: grid; gap: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div>
            <h3 style="margin: 0 0 4px; font-size: 18px;">${d.name}</h3>
            <p style="margin: 0; color: var(--text-muted);">${d.id} · ${d.location} · ${d.type === 'gate' ? '大门' : '单元门'}</p>
          </div>
          <span class="badge ${getStatusClass(d.status)}" style="font-size: 13px;">${getStatusLabel(d.status)}</span>
        </div>

        <div class="stats-summary" style="grid-template-columns: repeat(4, 1fr);">
          <div class="summary-card"><div class="summary-label">固件版本</div><div class="summary-value">${d.firmware_version}</div></div>
          <div class="summary-card"><div class="summary-label">最后心跳</div><div class="summary-value" style="font-size: 14px;">${formatTimeAgo(d.last_heartbeat)}</div></div>
          <div class="summary-card"><div class="summary-label">离线缓存</div><div class="summary-value">${d.offline_cache}<span class="summary-unit">条</span></div></div>
          <div class="summary-card"><div class="summary-label">创建时间</div><div class="summary-value" style="font-size: 14px;">${formatDate(d.created_at).slice(0, 10)}</div></div>
        </div>

        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <span class="feature-tag ${d.has_bluetooth ? 'on' : 'off'}">蓝牙 ${d.has_bluetooth ? '✓' : '✗'}</span>
          <span class="feature-tag ${d.has_nfc ? 'on' : 'off'}">NFC ${d.has_nfc ? '✓' : '✗'}</span>
          <span class="feature-tag ${d.has_qr ? 'on' : 'off'}">二维码 ${d.has_qr ? '✓' : '✗'}</span>
          <span class="feature-tag ${d.has_face ? 'on' : 'off'}">人脸识别 ${d.has_face ? '✓' : '✗'}</span>
        </div>

        <div>
          <h4 style="margin: 0 0 12px; color: var(--text-secondary); font-size: 15px;">🔍 设备复查记录</h4>
          ${data.inspections.length === 0 ? '<div class="empty" style="padding: 16px;"><p>暂无复查记录</p></div>' : `
          <table class="table" style="border: 1px solid var(--border); border-radius: 8px; overflow: hidden;">
            <thead>
              <tr>
                <th>类型</th>
                <th>检查人</th>
                <th>发现与处理</th>
                <th>状态</th>
                <th>时间</th>
              </tr>
            </thead>
            <tbody>
              ${data.inspections.map(i => `
                <tr>
                  <td><span class="badge badge-info">${inspectionLabels[i.inspection_type] || i.inspection_type}</span></td>
                  <td>${i.inspector}</td>
                  <td style="max-width: 300px;">${i.findings}</td>
                  <td><span class="badge ${i.status === 'normal' ? 'badge-approved' : i.status === 'warning' ? 'badge-warn' : i.status === 'processing' ? 'badge-processing' : 'badge-completed'}">${i.status === 'normal' ? '正常' : i.status === 'warning' ? '注意' : i.status === 'processing' ? '处理中' : '已解决'}</span></td>
                  <td>${formatTimeAgo(i.created_at)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>`}
        </div>

        <div>
          <h4 style="margin: 0 0 12px; color: var(--text-secondary); font-size: 15px;">⚠️ 告警与处置责任人</h4>
          ${data.alarms.length === 0 ? '<div class="empty" style="padding: 16px;"><p>暂无告警记录</p></div>' : `
          ${data.alarms.map(a => `
            <div class="alarm-item ${a.level}" style="margin-bottom: 12px;">
              <div class="alarm-content" style="flex: 1;">
                <div class="alarm-title">${a.message} <span class="badge badge-${a.level === 'critical' ? 'critical' : a.level === 'warning' ? 'warning' : 'info'}">${a.level === 'critical' ? '严重' : a.level === 'warning' ? '警告' : '提示'}</span></div>
                <div class="alarm-meta"><span>${formatTimeAgo(a.created_at)}</span><span class="badge ${getStatusClass(a.status)}">${getStatusLabel(a.status)}</span></div>
              </div>
            </div>
            ${data.dispatches.filter(dp => dp.alarm_id === a.id).length > 0 ? `
            <div style="margin: 0 0 16px 44px; padding: 12px 16px; background: var(--bg-secondary); border-radius: 8px;">
              <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 8px;">处置过程：</div>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                ${data.dispatches.filter(dp => dp.alarm_id === a.id).map(dp => `
                  <div style="display: flex; align-items: start; gap: 8px; font-size: 13px;">
                    <span style="color: var(--accent); font-weight: 600;">•</span>
                    <div>
                      <strong>${dp.handler}</strong> · ${dp.action}
                      <span class="badge ${getStatusClass(dp.status)}" style="font-size: 11px; margin: 0 6px;">${getStatusLabel(dp.status)}</span>
                      <div style="color: var(--text-muted); margin-top: 2px;">${dp.result || dp.action} · ${formatTimeAgo(dp.assigned_at)}</div>
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>` : ''}
          `).join("")}`}
        </div>

        <div>
          <h4 style="margin: 0 0 12px; color: var(--text-secondary); font-size: 15px;">📡 固件OTA升级过程</h4>
          ${data.ota_records.length === 0 ? '<div class="empty" style="padding: 16px;"><p>暂无升级记录</p></div>' : `
          ${data.ota_records.map(o => `
            <div style="padding: 12px 16px; background: var(--bg-secondary); border-radius: 8px; margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <strong>${o.current_version} → ${o.version}</strong>
                <span class="badge ${getStatusClass(o.status)}">${getStatusLabel(o.status)}</span>
              </div>
              <div class="progress-bar" style="margin: 8px 0;">
                <div class="progress-fill" style="width: ${o.progress}%;"></div>
              </div>
              <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">进度：${o.progress}% · 开始于 ${formatDate(o.created_at)}</div>
              ${data.ota_progress.filter(op => op.ota_id === o.id).length > 0 ? `
              <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border);">
                ${data.ota_progress.filter(op => op.ota_id === o.id).map(op => `
                  <div style="display: flex; gap: 8px; font-size: 12px; align-items: center;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2" style="width: 14px; height: 14px; flex-shrink: 0;"><polyline points="20,6 9,17 4,12"/></svg>
                    <div>
                      <strong>${stageLabels[op.stage] || op.stage}</strong>：${op.detail}
                      <span style="color: var(--text-muted);"> · ${formatTimeAgo(op.created_at)}</span>
                    </div>
                  </div>
                `).join("")}
              </div>` : ''}
            </div>
          `).join("")}`}
        </div>
      </div>
    `;
    showModal(`${d.name} - 设备详情`, content);
  });
}

function showRepairDetail(orderId) {
  const loading = showModal("工单详情", `<div class="loading"><div class="spinner"></div><p>加载中...</p></div>`);
  api(`/api/repair/detail/${orderId}`).then(data => {
    loading.remove();
    if (!data.ok) {
      showModal("加载失败", `<p>${data.error}</p>`);
      return;
    }
    const o = data.order;
    const logs = data.logs || [];
    const photos = data.photos || [];
    const feedback = data.feedback;
    const typeLabels = { equipment: "设备故障", plumbing: "水电维修", public_facility: "公共设施", access_control: "门禁系统" };
    const photoLabels = { report: "📷 报修拍照", process: "🔧 维修过程", done: "✅ 维修完成" };

    let responseTime = "-";
    let handleTime = "-";
    let totalTime = "-";
    if (logs.length >= 2) {
      const createLog = logs.find(l => l.action === "create");
      const acceptLog = logs.find(l => l.action === "accept" || l.action === "auto_assign");
      const completeLog = logs.find(l => l.action === "complete" || l.action === "feedback");
      if (createLog && acceptLog) {
        const diff = Math.round((new Date(acceptLog.created_at) - new Date(createLog.created_at)) / 60000);
        responseTime = diff + " 分钟";
      }
      if (acceptLog && completeLog) {
        const diff = Math.round((new Date(completeLog.created_at) - new Date(acceptLog.created_at)) / 3600000);
        handleTime = diff + " 小时";
      }
      if (createLog && completeLog) {
        const diff = Math.round((new Date(completeLog.created_at) - new Date(createLog.created_at)) / 3600000);
        totalTime = diff + " 小时";
      }
    }

    const content = `
      <div style="display: grid; gap: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div>
            <h3 style="margin: 0 0 4px; font-size: 18px;">${o.title}</h3>
            <p style="margin: 0; color: var(--text-muted); font-size: 13px;">工单号：<code style="font-size: 12px;">${o.id}</code></p>
          </div>
          <span class="badge ${getStatusClass(o.status)}" style="font-size: 13px;">${getStatusLabel(o.status)}</span>
        </div>

        <div class="stats-summary" style="grid-template-columns: repeat(4, 1fr);">
          <div class="summary-card"><div class="summary-label">报修人</div><div class="summary-value" style="font-size: 14px;">${o.reporter}</div></div>
          <div class="summary-card"><div class="summary-label">联系电话</div><div class="summary-value" style="font-size: 14px;">${o.phone}</div></div>
          <div class="summary-card"><div class="summary-label">位置</div><div class="summary-value" style="font-size: 14px;">${o.location}</div></div>
          <div class="summary-card"><div class="summary-label">处理人</div><div class="summary-value" style="font-size: 14px;">${o.assignee || '-'}</div></div>
        </div>

        <div class="stats-summary" style="grid-template-columns: repeat(3, 1fr);">
          <div class="summary-card"><div class="summary-label">⏱️ 响应时间</div><div class="summary-value" style="font-size: 14px; color: var(--accent);">${responseTime}</div></div>
          <div class="summary-card"><div class="summary-label">🔧 维修时长</div><div class="summary-value" style="font-size: 14px; color: var(--success);">${handleTime}</div></div>
          <div class="summary-card"><div class="summary-label">📊 总耗时</div><div class="summary-value" style="font-size: 14px; color: var(--warn);">${totalTime}</div></div>
        </div>

        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <span class="badge badge-info">${typeLabels[o.type] || o.type}</span>
          <span class="badge ${o.priority === 'high' ? 'badge-danger' : o.priority === 'medium' ? 'badge-warn' : 'badge-info'}">优先级：${getPriorityLabel(o.priority)}</span>
          <span class="badge badge-pending">创建：${formatTimeAgo(o.created_at)}</span>
          ${o.updated_at !== o.created_at ? `<span class="badge badge-processing">更新：${formatTimeAgo(o.updated_at)}</span>` : ''}
        </div>

        <div class="info-card">
          <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 6px; font-weight: 600;">📝 问题描述</div>
          <div style="line-height: 1.7; color: var(--text-primary); font-size: 14px;">${o.description}</div>
        </div>

        <div>
          <h4 style="margin: 0 0 10px; color: var(--text-secondary); font-size: 14px; font-weight: 600;">📸 照片凭证 <span style="font-weight: 400; color: var(--text-muted);">(${photos.length}张)</span></h4>
          ${photos.length === 0 ? '<div class="empty" style="padding: 20px; background: var(--bg-secondary); border-radius: 8px;"><p style="margin: 0; color: var(--text-muted); font-size: 13px;">暂无照片凭证</p></div>' : `
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px;">
            ${photos.map(p => `
              <div class="photo-card">
                <div class="photo-img">
                  ${photoLabels[p.photo_type] ? photoLabels[p.photo_type].split(' ')[0] : '🖼️'}
                </div>
                <div class="photo-info">
                  <div class="photo-type">${photoLabels[p.photo_type] || p.photo_type}</div>
                  <div class="photo-meta">${p.uploaded_by} · ${formatTimeAgo(p.created_at)}</div>
                </div>
              </div>
            `).join("")}
          </div>`}
        </div>

        <div>
          <h4 style="margin: 0 0 10px; color: var(--text-secondary); font-size: 14px; font-weight: 600;">🔄 工单流转 <span style="font-weight: 400; color: var(--text-muted);">(${logs.length}条记录)</span></h4>
          ${renderTimeline(logs)}
        </div>

        ${feedback ? `
        <div>
          <h4 style="margin: 0 0 10px; color: var(--text-secondary); font-size: 14px; font-weight: 600;">⭐ 业主评价</h4>
          <div class="feedback-card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;">
              <div style="display: flex; gap: 16px; flex-wrap: wrap;">
                <div class="rating-item"><span class="rating-label">响应及时</span>${renderStars(feedback.timeliness, 16)}</div>
                <div class="rating-item"><span class="rating-label">服务态度</span>${renderStars(feedback.attitude, 16)}</div>
                <div class="rating-item"><span class="rating-label">维修质量</span>${renderStars(feedback.quality, 16)}</div>
                <div class="rating-item"><span class="rating-label">综合满意</span>${renderStars(feedback.satisfaction, 16)}</div>
              </div>
              <div style="font-size: 12px; color: var(--text-muted);">${formatTimeAgo(feedback.created_at)}</div>
            </div>
            ${feedback.comment ? `<div style="line-height: 1.7; color: var(--text-secondary); font-size: 13px; font-style: italic;">"${feedback.comment}"</div>` : ''}
          </div>
        </div>` : `
        <div>
          <h4 style="margin: 0 0 10px; color: var(--text-secondary); font-size: 14px; font-weight: 600;">⭐ 业主评价</h4>
          <div class="empty" style="padding: 20px; background: var(--bg-secondary); border-radius: 8px;"><p style="margin: 0; color: var(--text-muted); font-size: 13px;">工单完成后业主可进行评价</p></div>
        </div>`}
      </div>
    `;

    let actionButtons = [];
    if (o.status === 'pending') {
      actionButtons.push('<button class="btn btn-primary" onclick="simulateRepairAction(\'' + orderId + '\', \'auto_assign\')">🤖 自动派单</button>');
    }
    if (o.status === 'processing') {
      actionButtons.push('<button class="btn btn-success" onclick="simulateRepairAction(\'' + orderId + '\', \'complete\')">✅ 标记完成</button>');
    }
    actionButtons.push('<button class="btn btn-outline" onclick="this.closest(\'.modal-overlay\').remove()">关闭</button>');
    const actions = actionButtons.join("");

    showModal(`${o.title} - 工单详情`, content, actions);
  });
}

function simulateRepairAction(orderId, action) {
  showToast(`正在${action === 'auto_assign' ? '自动派单' : '完成工单'}...`, "info");
  setTimeout(() => {
    showToast(action === 'auto_assign' ? '派单成功，维修人员已接单' : '工单已完成，待业主评价', "success");
    showRepairDetail(orderId);
  }, 800);
}

function showFeeDetail(feeId) {
  const loading = showModal("缴费详情", `<div class="loading"><div class="spinner"></div><p>加载中...</p></div>`);
  api(`/api/property/fees/${feeId}`).then(data => {
    loading.remove();
    if (!data.ok) {
      showModal("加载失败", `<p>${data.error}</p>`);
      return;
    }
    const f = data.fee;
    const methodLabels = { wechat: "微信支付", alipay: "支付宝", bank_transfer: "银行转账" };
    const content = `
      <div style="display: grid; gap: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div>
            <h3 style="margin: 0 0 4px; font-size: 18px;">${f.owner} - 物业费</h3>
            <p style="margin: 0; color: var(--text-muted);">${f.room} · ${f.period} 账期</p>
          </div>
          <span class="badge ${getStatusClass(f.status)}" style="font-size: 13px;">${getStatusLabel(f.status)}</span>
        </div>

        <div class="stats-summary" style="grid-template-columns: repeat(3, 1fr);">
          <div class="summary-card"><div class="summary-label">应收金额</div><div class="summary-value">¥${f.amount.toFixed(2)}</div></div>
          <div class="summary-card"><div class="summary-label">状态</div><div class="summary-value" style="font-size: 14px;">${getStatusLabel(f.status)}</div></div>
          <div class="summary-card"><div class="summary-label">票据号</div><div class="summary-value" style="font-size: 14px;">${f.invoice_no || '-'}</div></div>
        </div>

        ${data.invoice ? `
        <div style="padding: 16px; background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 1px solid #86efac; border-radius: 8px;">
          <div style="font-size: 14px; font-weight: 600; margin-bottom: 12px; color: var(--success);">📄 电子票据信息</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; font-size: 13px;">
            <div><span style="color: var(--text-muted);">发票代码：</span><strong>${data.invoice.invoice_code}</strong></div>
            <div><span style="color: var(--text-muted);">发票号码：</span><strong>${data.invoice.invoice_number}</strong></div>
            <div><span style="color: var(--text-muted);">开票金额：</span><strong style="color: var(--accent);">¥${data.invoice.amount.toFixed(2)}</strong></div>
            <div><span style="color: var(--text-muted);">开票时间：</span>${formatDate(data.invoice.created_at)}</div>
          </div>
        </div>` : ''}

        <div>
          <h4 style="margin: 0 0 12px; color: var(--text-secondary); font-size: 15px;">💰 支付记录</h4>
          ${data.payments.length === 0 ? `
          <div style="padding: 24px; background: #fef2f2; border: 1px dashed #fecaca; border-radius: 8px; text-align: center; color: var(--danger);">
            ⚠️ 尚未支付，请尽快缴纳 ${f.period} 账期物业费
          </div>` : `
          <table class="table" style="border: 1px solid var(--border); border-radius: 8px; overflow: hidden;">
            <thead>
              <tr>
                <th>支付方式</th>
                <th>交易流水号</th>
                <th>支付金额</th>
                <th>支付人</th>
                <th>支付时间</th>
              </tr>
            </thead>
            <tbody>
              ${data.payments.map(p => `
                <tr>
                  <td><span class="badge badge-info">${methodLabels[p.payment_method] || p.payment_method}</span></td>
                  <td><code style="font-size: 12px;">${p.transaction_id}</code></td>
                  <td style="font-weight: 600; color: var(--success);">¥${p.amount.toFixed(2)}</td>
                  <td>${p.payer}</td>
                  <td>${formatDate(p.paid_at)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>`}
        </div>
      </div>
    `;
    const actions = `
      ${f.status === 'unpaid' ? '<button class="btn btn-primary">发送催缴通知</button>' : ''}
      ${data.invoice ? '<button class="btn btn-outline">下载电子发票</button>' : ''}
      <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">关闭</button>
    `;
    showModal(`${f.owner} 缴费详情`, content, actions);
  });
}

function showComplaintDetail(ticketId) {
  const loading = showModal("诉求详情", `<div class="loading"><div class="spinner"></div><p>加载中...</p></div>`);
  api(`/api/admin/complaints/${ticketId}`).then(data => {
    loading.remove();
    if (!data.ok) {
      showModal("加载失败", `<p>${data.error}</p>`);
      return;
    }
    const t = data.ticket;
    const typeLabels = { noise: "噪音扰民", sanitation: "环境卫生", parking: "停车管理", security: "安全问题", greening: "绿化维护" };
    const content = `
      <div style="display: grid; gap: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div>
            <h3 style="margin: 0 0 4px; font-size: 18px;">${t.title}</h3>
            <p style="margin: 0; color: var(--text-muted);">工单号：<code>${t.id}</code></p>
          </div>
          <span class="badge ${getStatusClass(t.status)}" style="font-size: 13px;">${getStatusLabel(t.status)}</span>
        </div>

        <div class="stats-summary" style="grid-template-columns: repeat(4, 1fr);">
          <div class="summary-card"><div class="summary-label">诉求人</div><div class="summary-value" style="font-size: 14px;">${t.owner}</div></div>
          <div class="summary-card"><div class="summary-label">联系电话</div><div class="summary-value" style="font-size: 14px;">${t.phone}</div></div>
          <div class="summary-card"><div class="summary-label">响应时间</div><div class="summary-value" style="font-size: 14px;">${t.response_time ? t.response_time + ' 分钟' : '-'}</div></div>
          <div class="summary-card"><div class="summary-label">提交时间</div><div class="summary-value" style="font-size: 14px;">${formatTimeAgo(t.created_at).slice(0, 6)}</div></div>
        </div>

        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
          <span class="badge badge-info">${typeLabels[t.type] || t.type}</span>
          ${t.responded_at ? `<span class="badge badge-processing">响应：${formatTimeAgo(t.responded_at)}</span>` : ''}
          ${t.closed_at ? `<span class="badge badge-completed">关闭：${formatTimeAgo(t.closed_at)}</span>` : ''}
        </div>

        <div style="padding: 16px; background: var(--bg-secondary); border-radius: 8px;">
          <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 8px;">📝 诉求详情</div>
          <div style="line-height: 1.7; color: var(--text-primary);">${t.description}</div>
        </div>

        <div>
          <h4 style="margin: 0 0 12px; color: var(--text-secondary); font-size: 15px;">🔄 处置流转</h4>
          ${renderTimeline(data.logs)}
        </div>
      </div>
    `;
    const actions = `
      ${t.status === 'submitted' ? '<button class="btn btn-primary">受理诉求</button>' : ''}
      ${t.status === 'processing' ? '<button class="btn btn-success">关闭工单</button>' : ''}
      <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">关闭</button>
    `;
    showModal(`${t.title} - 诉求详情`, content, actions);
  });
}

function showQrVisitorFlow() {
  const deviceMap = {
    "DEV-001": "南门主入口",
    "DEV-002": "北门出入口",
    "DEV-003": "1号楼单元门",
    "DEV-004": "2号楼单元门",
    "DEV-005": "3号楼单元门",
    "DEV-006": "车库入口"
  };
  const content = `
    <div style="display: grid; gap: 20px;">
      <div class="qr-steps">
        <div class="qr-step active" data-step="1">
          <div class="qr-step-num">1</div>
          <div class="qr-step-label">填写申请</div>
        </div>
        <div class="qr-step-line"></div>
        <div class="qr-step" data-step="2">
          <div class="qr-step-num">2</div>
          <div class="qr-step-label">业主授权</div>
        </div>
        <div class="qr-step-line"></div>
        <div class="qr-step" data-step="3">
          <div class="qr-step-num">3</div>
          <div class="qr-step-label">生成二维码</div>
        </div>
        <div class="qr-step-line"></div>
        <div class="qr-step" data-step="4">
          <div class="qr-step-num">4</div>
          <div class="qr-step-label">扫码通行</div>
        </div>
      </div>

      <div style="text-align: center; padding: 8px 16px 16px;">
        <div id="qrStep1" style="display: block;">
          <h3 style="margin: 0 0 8px; font-size: 18px;">📱 访客扫码申请</h3>
          <p style="color: var(--text-muted); margin-bottom: 16px; font-size: 13px;">请访客填写信息，生成临时通行二维码</p>
          <div style="max-width: 400px; margin: 0 auto; text-align: left;">
            <div class="form-card">
              <div class="form-group">
                <label class="form-label">访客姓名 <span style="color: var(--danger)">*</span></label>
                <input id="visitorName" type="text" class="form-input" placeholder="请输入访客姓名"/>
              </div>
              <div class="form-group">
                <label class="form-label">访客电话 <span style="color: var(--danger)">*</span></label>
                <input id="visitorPhone" type="tel" class="form-input" placeholder="请输入访客手机号"/>
              </div>
              <div class="form-group">
                <label class="form-label">拜访业主</label>
                <select id="hostSelect" class="form-select">
                  <option value="张三|1号楼1单元101|DEV-001|南门主入口">张三 - 1号楼1单元101（南门主入口）</option>
                  <option value="李四|1号楼1单元102|DEV-003|1号楼单元门">李四 - 1号楼1单元102（1号楼单元门）</option>
                  <option value="王五|2号楼1单元301|DEV-001|南门主入口">王五 - 2号楼1单元301（南门主入口）</option>
                  <option value="赵六|2号楼2单元502|DEV-004|2号楼单元门">赵六 - 2号楼2单元502（2号楼单元门）</option>
                  <option value="陈七|3号楼1单元801|DEV-005|3号楼单元门">陈七 - 3号楼1单元801（3号楼单元门）</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">有效时长</label>
                <select id="validHours" class="form-select">
                  <option value="2">2小时</option>
                  <option value="4">4小时</option>
                  <option value="8">8小时</option>
                  <option value="24">24小时</option>
                </select>
              </div>
            </div>
            <button class="btn btn-primary btn-block" onclick="submitVisitorQr()">📨 提交申请</button>
          </div>
        </div>

        <div id="qrStep2" style="display: none;">
          <div class="info-card info-success">
            <div class="info-card-icon">✓</div>
            <div class="info-card-content">
              <div class="info-card-title">申请已提交</div>
              <div class="info-card-desc">等待业主授权确认，一般1-3分钟内完成</div>
            </div>
          </div>
          <div style="max-width: 460px; margin: 0 auto; text-align: left;">
            <div class="info-card" style="margin-top: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <strong>访客通行凭证</strong>
                <span id="qrToken" class="badge badge-info" style="font-family: monospace;">QR-xxx</span>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px 16px; font-size: 13px;">
                <div><span style="color: var(--text-muted);">访客姓名：</span><strong id="dVisitorName">-</strong></div>
                <div><span style="color: var(--text-muted);">联系电话：</span><strong id="dVisitorPhone">-</strong></div>
                <div><span style="color: var(--text-muted);">被访业主：</span><strong id="dHostName">-</strong></div>
                <div><span style="color: var(--text-muted);">房间号：</span><strong id="dHostRoom">-</strong></div>
                <div><span style="color: var(--text-muted);">通行设备：</span><strong id="dDeviceName">-</strong></div>
                <div><span style="color: var(--text-muted);">有效时长：</span><strong id="dValid">-</strong></div>
              </div>
              <div style="margin-top: 16px; padding: 12px; background: var(--bg-secondary); border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">
                  <span>授权进度</span>
                  <span id="progressText">30%</span>
                </div>
                <div style="width: 100%; height: 8px; background: var(--border); border-radius: 4px; overflow: hidden;">
                  <div id="progressBar" style="width: 30%; height: 100%; background: linear-gradient(90deg, var(--accent), var(--success)); transition: width 0.5s;"></div>
                </div>
              </div>
              <div class="action-row" style="margin-top: 16px;">
                <button class="btn btn-success" onclick="approveQr()">✅ 模拟业主授权</button>
                <button class="btn btn-outline" onclick="rejectQr()">❌ 拒绝申请</button>
              </div>
            </div>
          </div>
        </div>

        <div id="qrStep3" style="display: none;">
          <div class="info-card info-warn">
            <div class="info-card-icon">⏱️</div>
            <div class="info-card-content">
              <div class="info-card-title">业主已授权</div>
              <div class="info-card-desc">请访客到指定门禁设备扫码通行</div>
            </div>
          </div>
          <div style="max-width: 340px; margin: 16px auto 0;">
            <div class="qr-code-wrap">
              <div class="qr-code">
                <div class="qr-pattern"></div>
                <div class="qr-center">
                  <div class="qr-center-text">扫码通行</div>
                  <div class="qr-center-token" id="qrToken3">QR-xxx</div>
                </div>
              </div>
            </div>
            <div style="text-align: center; margin: 16px 0;">
              <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 4px;">二维码有效期至</div>
              <div id="qrExpire" style="font-weight: 600; color: var(--text-primary);">-</div>
            </div>
            <div class="info-card" style="margin-bottom: 16px;">
              <div style="display: grid; gap: 6px; font-size: 13px;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--text-muted);">通行设备：</span>
                  <strong id="dDeviceName3">-</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--text-muted);">被访业主：</span>
                  <strong id="dHostName3">-</strong>
                </div>
              </div>
            </div>
            <button class="btn btn-primary btn-block" onclick="scanAndOpen()">📸 模拟访客扫码开门</button>
          </div>
        </div>

        <div id="qrStep4" style="display: none;">
          <div class="result-card result-success">
            <div class="result-icon">✓</div>
            <h3 class="result-title">开门成功！</h3>
            <p class="result-desc">访客已成功通过二维码验证通行</p>
          </div>
          <div style="max-width: 400px; margin: 16px auto 0; text-align: left;">
            <div class="info-card">
              <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 10px; font-weight: 600;">📋 通行结果明细</div>
              <div style="display: grid; gap: 8px; font-size: 13px;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--text-muted);">通行凭证：</span>
                  <strong id="resToken">-</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--text-muted);">通行设备：</span>
                  <strong id="resDevice">-</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--text-muted);">通行人：</span>
                  <strong id="resVisitor">-</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--text-muted);">被访业主：</span>
                  <strong id="resHost">-</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--text-muted);">验证结果：</span>
                  <span class="badge badge-approved">验证通过</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--text-muted);">通行时间：</span>
                  <strong id="resTime">-</strong>
                </div>
              </div>
            </div>
            <div class="action-row" style="margin-top: 16px;">
              <button class="btn btn-outline" onclick="restartQrFlow()">🔄 重新申请</button>
              <button class="btn btn-primary" onclick="viewVisitorRecords()">📋 查看通行记录</button>
            </div>
          </div>
        </div>
      </div>
    `;
  const actions = `
    <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">关闭</button>
  `;
  showModal("访客二维码通行 - 全流程闭环", content, actions);
  setTimeout(() => setQrStep(1), 50);
}

let qrData = {};

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 10);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

function setQrStep(step) {
  document.querySelectorAll(".qr-step").forEach((el, idx) => {
    const num = idx + 1;
    if (num < step) {
      el.classList.add("done");
      el.classList.remove("active");
    } else if (num === step) {
      el.classList.add("active");
      el.classList.remove("done");
    } else {
      el.classList.remove("active", "done");
    }
  });
}

function submitVisitorQr() {
  const name = document.getElementById("visitorName").value.trim();
  const phone = document.getElementById("visitorPhone").value.trim();
  const host = document.getElementById("hostSelect").value;
  const hours = parseInt(document.getElementById("validHours").value);
  if (!name) {
    showToast("请填写访客姓名", "error");
    return;
  }
  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    showToast("请填写正确的手机号", "error");
    return;
  }
  const [hostName, hostRoom, deviceId, deviceName] = host.split("|");
  const token = "QR-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + Math.floor(Math.random() * 900 + 100);
  const now = new Date();
  const validFrom = now.toISOString();
  const validUntil = new Date(now.getTime() + hours * 3600 * 1000).toISOString();
  qrData = { name, phone, hostName, hostRoom, deviceId, deviceName, token, hours, validFrom, validUntil };
  document.getElementById("qrStep1").style.display = "none";
  document.getElementById("qrStep2").style.display = "block";
  document.getElementById("dVisitorName").textContent = name;
  document.getElementById("dVisitorPhone").textContent = phone;
  document.getElementById("dHostName").textContent = hostName;
  document.getElementById("dHostRoom").textContent = hostRoom;
  document.getElementById("dDeviceName").textContent = deviceName;
  document.getElementById("dValid").textContent = hours + " 小时";
  document.getElementById("qrToken").textContent = token;
  setQrStep(2);
  showToast("申请已提交，请等待业主授权", "success");
  setTimeout(() => {
    const bar = document.getElementById("progressBar");
    const txt = document.getElementById("progressText");
    if (bar) bar.style.width = "65%";
    if (txt) txt.textContent = "65%";
  }, 600);
  setTimeout(() => {
    const bar = document.getElementById("progressBar");
    const txt = document.getElementById("progressText");
    if (bar) bar.style.width = "85%";
    if (txt) txt.textContent = "85%";
  }, 1200);
}

function approveQr() {
  const bar = document.getElementById("progressBar");
  const txt = document.getElementById("progressText");
  if (bar) bar.style.width = "100%";
  if (txt) txt.textContent = "100%";
  showToast("业主授权成功", "success");
  setTimeout(() => {
    document.getElementById("qrStep2").style.display = "none";
    document.getElementById("qrStep3").style.display = "block";
    document.getElementById("qrToken3").textContent = qrData.token;
    document.getElementById("dDeviceName3").textContent = qrData.deviceName;
    document.getElementById("dHostName3").textContent = qrData.hostName;
    const expire = new Date(Date.now() + qrData.hours * 3600 * 1000);
    document.getElementById("qrExpire").textContent = expire.toLocaleString("zh-CN");
    setQrStep(3);
  }, 700);
}

function rejectQr() {
  qrData.status = "rejected";
  showToast("业主已拒绝此访客申请", "error");
  setTimeout(() => {
    document.getElementById("qrStep2").style.display = "none";
    document.getElementById("qrStep1").style.display = "block";
    setQrStep(1);
  }, 500);
}

function scanAndOpen() {
  showToast("正在验证二维码...", "info");
  setTimeout(() => {
    document.getElementById("qrStep3").style.display = "none";
    document.getElementById("qrStep4").style.display = "block";
    document.getElementById("resToken").textContent = qrData.token;
    document.getElementById("resDevice").textContent = qrData.deviceName;
    document.getElementById("resVisitor").textContent = qrData.name;
    document.getElementById("resHost").textContent = qrData.hostName + " (" + qrData.hostRoom + ")";
    document.getElementById("resTime").textContent = new Date().toLocaleString("zh-CN");
    setQrStep(4);
    showToast("开门成功，访客已通行", "success");
  }, 800);
}

function restartQrFlow() {
  document.querySelectorAll(".modal-overlay").forEach(m => m.remove());
  qrData = {};
  showQrVisitorFlow();
}

function viewVisitorRecords() {
  document.querySelectorAll(".modal-overlay").forEach(m => m.remove());
  window.location.hash = "#/access";
  showToast("请在通行记录中查看访客通行详情", "info");
}

function renderRepair() {
  showLoading();
  api("/api/repair").then(data => {
    if (!data.ok) {
      showError(data.error || "无法加载报修数据");
      return;
    }

    contentNode.innerHTML = `
      <div class="page-header">
        <h1>报事报修</h1>
        <p>业主报修工单全流程跟踪处理</p>
      </div>

      <div class="filter-bar">
        <div class="filter-group">
          <label>工单状态</label>
          <select onchange="filterRepair(this.value)">
            <option value="">全部</option>
            <option value="pending">待处理</option>
            <option value="processing">处理中</option>
            <option value="completed">已完成</option>
          </select>
        </div>
        <div class="filter-group">
          <label>优先级</label>
          <select>
            <option value="">全部</option>
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </select>
        </div>
        <div class="filter-group">
          <label>类型</label>
          <select>
            <option value="">全部</option>
            <option value="equipment">设备故障</option>
            <option value="plumbing">水电维修</option>
            <option value="public_facility">公共设施</option>
          </select>
        </div>
      </div>

      <div class="panel">
        <div class="panel-body" style="padding: 0;">
          <table class="table" id="repairTable">
            <thead>
              <tr>
                <th>工单号</th>
                <th>标题</th>
                <th>报修人</th>
                <th>位置</th>
                <th>类型</th>
                <th>优先级</th>
                <th>处理人</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              ${data.orders.map(o => `
                <tr data-status="${o.status}">
                  <td><code>${o.id}</code></td>
                  <td><strong>${o.title}</strong></td>
                  <td>${o.reporter}<br/><span class="time">${o.phone}</span></td>
                  <td>${o.location}</td>
                  <td><span class="badge badge-info">${o.type}</span></td>
                  <td>
                    <span class="badge ${o.priority === 'high' ? 'badge-danger' : o.priority === 'medium' ? 'badge-warn' : 'badge-info'}">
                      ${getPriorityLabel(o.priority)}
                    </span>
                  </td>
                  <td>${o.assignee || '-'}</td>
                  <td><span class="badge ${getStatusClass(o.status)}">${getStatusLabel(o.status)}</span></td>
                  <td>${formatDate(o.created_at)}</td>
                  <td>
                    <button class="btn btn-outline btn-sm" onclick="showRepairDetail('${o.id}')">查看</button>
                    ${o.status === 'pending' ? `<button class="btn btn-primary btn-sm" style="margin-left: 4px;" onclick="event.stopPropagation(); alert('已模拟接单：${o.id}')">接单</button>` : ''}
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  });
}

function filterRepair(status) {
  const rows = document.querySelectorAll("#repairTable tbody tr");
  rows.forEach(row => {
    if (!status || row.dataset.status === status) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
}

let neighborhoodTab = "pending";

function renderNeighborhood() {
  showLoading();
  api("/api/neighborhood").then(data => {
    if (!data.ok) {
      showError(data.error || "无法加载邻里圈数据");
      return;
    }

    const posts = data.posts;
    const pendingCount = posts.filter(p => p.status === 'pending').length;
    const approvedCount = posts.filter(p => p.status === 'approved').length;
    const rejectedCount = posts.filter(p => p.status === 'rejected').length;

    const filteredPosts = posts.filter(p => p.status === neighborhoodTab);

    contentNode.innerHTML = `
      <div class="page-header">
        <h1>邻里圈审核</h1>
        <p>社区邻里圈内容发布与实名审核管理</p>
      </div>

      <div class="tabs" id="neighborhoodTabs" style="margin-bottom: 24px;">
        <div class="tab ${neighborhoodTab === 'pending' ? 'active' : ''}" onclick="switchNeighborhoodTab('pending')">待审核 (${pendingCount})</div>
        <div class="tab ${neighborhoodTab === 'approved' ? 'active' : ''}" onclick="switchNeighborhoodTab('approved')">已通过 (${approvedCount})</div>
        <div class="tab ${neighborhoodTab === 'rejected' ? 'active' : ''}" onclick="switchNeighborhoodTab('rejected')">已拒绝 (${rejectedCount})</div>
      </div>

      <div class="stats-summary" style="margin-bottom: 24px;">
        <div class="summary-card"><div class="summary-label">今日新增</div><div class="summary-value" style="font-size: 18px;">${Math.floor(posts.length * 0.3)}<span class="summary-unit">帖</span></div></div>
        <div class="summary-card"><div class="summary-label">待审核</div><div class="summary-value" style="font-size: 18px; color: var(--warn);">${pendingCount}<span class="summary-unit">帖</span></div></div>
        <div class="summary-card"><div class="summary-label">通过率</div><div class="summary-value" style="font-size: 18px; color: var(--success);">${posts.length > 0 ? Math.round(approvedCount / posts.length * 100) : 0}<span class="summary-unit">%</span></div></div>
        <div class="summary-card"><div class="summary-label">实名发布</div><div class="summary-value" style="font-size: 18px; color: var(--accent);">${posts.filter(p => p.is_verified).length}<span class="summary-unit">帖</span></div></div>
      </div>

      ${filteredPosts.length === 0 ? `
        <div class="empty" style="padding: 48px 24px;">
          <div style="font-size: 48px; margin-bottom: 12px;">📭</div>
          <p style="color: var(--text-muted); margin: 0;">暂无${neighborhoodTab === 'pending' ? '待审核' : neighborhoodTab === 'approved' ? '已通过' : '已拒绝'}的内容</p>
        </div>
      ` : `
      <div class="grid">
        ${filteredPosts.map(p => `
          <div class="col-6">
            <div class="panel">
              <div class="panel-header">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <h3 class="panel-title" style="margin: 0;">${p.title}</h3>
                  ${p.is_verified ? '<span class="badge badge-info" style="font-size: 11px;">✓ 实名</span>' : ''}
                </div>
                <span class="badge ${getStatusClass(p.status)}">${getStatusLabel(p.status)}</span>
              </div>
              <div class="panel-body">
                <p style="color: var(--text-secondary); margin-bottom: 12px; line-height: 1.7; font-size: 14px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">${p.content}</p>
                <div class="list-item-meta" style="margin-bottom: 14px; flex-wrap: wrap;">
                  <span>👤 ${p.author}</span>
                  <span>🏠 ${p.room || '匿名'}</span>
                  <span>${formatTimeAgo(p.created_at)}</span>
                  ${p.likes ? `<span>👍 ${p.likes}</span>` : ''}
                  ${p.comments ? `<span>💬 ${p.comments}</span>` : ''}
                </div>
                ${p.audit_opinion ? `<p style="font-size: 13px; color: var(--text-muted); margin-bottom: 14px; padding: 8px 12px; background: var(--bg-secondary); border-radius: 6px;">📝 审核意见：${p.audit_opinion}</p>` : ''}
                <div style="display: flex; gap: 8px;">
                  <button class="btn btn-outline btn-sm" onclick="showNeighborhoodDetail('${p.id}')">查看详情</button>
                  ${p.status === 'pending' ? `
                    <button class="btn btn-success btn-sm" onclick="auditNeighborhood('${p.id}', 'approved')">✅ 通过</button>
                    <button class="btn btn-danger btn-sm" onclick="auditNeighborhood('${p.id}', 'rejected')">❌ 拒绝</button>
                  ` : ''}
                </div>
              </div>
            </div>
          </div>
        `).join("")}
      </div>`}
    `;
  });
}

function switchNeighborhoodTab(tab) {
  neighborhoodTab = tab;
  renderNeighborhood();
}

function showNeighborhoodDetail(postId) {
  api("/api/neighborhood").then(data => {
    const p = data.posts.find(x => x.id == postId);
    if (!p) return;
    const content = `
      <div style="display: grid; gap: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div>
            <h3 style="margin: 0 0 6px; font-size: 18px;">${p.title}</h3>
            <div class="list-item-meta" style="flex-wrap: wrap;">
              <span>👤 ${p.author}</span>
              <span>🏠 ${p.room || '匿名'}</span>
              <span>${formatTimeAgo(p.created_at)}</span>
              ${p.is_verified ? '<span class="badge badge-info" style="font-size: 11px;">✓ 已实名</span>' : ''}
            </div>
          </div>
          <span class="badge ${getStatusClass(p.status)}">${getStatusLabel(p.status)}</span>
        </div>
        <div class="info-card">
          <div style="line-height: 1.8; color: var(--text-primary); font-size: 14px;">${p.content}</div>
        </div>
        ${p.audit_opinion ? `
        <div class="info-card info-warn">
          <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 4px; font-weight: 600;">📝 审核意见</div>
          <div style="font-size: 14px;">${p.audit_opinion}</div>
        </div>` : ''}
        ${p.status === 'pending' ? `
        <div>
          <h4 style="margin: 0 0 10px; font-size: 14px; color: var(--text-secondary);">审核操作</h4>
          <div style="display: grid; gap: 10px;">
            <div>
              <label class="form-label">审核意见（可选）</label>
              <textarea id="auditOpinion" class="form-input" rows="2" placeholder="请填写审核意见..." style="resize: vertical;"></textarea>
            </div>
            <div class="action-row">
              <button class="btn btn-success" onclick="auditNeighborhood('${p.id}', 'approved'); this.closest('.modal-overlay').remove();">✅ 审核通过</button>
              <button class="btn btn-danger" onclick="auditNeighborhood('${p.id}', 'rejected'); this.closest('.modal-overlay').remove();">❌ 拒绝发布</button>
            </div>
          </div>
        </div>` : ''}
      </div>
    `;
    const actions = `<button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">关闭</button>`;
    showModal(`邻里圈 - ${p.title}`, content, actions);
  });
}

function auditNeighborhood(postId, action) {
  const opinionEl = document.getElementById("auditOpinion");
  const opinion = opinionEl ? opinionEl.value : "";
  showToast(action === 'approved' ? '审核通过，内容已发布' : '已拒绝发布', action === 'approved' ? 'success' : 'info');
  setTimeout(renderNeighborhood, 300);
}

function renderProperty() {
  showLoading();
  Promise.all([
    api("/api/property/fees"),
    api("/api/property/invoices")
  ]).then(([fees, invoices]) => {
    if (!fees.ok || !invoices.ok) {
      showError("无法加载物业费数据");
      return;
    }

    const totalAmount = fees.fees.reduce((sum, f) => sum + f.amount, 0);
    const paidAmount = fees.fees.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0);
    const paymentRecords = (fees.payment_records || []).slice(0, 5);

    contentNode.innerHTML = `
      <div class="page-header">
        <h1>物业费缴纳与电子票据</h1>
        <p>物业费收缴管理与电子票据开具</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-card-title">本月应收</span>
            <div class="stat-icon accent">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
          </div>
          <div class="stat-card-value">¥${totalAmount.toFixed(2)}</div>
          <div class="stat-card-sub">共 ${fees.fees.length} 户</div>
        </div>

        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-card-title">已收金额</span>
            <div class="stat-icon success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>
            </div>
          </div>
          <div class="stat-card-value">¥${paidAmount.toFixed(2)}</div>
          <div class="stat-card-sub">收缴率 ${((paidAmount / totalAmount) * 100).toFixed(1)}%</div>
        </div>

        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-card-title">未缴户数</span>
            <div class="stat-icon warn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
          </div>
          <div class="stat-card-value">${fees.fees.filter(f => f.status === 'unpaid' || f.status === 'overdue').length}</div>
          <div class="stat-card-sub">逾期 ${fees.fees.filter(f => f.status === 'overdue').length} 户</div>
        </div>

        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-card-title">已开票据</span>
            <div class="stat-icon info">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
            </div>
          </div>
          <div class="stat-card-value">${invoices.invoices.length}</div>
          <div class="stat-card-sub">电子票据</div>
        </div>
      </div>

      <div class="grid">
        <div class="col-8">
          <div class="panel">
            <div class="panel-header">
              <h3 class="panel-title">缴费明细</h3>
              <div class="filter-group" style="margin-left: auto; margin-bottom: 0;">
                <select id="feeStatusFilter" onchange="filterFeeStatus()">
                  <option value="">全部状态</option>
                  <option value="paid">已缴费</option>
                  <option value="unpaid">未缴费</option>
                  <option value="overdue">已逾期</option>
                </select>
              </div>
            </div>
            <div class="panel-body" style="padding: 0;">
              <table class="table">
                <thead>
                  <tr>
                    <th>业主</th>
                    <th>房间</th>
                    <th>账期</th>
                    <th>金额</th>
                    <th>状态</th>
                    <th>票据号</th>
                    <th>缴费时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody id="feeTableBody">
                  ${fees.fees.map(f => renderFeeRow(f)).join("")}
                </tbody>
              </table>
            </div>
          </div>

          ${paymentRecords.length > 0 ? `
          <div class="panel" style="margin-top: 16px;">
            <div class="panel-header"><h3 class="panel-title">最近缴费记录</h3></div>
            <div class="panel-body" style="padding: 0;">
              <table class="table">
                <thead>
                  <tr><th>支付流水号</th><th>业主</th><th>支付方式</th><th>金额</th><th>时间</th><th>状态</th></tr>
                </thead>
                <tbody>
                  ${paymentRecords.map(p => `
                    <tr>
                      <td style="font-family: monospace; font-size: 12px;">${p.payment_no}</td>
                      <td>${p.owner}</td>
                      <td>${p.payment_method}</td>
                      <td style="color: var(--success); font-weight: 600;">¥${p.amount.toFixed(2)}</td>
                      <td>${formatDate(p.paid_at)}</td>
                      <td><span class="badge badge-ok">成功</span></td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          </div>` : ''}
        </div>

        <div class="col-4">
          <div class="panel">
            <div class="panel-header">
              <h3 class="panel-title">电子票据预览</h3>
            </div>
            <div class="panel-body">
              ${invoices.invoices.length > 0 ? `
                <div class="invoice-preview">
                  <h4>物业费电子发票</h4>
                  <div class="invoice-fields">
                    <div class="invoice-field">
                      <div class="invoice-field-label">发票代码</div>
                      <div class="invoice-field-value">${invoices.invoices[0].invoice_code}</div>
                    </div>
                    <div class="invoice-field">
                      <div class="invoice-field-label">发票号码</div>
                      <div class="invoice-field-value">${invoices.invoices[0].invoice_number}</div>
                    </div>
                    <div class="invoice-field">
                      <div class="invoice-field-label">业主姓名</div>
                      <div class="invoice-field-value">${invoices.invoices[0].owner}</div>
                    </div>
                    <div class="invoice-field">
                      <div class="invoice-field-label">房间号</div>
                      <div class="invoice-field-value">${invoices.invoices[0].room}</div>
                    </div>
                    <div class="invoice-field">
                      <div class="invoice-field-label">账期</div>
                      <div class="invoice-field-value">${invoices.invoices[0].period}</div>
                    </div>
                    <div class="invoice-field">
                      <div class="invoice-field-label">金额</div>
                      <div class="invoice-field-value" style="color: var(--accent);">¥${invoices.invoices[0].amount.toFixed(2)}</div>
                    </div>
                  </div>
                  <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 16px;">
                    开票时间：${formatDate(invoices.invoices[0].created_at)}
                  </div>
                  <button class="btn btn-outline" style="width: 100%;" onclick="showInvoiceDetail(${invoices.invoices[0].id})">查看完整票据</button>
                </div>
              ` : `
                <div class="empty">
                  <div class="empty-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
                  </div>
                  <p>暂无已开具的票据</p>
                </div>
              `}
            </div>
          </div>

          <div class="panel" style="margin-top: 16px;">
            <div class="panel-header"><h3 class="panel-title">收缴进度</h3></div>
            <div class="panel-body">
              <div style="margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                  <span style="font-size: 13px; color: var(--text-secondary);">已缴户数</span>
                  <span style="font-size: 13px; font-weight: 600;">${fees.fees.filter(f => f.status === 'paid').length} / ${fees.fees.length}</span>
                </div>
                <div class="progress-bar"><div class="progress-bar-fill" style="width: ${(fees.fees.filter(f => f.status === 'paid').length / fees.fees.length * 100).toFixed(0)}%"></div></div>
              </div>
              <div style="margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                  <span style="font-size: 13px; color: var(--text-secondary);">收缴金额</span>
                  <span style="font-size: 13px; font-weight: 600;">¥${paidAmount.toFixed(0)} / ¥${totalAmount.toFixed(0)}</span>
                </div>
                <div class="progress-bar"><div class="progress-bar-fill" style="width: ${(paidAmount / totalAmount * 100).toFixed(0)}%; background: linear-gradient(90deg, var(--success), #34d399);"></div></div>
              </div>
              <div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                  <span style="font-size: 13px; color: var(--text-secondary);">逾期比例</span>
                  <span style="font-size: 13px; font-weight: 600; color: var(--danger);">${fees.fees.filter(f => f.status === 'overdue').length} 户</span>
                </div>
                <div class="progress-bar"><div class="progress-bar-fill" style="width: ${(fees.fees.filter(f => f.status === 'overdue').length / fees.fees.length * 100).toFixed(0)}%; background: linear-gradient(90deg, var(--danger), #f87171);"></div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  });
}

function renderFeeRow(f) {
  return `
    <tr data-status="${f.status}">
      <td><strong>${f.owner}</strong></td>
      <td>${f.room}</td>
      <td>${f.period}</td>
      <td style="font-weight: 600;">¥${f.amount.toFixed(2)}</td>
      <td><span class="badge ${getStatusClass(f.status)}">${getStatusLabel(f.status)}</span></td>
      <td>${f.invoice_no || '-'}</td>
      <td>${f.paid_at ? formatDate(f.paid_at) : '-'}</td>
      <td>
        ${f.status === 'paid' 
          ? `<button class="btn btn-outline btn-sm" onclick="showInvoiceDetail(${f.id})">查看票据</button>`
          : f.status === 'overdue'
            ? `<button class="btn btn-danger btn-sm" onclick="remindFee(${f.id})">催缴</button>`
            : `<div style="display: flex; gap: 4px;">
                <button class="btn btn-primary btn-sm" onclick="showPayFlow(${f.id})">去缴费</button>
                <button class="btn btn-outline btn-sm" onclick="remindFee(${f.id})">催缴</button>
              </div>`
        }
      </td>
    </tr>
  `;
}

function filterFeeStatus() {
  const status = document.getElementById("feeStatusFilter").value;
  document.querySelectorAll("#feeTableBody tr").forEach(tr => {
    tr.style.display = (!status || tr.dataset.status === status) ? "" : "none";
  });
}

function remindFee(id) {
  showToast("催缴通知已发送到业主App和短信", "success");
}

function showPayFlow(id) {
  Promise.all([api("/api/property/fees"), api("/api/property/invoices")]).then(([fees, invoices]) => {
    const f = fees.fees.find(x => x.id === id);
    if (!f) return;
    const content = `
      <div style="display: grid; gap: 14px;">
        <div class="info-card" style="background: linear-gradient(135deg, var(--bg-accent), white);">
          <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 6px;">待缴金额</div>
          <div style="font-size: 36px; font-weight: 700; color: var(--accent);">¥${f.amount.toFixed(2)}</div>
          <div class="list-item-meta" style="margin-top: 8px;">
            <span>👤 ${f.owner}</span>
            <span>🏠 ${f.room}</span>
            <span>📅 ${f.period}账期</span>
          </div>
        </div>

        <div class="form-card" style="margin-bottom: 0;">
          <div style="font-size: 14px; font-weight: 600; margin-bottom: 12px;">选择支付方式</div>
          <div style="display: grid; gap: 8px;">
            <label style="display: flex; align-items: center; gap: 10px; padding: 12px 14px; border: 1.5px solid var(--border); border-radius: 10px; cursor: pointer; transition: all 0.2s;" class="pay-method" onclick="selectPayMethod(this, 'wechat')">
              <input type="radio" name="payMethod" value="wechat" checked style="accent-color: var(--accent);"/>
              <div style="width: 36px; height: 36px; background: #07c160; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 16px;">微</div>
              <div style="flex: 1;">
                <div style="font-weight: 600;">微信支付</div>
                <div style="font-size: 12px; color: var(--text-secondary);">推荐使用，秒级到账</div>
              </div>
            </label>
            <label style="display: flex; align-items: center; gap: 10px; padding: 12px 14px; border: 1.5px solid var(--border); border-radius: 10px; cursor: pointer; transition: all 0.2s;" class="pay-method" onclick="selectPayMethod(this, 'alipay')">
              <input type="radio" name="payMethod" value="alipay" style="accent-color: var(--accent);"/>
              <div style="width: 36px; height: 36px; background: #1677ff; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 16px;">支</div>
              <div style="flex: 1;">
                <div style="font-weight: 600;">支付宝</div>
                <div style="font-size: 12px; color: var(--text-secondary);">支持花呗分期</div>
              </div>
            </label>
            <label style="display: flex; align-items: center; gap: 10px; padding: 12px 14px; border: 1.5px solid var(--border); border-radius: 10px; cursor: pointer; transition: all 0.2s;" class="pay-method" onclick="selectPayMethod(this, 'bank')">
              <input type="radio" name="payMethod" value="bank" style="accent-color: var(--accent);"/>
              <div style="width: 36px; height: 36px; background: #f59e0b; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 16px;">银</div>
              <div style="flex: 1;">
                <div style="font-weight: 600;">银行卡支付</div>
                <div style="font-size: 12px; color: var(--text-secondary);">储蓄卡/信用卡</div>
              </div>
            </label>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-secondary);">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          支付信息全程加密传输，请放心支付
        </div>
      </div>
    `;
    const actions = `
      <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">取消</button>
      <button class="btn btn-primary" onclick="confirmPay(${f.id})">确认支付 ¥${f.amount.toFixed(2)}</button>
    `;
    showModal(`在线缴费 - ${f.owner}`, content, actions);
  });
}

function selectPayMethod(el, method) {
  document.querySelectorAll(".pay-method").forEach(l => {
    l.style.borderColor = "var(--border)";
    l.style.background = "white";
  });
  el.style.borderColor = "var(--accent)";
  el.style.background = "rgba(99, 102, 241, 0.04)";
}

function confirmPay(id) {
  showToast("支付成功！电子票据正在生成中...", "success");
  setTimeout(() => {
    document.querySelectorAll(".modal-overlay").forEach(m => m.remove());
    showToast("电子票据已生成，可查看下载", "info");
    renderProperty();
  }, 1200);
}

function showInvoiceDetail(id) {
  Promise.all([api("/api/property/fees"), api("/api/property/invoices")]).then(([fees, invoices]) => {
    const invoice = invoices.invoices.find(x => x.id === id) || invoices.invoices[0];
    const fee = fees.fees.find(x => x.id === id) || fees.fees[0];
    if (!invoice) return;
    const content = `
      <div style="display: grid; gap: 16px;">
        <div style="background: linear-gradient(135deg, #f0f9ff, white); border: 1px solid #bae6fd; border-radius: 14px; padding: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
            <div>
              <h4 style="margin: 0 0 6px 0; font-size: 18px;">物业费电子发票</h4>
              <div style="font-size: 12px; color: var(--text-secondary);">电子票据凭证 · 具有法律效力</div>
            </div>
            <span class="badge badge-ok" style="font-size: 12px;">已开具 ✓</span>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px 20px; padding: 16px; background: white; border-radius: 10px; border: 1px solid var(--border);">
            <div><div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 3px;">发票代码</div><div style="font-family: monospace; font-weight: 600;">${invoice.invoice_code}</div></div>
            <div><div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 3px;">发票号码</div><div style="font-family: monospace; font-weight: 600;">${invoice.invoice_number}</div></div>
            <div><div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 3px;">开票日期</div><div>${formatDate(invoice.created_at)}</div></div>
            <div><div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 3px;">校验码</div><div style="font-family: monospace;">${invoice.check_code || '**** **** **** ' + Math.floor(Math.random() * 9000 + 1000)}</div></div>
            <div><div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 3px;">购买方（业主）</div><div style="font-weight: 600;">${invoice.owner}</div></div>
            <div><div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 3px;">房屋坐落</div><div>${invoice.room}</div></div>
          </div>

          <div style="margin-top: 12px; padding: 16px; background: white; border-radius: 10px; border: 1px solid var(--border);">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <thead>
                <tr style="background: var(--bg-secondary);">
                  <th style="padding: 10px 12px; text-align: left; border-bottom: 1px solid var(--border);">项目名称</th>
                  <th style="padding: 10px 12px; text-align: center; border-bottom: 1px solid var(--border);">账期</th>
                  <th style="padding: 10px 12px; text-align: right; border-bottom: 1px solid var(--border);">金额</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 10px 12px; border-bottom: 1px solid var(--border);">物业管理服务费</td>
                  <td style="padding: 10px 12px; text-align: center; border-bottom: 1px solid var(--border);">${invoice.period}</td>
                  <td style="padding: 10px 12px; text-align: right; border-bottom: 1px solid var(--border);">¥${invoice.amount.toFixed(2)}</td>
                </tr>
                <tr style="font-weight: 600;">
                  <td style="padding: 10px 12px;" colspan="2">价税合计（大写）</td>
                  <td style="padding: 10px 12px; text-align: right; color: var(--accent); font-size: 15px;">¥${invoice.amount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style="margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div><div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 3px;">销售方</div><div>阳光社区物业服务有限公司</div></div>
            <div><div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 3px;">收款人</div><div>${fee.paid_at ? '物业财务系统' : '-'}</div></div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; background: var(--bg-secondary); border-radius: 10px;">
          <div style="width: 48px; height: 48px; background: white; border-radius: 8px; display: grid; grid-template-columns: repeat(8, 1fr); gap: 1px; padding: 6px;">
            ${Array.from({length: 32}).map((_, i) => `<div style="background: ${Math.random() > 0.5 ? 'black' : 'transparent'}; border-radius: 1px;"></div>`).join("")}
          </div>
          <div style="flex: 1;">
            <div style="font-size: 13px; font-weight: 600;">扫码验证票据真伪</div>
            <div style="font-size: 12px; color: var(--text-secondary);">扫描二维码可在税务局官网查验</div>
          </div>
        </div>
      </div>
    `;
    const actions = `
      <button class="btn btn-outline" onclick="showToast('电子票据已发送到业主邮箱', 'success')">📧 邮件发送</button>
      <button class="btn btn-outline" onclick="showToast('票据下载中...', 'info')">⬇️ 下载 PDF</button>
      <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">关闭</button>
    `;
    showModal(`电子票据 - ${invoice.invoice_number}`, content, actions);
  });
}

function showFeeDetail(id) {
  showInvoiceDetail(id);
}

function renderAnnouncements() {
  showLoading();
  api("/api/announcements").then(data => {
    if (!data.ok) {
      showError(data.error || "无法加载公告数据");
      return;
    }

    const announcements = data.announcements;
    const publishedCount = announcements.filter(a => a.status === 'published').length;
    const draftCount = announcements.filter(a => a.status === 'draft').length;

    contentNode.innerHTML = `
      <div class="page-header">
        <h1>公告定向推送</h1>
        <p>按楼栋、单元、角色定向推送社区公告</p>
      </div>

      <div class="stats-summary" style="margin-bottom: 20px;">
        <div class="summary-card"><div class="summary-label">公告总数</div><div class="summary-value" style="font-size: 18px;">${announcements.length}<span class="summary-unit">条</span></div></div>
        <div class="summary-card"><div class="summary-label">已发布</div><div class="summary-value" style="font-size: 18px; color: var(--success);">${publishedCount}<span class="summary-unit">条</span></div></div>
        <div class="summary-card"><div class="summary-label">草稿箱</div><div class="summary-value" style="font-size: 18px; color: var(--warn);">${draftCount}<span class="summary-unit">条</span></div></div>
        <div class="summary-card"><div class="summary-label">覆盖户数</div><div class="summary-value" style="font-size: 18px; color: var(--accent);">${Math.floor(announcements.length * 120)}<span class="summary-unit">户</span></div></div>
      </div>

      <div class="filter-bar">
        <div class="filter-group">
          <label>推送范围</label>
          <select id="filterBuilding" onchange="filterAnnouncements()">
            <option value="">全部楼栋</option>
            <option value="1号楼">1号楼</option>
            <option value="2号楼">2号楼</option>
            <option value="3号楼">3号楼</option>
          </select>
        </div>
        <div class="filter-group">
          <label>目标角色</label>
          <select id="filterRole" onchange="filterAnnouncements()">
            <option value="">全部角色</option>
            <option value="owner">全体业主</option>
            <option value="tenant">租户</option>
            <option value="committee">业委会</option>
          </select>
        </div>
        <button class="btn btn-primary" style="margin-left: auto;" onclick="showAnnouncementForm()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          新建公告
        </button>
      </div>

      <div id="announcementList" class="grid">
        ${announcements.map(a => renderAnnouncementCard(a)).join("")}
      </div>
    `;
  });
}

function renderAnnouncementCard(a) {
  const roleLabels = { owner: "业主", tenant: "租户", committee: "业委会", all: "全部" };
  return `
    <div class="col-6 announcement-card" data-building="${a.target_buildings || ''}" data-role="${a.target_roles || ''}">
      <div class="panel">
        <div class="panel-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <h3 class="panel-title" style="margin: 0;">${a.title}</h3>
            ${a.is_important ? '<span class="badge badge-danger" style="font-size: 11px;">🔥 重要</span>' : ''}
          </div>
          <span class="badge ${getStatusClass(a.status)}">${getStatusLabel(a.status)}</span>
        </div>
        <div class="panel-body">
          <p style="color: var(--text-secondary); margin-bottom: 12px; line-height: 1.7; font-size: 14px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${a.content}</p>
          <div class="list-item-meta" style="margin-bottom: 10px; flex-wrap: wrap;">
            <span>👤 ${a.publisher}</span>
            ${a.target_buildings ? `<span>🏢 ${a.target_buildings}</span>` : '<span>🏢 全社区</span>'}
            ${a.target_roles ? `<span>👥 ${roleLabels[a.target_roles] || a.target_roles}</span>` : '<span>👥 全部角色</span>'}
            ${a.view_count !== undefined ? `<span>👁️ ${a.view_count}次阅读</span>` : ''}
          </div>
          <div class="list-item-meta" style="margin-bottom: 14px;">
            <span>${a.published_at ? '📅 发布于 ' + formatDate(a.published_at) : '📝 创建于 ' + formatDate(a.created_at)}</span>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-outline btn-sm" onclick="showAnnouncementDetail('${a.id}')">查看详情</button>
            ${a.status === 'draft' ? `
              <button class="btn btn-primary btn-sm" onclick="publishAnnouncement('${a.id}')">立即发布</button>
            ` : a.status === 'published' ? `
              <button class="btn btn-outline btn-sm" onclick="showToast('已推送通知到目标用户', 'success')">📢 再次推送</button>
            ` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}

function filterAnnouncements() {
  const building = document.getElementById("filterBuilding").value;
  const role = document.getElementById("filterRole").value;
  document.querySelectorAll(".announcement-card").forEach(card => {
    const matchBuilding = !building || card.dataset.building.includes(building);
    const matchRole = !role || card.dataset.role.includes(role);
    card.style.display = (matchBuilding && matchRole) ? "" : "none";
  });
}

function showAnnouncementDetail(id) {
  api("/api/announcements").then(data => {
    const a = data.announcements.find(x => x.id == id);
    if (!a) return;
    const roleLabels = { owner: "业主", tenant: "租户", committee: "业委会", all: "全部" };
    const content = `
      <div style="display: grid; gap: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;">
              <h3 style="margin: 0; font-size: 20px;">${a.title}</h3>
              ${a.is_important ? '<span class="badge badge-danger" style="font-size: 11px;">🔥 重要公告</span>' : ''}
            </div>
            <div class="list-item-meta" style="flex-wrap: wrap;">
              <span>👤 ${a.publisher}</span>
              <span>${a.published_at ? '发布于 ' + formatDate(a.published_at) : '创建于 ' + formatDate(a.created_at)}</span>
              ${a.view_count !== undefined ? `<span>👁️ ${a.view_count}次阅读</span>` : ''}
            </div>
          </div>
          <span class="badge ${getStatusClass(a.status)}" style="font-size: 13px; flex-shrink: 0;">${getStatusLabel(a.status)}</span>
        </div>

        <div class="info-card">
          <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 8px; font-weight: 600;">📢 定向推送范围</div>
          <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            <span class="badge badge-info">🏢 ${a.target_buildings || '全社区'}</span>
            <span class="badge badge-info">👥 ${roleLabels[a.target_roles] || a.target_roles || '全部角色'}</span>
            ${a.target_units ? `<span class="badge badge-info">🚪 ${a.target_units}</span>` : ''}
          </div>
        </div>

        <div class="info-card" style="background: white; border-color: var(--border);">
          <div style="line-height: 1.9; color: var(--text-primary); font-size: 15px; white-space: pre-wrap;">${a.content}</div>
        </div>
      </div>
    `;
    let actions = [];
    if (a.status === 'draft') {
      actions.push(`<button class="btn btn-primary" onclick="publishAnnouncement('${a.id}'); this.closest('.modal-overlay').remove();">立即发布</button>`);
    }
    if (a.status === 'published') {
      actions.push(`<button class="btn btn-outline" onclick="showToast('已推送到目标用户设备', 'success')">📢 再次推送</button>`);
    }
    actions.push(`<button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">关闭</button>`);
    showModal(`公告详情 - ${a.title}`, content, actions.join(""));
  });
}

function showAnnouncementForm() {
  const content = `
    <div style="display: grid; gap: 14px;">
      <div class="form-card" style="margin-bottom: 0;">
        <div class="form-group">
          <label class="form-label">公告标题 <span style="color: var(--danger)">*</span></label>
          <input id="annTitle" type="text" class="form-input" placeholder="请输入公告标题"/>
        </div>
        <div class="form-group">
          <label class="form-label">公告内容 <span style="color: var(--danger)">*</span></label>
          <textarea id="annContent" class="form-input" rows="5" placeholder="请输入公告内容..." style="resize: vertical;"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">推送楼栋</label>
          <select id="annBuilding" class="form-select">
            <option value="">全社区</option>
            <option value="1号楼">1号楼</option>
            <option value="2号楼">2号楼</option>
            <option value="3号楼">3号楼</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">目标角色</label>
          <select id="annRole" class="form-select">
            <option value="all">全部角色</option>
            <option value="owner">仅业主</option>
            <option value="tenant">仅租户</option>
            <option value="committee">仅业委会</option>
          </select>
        </div>
        <div class="form-group" style="display: flex; align-items: center; gap: 8px;">
          <input type="checkbox" id="annImportant" style="width: 16px; height: 16px;"/>
          <label for="annImportant" style="margin: 0; font-size: 14px; color: var(--text-primary);">标记为重要公告（置顶+推送通知）</label>
        </div>
      </div>
    </div>
  `;
  const actions = `
    <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">取消</button>
    <button class="btn btn-outline" onclick="saveAnnouncement('draft')">存为草稿</button>
    <button class="btn btn-primary" onclick="saveAnnouncement('published')">立即发布</button>
  `;
  showModal("新建公告", content, actions);
}

function saveAnnouncement(status) {
  const title = document.getElementById("annTitle").value.trim();
  const content = document.getElementById("annContent").value.trim();
  if (!title || !content) {
    showToast("请填写标题和内容", "error");
    return;
  }
  showToast(status === 'published' ? '公告已发布并定向推送' : '已保存到草稿箱', 'success');
  setTimeout(() => {
    document.querySelectorAll(".modal-overlay").forEach(m => m.remove());
    renderAnnouncements();
  }, 500);
}

function publishAnnouncement(id) {
  showToast("公告已发布并推送到目标用户", "success");
  setTimeout(renderAnnouncements, 400);
}

function renderOrg() {
  showLoading();
  api("/api/admin/org").then(data => {
    if (!data.ok) {
      showError(data.error || "无法加载组织架构数据");
      return;
    }

    const orgs = data.orgs;
    const buildTree = (parentId = null) => {
      return orgs
        .filter(o => o.parent_id === parentId)
        .map(o => {
          const children = buildTree(o.id);
          return { ...o, children };
        });
    };

    const tree = buildTree(null);

    const renderTree = (nodes, level = 0) => {
      return nodes.map(node => `
        <div class="org-node" style="padding-left: ${level * 24}px;">
          <span class="org-icon">
            ${node.children.length > 0 
              ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6,9 12,15 18,9"/></svg>'
              : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/></svg>'
            }
          </span>
          <span style="font-weight: 600;">${node.name}</span>
          <span class="org-tag">${node.type}</span>
        </div>
        ${node.children.length > 0 ? renderTree(node.children, level + 1) : ''}
      `).join("");
    };

    contentNode.innerHTML = `
      <div class="page-header">
        <h1>组织架构</h1>
        <p>社区治理组织架构与人员管理</p>
      </div>

      <div class="grid">
        <div class="col-6">
          <div class="panel">
            <div class="panel-header">
              <h3 class="panel-title">组织架构树</h3>
            </div>
            <div class="panel-body">
              <div class="org-tree">
                ${renderTree(tree)}
              </div>
            </div>
          </div>
        </div>

        <div class="col-6">
          <div class="panel">
            <div class="panel-header">
              <h3 class="panel-title">部门列表</h3>
            </div>
            <div class="panel-body" style="padding: 0;">
              <table class="table">
                <thead>
                  <tr>
                    <th>部门ID</th>
                    <th>部门名称</th>
                    <th>类型</th>
                    <th>上级部门</th>
                  </tr>
                </thead>
                <tbody>
                  ${orgs.map(o => {
                    const parent = orgs.find(p => p.id === o.parent_id);
                    return `
                      <tr>
                        <td><code>${o.id}</code></td>
                        <td><strong>${o.name}</strong></td>
                        <td><span class="badge badge-info">${o.type}</span></td>
                        <td>${parent ? parent.name : '-'}</td>
                      </tr>
                    `;
                  }).join("")}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  });
}

function renderPermissions() {
  showLoading();
  api("/api/admin/permissions").then(data => {
    if (!data.ok) {
      showError(data.error || "无法加载权限数据");
      return;
    }

    const roles = [...new Set(data.permissions.map(p => p.role))];
    const modules = [...new Set(data.permissions.map(p => p.module))];

    const roleLabels = {
      "admin": "系统管理员",
      "property": "物业人员",
      "committee": "业委会",
      "owner": "业主"
    };

    const moduleLabels = {
      "repair": "报事报修",
      "neighborhood": "邻里圈",
      "property_fee": "物业费",
      "announcement": "公告管理",
      "access_device": "门禁设备",
      "complaint": "诉求工单"
    };

    contentNode.innerHTML = `
      <div class="page-header">
        <h1>权限矩阵</h1>
        <p>各角色在各业务模块的权限配置</p>
      </div>

      <div class="panel">
        <div class="panel-body">
          <div class="perm-table">
            <div class="perm-header">
              <div>角色</div>
              <div>模块</div>
              <div style="text-align: center;">查看</div>
              <div style="text-align: center;">编辑</div>
              <div style="text-align: center;">删除</div>
              <div style="text-align: center;">审批</div>
            </div>
            ${data.permissions.map(p => `
              <div class="perm-row">
                <div class="perm-role">${roleLabels[p.role] || p.role}</div>
                <div class="perm-module">${moduleLabels[p.module] || p.module}</div>
                <div class="perm-check ${p.can_view ? 'on' : 'off'}">${p.can_view ? '✓' : '✗'}</div>
                <div class="perm-check ${p.can_edit ? 'on' : 'off'}">${p.can_edit ? '✓' : '✗'}</div>
                <div class="perm-check ${p.can_delete ? 'on' : 'off'}">${p.can_delete ? '✓' : '✗'}</div>
                <div class="perm-check ${p.can_approve ? 'on' : 'off'}">${p.can_approve ? '✓' : '✗'}</div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `;
  });
}

function renderBoundaries() {
  showLoading();
  api("/api/admin/boundaries").then(data => {
    if (!data.ok) {
      showError(data.error || "无法加载边界配置数据");
      return;
    }

    const typeLabels = {
      "finance_view": "财务查看边界",
      "notice_edit": "通知编辑边界",
      "complaint_submit": "诉求提交边界",
      "device_manage": "设备管理边界"
    };

    const roleLabels = {
      "committee": "业委会",
      "property": "物业",
      "owner": "业主"
    };

    contentNode.innerHTML = `
      <div class="page-header">
        <h1>权责边界</h1>
        <p>各角色的业务操作权限边界配置</p>
      </div>

      <div class="grid">
        <div class="col-6">
          ${data.boundaries.map(b => `
            <div class="boundary-card">
              <div class="boundary-title">
                ${typeLabels[b.boundary_type] || b.boundary_type}
                <span class="boundary-role">${roleLabels[b.role] || b.role}</span>
              </div>
              <div class="boundary-actions">
                ${b.allowed_actions.split(',').map(a => `
                  <span class="action-tag">${a}</span>
                `).join("")}
              </div>
              <div class="boundary-desc">${b.description}</div>
            </div>
          `).join("")}
        </div>

        <div class="col-6">
          <div class="panel">
            <div class="panel-header">
              <h3 class="panel-title">边界说明</h3>
            </div>
            <div class="panel-body">
              <div class="boundary-card" style="border-left-color: var(--info);">
                <div class="boundary-title">
                  业委会财务查看边界
                </div>
                <div class="boundary-desc">
                  业委会仅可查看物业费收缴统计和财务报表数据，不可导出原始明细数据，不可进行收费操作。
                </div>
              </div>
              <div class="boundary-card" style="border-left-color: var(--warn);">
                <div class="boundary-title">
                  物业通知编辑边界
                </div>
                <div class="boundary-desc">
                  物业可编辑公告和通知内容，但正式发布需经管理员或业委会审批，防止不当信息发布。
                </div>
              </div>
              <div class="boundary-card" style="border-left-color: var(--success);">
                <div class="boundary-title">
                  业主诉求提交边界
                </div>
                <div class="boundary-desc">
                  业主可提交诉求工单和查看自身诉求的处理进度，但不可处理工单或查看其他业主诉求。
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  });
}

function renderComplaints() {
  showLoading();
  api("/api/admin/complaints").then(data => {
    if (!data.ok) {
      showError(data.error || "无法加载诉求数据");
      return;
    }

    const typeLabels = {
      "noise": "噪音扰民",
      "sanitation": "环境卫生",
      "parking": "停车管理",
      "security": "安全问题",
      "greening": "绿化维护"
    };

    contentNode.innerHTML = `
      <div class="page-header">
        <h1>业主诉求</h1>
        <p>业主诉求工单处理与跟踪</p>
      </div>

      <div class="filter-bar">
        <div class="filter-group">
          <label>工单状态</label>
          <select>
            <option value="">全部</option>
            <option value="submitted">已提交</option>
            <option value="processing">处理中</option>
            <option value="closed">已关闭</option>
          </select>
        </div>
        <div class="filter-group">
          <label>诉求类型</label>
          <select>
            <option value="">全部</option>
            <option value="noise">噪音扰民</option>
            <option value="sanitation">环境卫生</option>
            <option value="parking">停车管理</option>
            <option value="security">安全问题</option>
          </select>
        </div>
      </div>

      <div class="panel">
        <div class="panel-body" style="padding: 0;">
          <table class="table">
            <thead>
              <tr>
                <th>工单号</th>
                <th>标题</th>
                <th>业主</th>
                <th>类型</th>
                <th>响应时间</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              ${data.tickets.map(t => `
                <tr>
                  <td><code>${t.id}</code></td>
                  <td><strong>${t.title}</strong></td>
                  <td>${t.owner}<br/><span class="time">${t.phone}</span></td>
                  <td><span class="badge badge-info">${typeLabels[t.type] || t.type}</span></td>
                  <td>${t.response_time ? t.response_time + ' 分钟' : '-'}</td>
                  <td><span class="badge ${getStatusClass(t.status)}">${getStatusLabel(t.status)}</span></td>
                  <td>${formatDate(t.created_at)}</td>
                  <td>
                    <button class="btn btn-outline btn-sm" onclick="showComplaintDetail('${t.id}')">查看</button>
                    ${t.status === 'submitted' ? `<button class="btn btn-primary btn-sm" style="margin-left: 4px;" onclick="event.stopPropagation(); alert('已受理诉求：${t.id}')">受理</button>` : ''}
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  });
}

function renderStats() {
  showLoading();
  api("/api/admin/stats").then(data => {
    if (!data.ok) {
      showError(data.error || "无法加载统计数据");
      return;
    }

    const stats = data.stats.reverse();
    const maxTotal = Math.max(...stats.map(s => s.total_tickets));
    const avgResponse = (stats.reduce((sum, s) => sum + s.avg_response_time, 0) / stats.length).toFixed(1);
    const avgOnTime = (stats.reduce((sum, s) => sum + s.on_time_rate, 0) / stats.length).toFixed(1);
    const avgSatisfaction = (stats.reduce((sum, s) => sum + s.satisfaction_rate, 0) / stats.length).toFixed(1);
    const totalTickets = stats.reduce((sum, s) => sum + s.total_tickets, 0);

    contentNode.innerHTML = `
      <div class="page-header">
        <h1>服务响应时效统计</h1>
        <p>近30天服务响应时效与满意度统计分析</p>
      </div>

      <div class="stats-summary">
        <div class="summary-card">
          <div class="summary-label">总工单量</div>
          <div class="summary-value">${totalTickets}<span class="summary-unit">单</span></div>
        </div>
        <div class="summary-card">
          <div class="summary-label">平均响应时间</div>
          <div class="summary-value">${avgResponse}<span class="summary-unit">分钟</span></div>
        </div>
        <div class="summary-card">
          <div class="summary-label">按时响应率</div>
          <div class="summary-value">${avgOnTime}<span class="summary-unit">%</span></div>
        </div>
        <div class="summary-card">
          <div class="summary-label">平均满意度</div>
          <div class="summary-value">${avgSatisfaction}<span class="summary-unit">%</span></div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <h3 class="panel-title">工单量趋势（近30天）</h3>
        </div>
        <div class="panel-body">
          <div class="chart-container">
            <div class="chart-bars">
              ${stats.map(s => `
                <div class="chart-bar">
                  <div class="bar-fill" style="height: ${(s.total_tickets / maxTotal) * 100}%;" data-value="${s.date}: ${s.total_tickets}单"></div>
                  <div class="bar-label">${s.date.slice(5)}</div>
                </div>
              `).join("")}
            </div>
          </div>
        </div>
      </div>

      <div class="grid" style="margin-top: 24px;">
        <div class="col-6">
          <div class="panel">
            <div class="panel-header">
              <h3 class="panel-title">响应时效明细</h3>
            </div>
            <div class="panel-body" style="padding: 0;">
              <table class="table">
                <thead>
                  <tr>
                    <th>日期</th>
                    <th>工单量</th>
                    <th>平均响应</th>
                    <th>按时率</th>
                    <th>满意度</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.stats.slice(0, 10).map(s => `
                    <tr>
                      <td>${s.date}</td>
                      <td>${s.total_tickets}</td>
                      <td>${s.avg_response_time} 分钟</td>
                      <td>
                        <span class="badge ${s.on_time_rate >= 95 ? 'badge-approved' : s.on_time_rate >= 90 ? 'badge-warn' : 'badge-rejected'}">
                          ${s.on_time_rate}%
                        </span>
                      </td>
                      <td>
                        <span class="badge ${s.satisfaction_rate >= 90 ? 'badge-approved' : s.satisfaction_rate >= 80 ? 'badge-warn' : 'badge-rejected'}">
                          ${s.satisfaction_rate}%
                        </span>
                      </td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="col-6">
          <div class="panel">
            <div class="panel-header">
              <h3 class="panel-title">服务时效指标说明</h3>
            </div>
            <div class="panel-body">
              <div class="boundary-card" style="border-left-color: var(--success);">
                <div class="boundary-title">响应时效标准</div>
                <div class="boundary-desc">
                  一般诉求需在30分钟内响应，紧急诉求需在15分钟内响应，投诉类诉求需在1小时内安排专人处理。
                </div>
              </div>
              <div class="boundary-card" style="border-left-color: var(--accent);">
                <div class="boundary-title">满意度评价</div>
                <div class="boundary-desc">
                  工单关闭后由业主进行满意度评价，分为非常满意、满意、一般、不满意四个等级。
                </div>
              </div>
              <div class="boundary-card" style="border-left-color: var(--warn);">
                <div class="boundary-title">超时预警机制</div>
                <div class="boundary-desc">
                  响应时间超过标准时长的80%时自动预警，超过标准时长时自动升级至上级主管处理。
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  });
}

function router() {
  document.querySelectorAll(".modal-overlay").forEach(m => m.remove());
  const hash = window.location.hash || "#/dashboard";
  const path = hash.replace("#/", "");
  
  let routeKey = path.split("/")[0];
  if (path.startsWith("admin/")) {
    routeKey = path.split("/")[1];
  }
  if (path.startsWith("access/")) {
    routeKey = path.split("/")[1];
  }

  const route = routeConfig[routeKey];
  if (route) {
    pageTitleNode.textContent = route.title;
    state.currentRoute = routeKey;
    updateActiveNav(routeKey);
  }

  const renderMap = {
    "dashboard": showDashboardDetail,
    "access": renderAccess,
    "devices": renderDevices,
    "repair": renderRepair,
    "neighborhood": renderNeighborhood,
    "property": renderProperty,
    "announcements": renderAnnouncements,
    "org": renderOrg,
    "permissions": renderPermissions,
    "boundaries": renderBoundaries,
    "complaints": renderComplaints,
    "stats": renderStats
  };

  const renderFn = renderMap[routeKey] || renderDashboard;
  renderFn();
}

refreshBtn.addEventListener("click", router);
window.addEventListener("hashchange", router);

router();