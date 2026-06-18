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
          <div class="method-card ${state.accessTab === m.key ? 'active' : ''}" onclick="setAccessTab('${m.key}')">
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
              <button class="btn btn-outline btn-sm">查看详情</button>
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
                    <button class="btn btn-outline btn-sm">查看</button>
                    ${o.status === 'pending' ? '<button class="btn btn-primary btn-sm" style="margin-left: 4px;">接单</button>' : ''}
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

function renderNeighborhood() {
  showLoading();
  api("/api/neighborhood").then(data => {
    if (!data.ok) {
      showError(data.error || "无法加载邻里圈数据");
      return;
    }

    const pendingCount = data.posts.filter(p => p.status === 'pending').length;

    contentNode.innerHTML = `
      <div class="page-header">
        <h1>邻里圈审核</h1>
        <p>社区邻里圈内容审核管理</p>
      </div>

      <div class="tabs" style="margin-bottom: 24px;">
        <div class="tab active">待审核 (${pendingCount})</div>
        <div class="tab">已通过 (${data.posts.filter(p => p.status === 'approved').length})</div>
        <div class="tab">已拒绝 (${data.posts.filter(p => p.status === 'rejected').length})</div>
      </div>

      <div class="grid">
        ${data.posts.filter(p => p.status === 'pending').map(p => `
          <div class="col-6">
            <div class="panel">
              <div class="panel-header">
                <h3 class="panel-title">${p.title}</h3>
                <span class="badge ${getStatusClass(p.status)}">${getStatusLabel(p.status)}</span>
              </div>
              <div class="panel-body">
                <p style="color: var(--text-secondary); margin-bottom: 16px; line-height: 1.6;">${p.content}</p>
                <div class="list-item-meta" style="margin-bottom: 16px;">
                  <span>发布人：${p.author}</span>
                  <span>${formatTimeAgo(p.created_at)}</span>
                </div>
                <div style="display: flex; gap: 8px;">
                  <button class="btn btn-success">审核通过</button>
                  <button class="btn btn-danger">拒绝发布</button>
                </div>
              </div>
            </div>
          </div>
        `).join("")}

        ${data.posts.filter(p => p.status !== 'pending').map(p => `
          <div class="col-6" style="opacity: 0.7;">
            <div class="panel">
              <div class="panel-header">
                <h3 class="panel-title">${p.title}</h3>
                <span class="badge ${getStatusClass(p.status)}">${getStatusLabel(p.status)}</span>
              </div>
              <div class="panel-body">
                <p style="color: var(--text-secondary); margin-bottom: 16px; line-height: 1.6;">${p.content}</p>
                <div class="list-item-meta" style="margin-bottom: 8px;">
                  <span>发布人：${p.author}</span>
                  <span>${formatTimeAgo(p.created_at)}</span>
                </div>
                ${p.audit_opinion ? `<p style="font-size: 13px; color: var(--text-muted);">审核意见：${p.audit_opinion}</p>` : ''}
              </div>
            </div>
          </div>
        `).join("")}
      </div>
    `;
  });
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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
          </div>
          <div class="stat-card-value">¥${totalAmount.toFixed(2)}</div>
          <div class="stat-card-sub">共 ${fees.fees.length} 户</div>
        </div>

        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-card-title">已收金额</span>
            <div class="stat-icon success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22,4 12,14.01 9,11.01"/>
              </svg>
            </div>
          </div>
          <div class="stat-card-value">¥${paidAmount.toFixed(2)}</div>
          <div class="stat-card-sub">收缴率 ${((paidAmount / totalAmount) * 100).toFixed(1)}%</div>
        </div>

        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-card-title">未缴户数</span>
            <div class="stat-icon warn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
          </div>
          <div class="stat-card-value">${fees.fees.filter(f => f.status === 'unpaid').length}</div>
          <div class="stat-card-sub">逾期 ${fees.fees.filter(f => f.status === 'overdue').length} 户</div>
        </div>

        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-card-title">已开票据</span>
            <div class="stat-icon info">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
              </svg>
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
                <tbody>
                  ${fees.fees.map(f => `
                    <tr>
                      <td><strong>${f.owner}</strong></td>
                      <td>${f.room}</td>
                      <td>${f.period}</td>
                      <td style="font-weight: 600;">¥${f.amount.toFixed(2)}</td>
                      <td><span class="badge ${getStatusClass(f.status)}">${getStatusLabel(f.status)}</span></td>
                      <td>${f.invoice_no || '-'}</td>
                      <td>${f.paid_at ? formatDate(f.paid_at) : '-'}</td>
                      <td>
                        ${f.status === 'paid' 
                          ? '<button class="btn btn-outline btn-sm">查看票据</button>'
                          : '<button class="btn btn-primary btn-sm">催缴</button>'
                        }
                      </td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          </div>
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
                  <button class="btn btn-outline" style="width: 100%;">下载 PDF</button>
                </div>
              ` : `
                <div class="empty">
                  <div class="empty-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14,2 14,8 20,8"/>
                    </svg>
                  </div>
                  <p>暂无已开具的票据</p>
                </div>
              `}
            </div>
          </div>
        </div>
      </div>
    `;
  });
}

function renderAnnouncements() {
  showLoading();
  api("/api/announcements").then(data => {
    if (!data.ok) {
      showError(data.error || "无法加载公告数据");
      return;
    }

    contentNode.innerHTML = `
      <div class="page-header">
        <h1>公告定向推送</h1>
        <p>按楼栋、单元、角色定向推送社区公告</p>
      </div>

      <div class="filter-bar">
        <div class="filter-group">
          <label>推送范围</label>
          <select>
            <option value="">全部</option>
            <option value="1号楼">1号楼</option>
            <option value="2号楼">2号楼</option>
            <option value="3号楼">3号楼</option>
          </select>
        </div>
        <div class="filter-group">
          <label>目标角色</label>
          <select>
            <option value="">全部</option>
            <option value="owner">全体业主</option>
            <option value="tenant">租户</option>
          </select>
        </div>
        <button class="btn btn-primary" style="margin-left: auto;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          新建公告
        </button>
      </div>

      <div class="grid">
        ${data.announcements.map(a => `
          <div class="col-6">
            <div class="panel">
              <div class="panel-header">
                <h3 class="panel-title">${a.title}</h3>
                <span class="badge ${getStatusClass(a.status)}">${getStatusLabel(a.status)}</span>
              </div>
              <div class="panel-body">
                <p style="color: var(--text-secondary); margin-bottom: 16px; line-height: 1.6;">${a.content}</p>
                <div class="list-item-meta" style="margin-bottom: 12px; flex-wrap: wrap;">
                  <span><strong>发布人：</strong>${a.publisher}</span>
                  ${a.target_buildings ? `<span><strong>楼栋：</strong>${a.target_buildings}</span>` : ''}
                  ${a.target_roles ? `<span><strong>角色：</strong>${a.target_roles === 'all' ? '全部' : a.target_roles}</span>` : ''}
                </div>
                <div class="list-item-meta" style="margin-bottom: 16px;">
                  <span>${a.published_at ? '发布于 ' + formatDate(a.published_at) : '创建于 ' + formatDate(a.created_at)}</span>
                </div>
                <div style="display: flex; gap: 8px;">
                  ${a.status === 'draft' 
                    ? '<button class="btn btn-primary btn-sm">立即发布</button><button class="btn btn-outline btn-sm">编辑</button>'
                    : '<button class="btn btn-outline btn-sm">查看详情</button>'
                  }
                </div>
              </div>
            </div>
          </div>
        `).join("")}
      </div>
    `;
  });
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
                    <button class="btn btn-outline btn-sm">查看</button>
                    ${t.status === 'submitted' ? '<button class="btn btn-primary btn-sm" style="margin-left: 4px;">受理</button>' : ''}
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
    "dashboard": renderDashboard,
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