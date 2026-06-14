const API = 'http://127.0.0.1:59106/api';

const state = {
  overview: null,
  places: [],
  alarms: [],
  inspections: [],
  analytics: null
};

const byId = (id) => document.getElementById(id);
const money = new Intl.NumberFormat('zh-CN');

document.querySelectorAll('.nav').forEach((button) => {
  button.addEventListener('click', () => switchView(button.dataset.view));
});

byId('loginBtn').addEventListener('click', async () => {
  await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'admin', password: '123456', code: '000000' })
  });
  toast('双因素认证通过，监管员会话已建立');
});

byId('placeSearch').addEventListener('input', debounce(loadPlaces, 250));
byId('placeStatus').addEventListener('change', loadPlaces);
byId('cityFilter').addEventListener('change', loadPlaces);
byId('alarmLevel').addEventListener('change', loadAlarms);
byId('auditModule').addEventListener('change', loadAudit);
byId('refreshAlarms').addEventListener('click', loadAlarms);
byId('refreshUsers').addEventListener('click', loadUsers);
byId('newPlaceBtn').addEventListener('click', () => openPlaceModal());
byId('newInspectionBtn').addEventListener('click', () => openInspectionModal());
byId('cancelModal').addEventListener('click', closeModal);

init();

async function init() {
  await checkHealth();
  await Promise.all([
    loadOverview(),
    loadPlaces(),
    loadVerifications(),
    loadReservations(),
    loadAlarms(),
    loadInspections(),
    loadAnalytics(),
    loadUsers(),
    loadRoles(),
    loadAudit()
  ]);
}

async function checkHealth() {
  try {
    const data = await api('/health');
    byId('healthDot').classList.add('ok');
    byId('healthText').textContent = data.status === 'ok' ? '服务在线' : '服务异常';
  } catch (error) {
    byId('healthText').textContent = '后端未连接';
  }
}

async function loadOverview() {
  state.overview = await api('/overview');
  byId('metrics').innerHTML = state.overview.metrics.map((item) => `
    <article class="metric">
      <span>${item.label}</span>
      <strong>${money.format(item.value)}<small>${item.unit}</small></strong>
    </article>
  `).join('');

  const cities = state.overview.heatmap.map((item) => item.city);
  byId('cityFilter').innerHTML = '<option value="">全部城市</option>' + cities.map((city) => `<option>${city}</option>`).join('');
  renderBars('heatmap', state.overview.heatmap.map((item) => ({
    label: item.city,
    value: item.total,
    suffix: `在线 ${item.online || 0}`
  })));
  renderTrend();
}

async function loadPlaces() {
  const keyword = encodeURIComponent(byId('placeSearch').value || '');
  const status = encodeURIComponent(byId('placeStatus').value || '');
  const city = encodeURIComponent(byId('cityFilter').value || '');
  const data = await api(`/places?keyword=${keyword}&status=${status}&city=${city}`);
  state.places = data.list;
  byId('placesTable').innerHTML = `
    <table>
      <thead>
        <tr>
          <th>场所</th><th>区域</th><th>备案号</th><th>容量</th><th>风险</th><th>状态</th><th>操作</th>
        </tr>
      </thead>
      <tbody>
        ${state.places.map((place) => `
          <tr>
            <td><strong>${place.name}</strong><br><span class="muted">${place.address}</span></td>
            <td>${place.city}<br><span class="muted">${place.district}</span></td>
            <td>${place.license_no}</td>
            <td>${place.capacity} 人</td>
            <td>${badge(place.risk_level, place.risk_level === '高' ? 'red' : place.risk_level === '中' ? 'orange' : 'green')}</td>
            <td>${badge(place.status, place.status === '在线' ? 'green' : place.status === '整改中' ? 'orange' : '')}</td>
            <td><button onclick="openPlaceModal('${place.name}')">变更备案</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

async function loadVerifications() {
  const data = await api('/verifications');
  byId('verificationList').innerHTML = data.list.map((item) => `
    <article class="card">
      <div class="card-row">
        <div><strong>${item.person_name}</strong> 在 ${item.place_name} 完成核验<br><span class="muted">身份证尾号 ${item.id_tail}，年龄 ${item.age}，${item.note}</span></div>
        ${badge(item.result, item.result === '异常' ? 'red' : 'green')}
      </div>
    </article>
  `).join('');
}

async function loadReservations() {
  const data = await api('/reservations');
  byId('reservationList').innerHTML = data.list.map((item) => `
    <article class="card">
      <div class="card-row">
        <div><strong>${item.place_name}</strong><br><span class="muted">${item.time_slot}，${item.visitor_name}，${item.people_count} 人</span></div>
        ${badge(item.status, item.status === '已核销' ? 'green' : 'orange')}
      </div>
    </article>
  `).join('');
}

async function loadAlarms() {
  const level = encodeURIComponent(byId('alarmLevel').value || '');
  const data = await api(`/alarms?level=${level}`);
  state.alarms = data.list;
  byId('alarmList').innerHTML = state.alarms.map((item) => `
    <article class="card">
      <div class="card-row">
        <div>
          <strong>${item.type}</strong> · ${item.place_name}
          <br><span class="muted">${item.city}，${item.description}</span>
          <br><span class="muted">处置人：${item.handler || '待派发'} ${item.result || ''}</span>
        </div>
        <div class="stack">
          ${badge(item.level, item.level === '高' ? 'red' : item.level === '中' ? 'orange' : '')}
          ${badge(item.status, item.status === '已关闭' ? 'green' : 'orange')}
          <button onclick="handleAlarm(${item.id})">告警处置</button>
        </div>
      </div>
    </article>
  `).join('');
}

async function loadInspections() {
  const data = await api('/inspections');
  state.inspections = data.list;
  byId('inspectionList').innerHTML = `
    <table>
      <thead><tr><th>任务</th><th>场所</th><th>执行人</th><th>截止时间</th><th>检查项</th><th>状态</th></tr></thead>
      <tbody>
        ${state.inspections.map((task) => `
          <tr>
            <td>${task.title}</td>
            <td>${task.city}<br><span class="muted">${task.place_name}</span></td>
            <td>${task.inspector}</td>
            <td>${task.due_date}</td>
            <td>${task.checklist}</td>
            <td>${badge(task.status, task.status === '执行中' ? 'orange' : '')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

async function loadAnalytics() {
  state.analytics = await api('/analytics');
  renderBars('businessChart', state.analytics.business.map((item) => ({
    label: item.city,
    value: item.visitors,
    suffix: `${item.avg_hours} 小时`
  })));
  renderBars('alarmTypeChart', state.analytics.alarmTypes.map((item) => ({
    label: item.type,
    value: item.count,
    suffix: '条'
  })));
  byId('auditList').innerHTML = state.analytics.auditLogs.map((item) => `
    <article class="card"><strong>${item.module}</strong><br><span class="muted">${item.action} · ${formatTime(item.created_at)}</span></article>
  `).join('');
}

async function loadUsers() {
  const data = await api('/system/users');
  byId('userList').innerHTML = data.list.map((item) => `
    <article class="card">
      <div class="card-row">
        <div><strong>${item.name}</strong><br><span class="muted">${item.role} · ${item.region}</span></div>
        <div class="stack">
          ${badge(item.status, item.status === '启用' ? 'green' : 'orange')}
          <button onclick="updateUserStatus(${item.id}, '${item.status === '启用' ? '停用' : '启用'}')">${item.status === '启用' ? '停用' : '审核通过'}</button>
        </div>
      </div>
    </article>
  `).join('');
}

async function loadRoles() {
  const data = await api('/system/roles');
  byId('roleList').innerHTML = data.list.map((role) => `
    <article class="card">
      <strong>${role.name}</strong>
      <br><span class="muted">${role.role}</span>
      <div class="chips">${role.permissions.map((perm) => `<span>${perm}</span>`).join('')}</div>
    </article>
  `).join('');
}

async function loadAudit() {
  const module = encodeURIComponent(byId('auditModule').value || '');
  const data = await api(`/system/audit?module=${module}`);
  byId('auditList').innerHTML = data.list.map((item) => `
    <article class="card"><strong>${item.module}</strong><br><span class="muted">${item.action} · ${formatTime(item.created_at)}</span></article>
  `).join('');
}

window.handleAlarm = async (id) => {
  await api(`/alarms/${id}/handle`, {
    method: 'PATCH',
    body: JSON.stringify({ status: '处置中', handler: '县级监管员', result: '已生成整改闭环任务' })
  });
  await Promise.all([loadAlarms(), loadAnalytics()]);
  toast('告警处置已提交');
};

window.updateUserStatus = async (id, status) => {
  await api(`/system/users/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
  await Promise.all([loadUsers(), loadAudit()]);
  toast(`账号已${status}`);
};

window.openPlaceModal = openPlaceModal;

function openPlaceModal(name = '') {
  openModal('新增/变更场所备案', [
    ['name', '场所名称', name || '山东文旅示范场所'],
    ['city', '城市', '济南市'],
    ['district', '区县', '历下区'],
    ['address', '详细地址', '文化东路 1 号'],
    ['manager', '管理员', '场所管理员'],
    ['phone', '联系电话', '13800000000']
  ], async (values) => {
    await api('/places', { method: 'POST', body: JSON.stringify(values) });
    await Promise.all([loadPlaces(), loadOverview(), loadAnalytics()]);
    toast('备案信息已提交');
  });
}

function openInspectionModal() {
  openModal('派发巡检任务', [
    ['title', '任务名称', '日常安全巡检'],
    ['city', '城市', '济南市'],
    ['place_name', '场所名称', '泉城数字文化空间'],
    ['inspector', '巡检员', '历下区巡检员'],
    ['due_date', '截止日期', '2026-06-15'],
    ['checklist', '检查项', '实名核验,消防通道,AI摄像头在线']
  ], async (values) => {
    await api('/inspections', { method: 'POST', body: JSON.stringify(values) });
    await Promise.all([loadInspections(), loadOverview(), loadAnalytics()]);
    toast('巡检任务已派发');
  });
}

function openModal(title, fields, onSubmit) {
  byId('modalTitle').textContent = title;
  byId('modalFields').innerHTML = fields.map(([name, label, value]) => `
    <label>${label}<input name="${name}" value="${value || ''}" /></label>
  `).join('');
  byId('modal').classList.remove('hidden');
  byId('modalForm').onsubmit = async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    await onSubmit(values);
    closeModal();
  };
}

function closeModal() {
  byId('modal').classList.add('hidden');
}

function switchView(view) {
  document.querySelectorAll('.nav').forEach((item) => item.classList.toggle('active', item.dataset.view === view));
  document.querySelectorAll('.view').forEach((item) => item.classList.toggle('active', item.id === view));
}

function renderBars(id, items) {
  const max = Math.max(1, ...items.map((item) => Number(item.value || 0)));
  byId(id).innerHTML = items.map((item) => `
    <div class="bar">
      <span>${item.label}</span>
      <span class="bar-track"><span class="bar-fill" style="width:${Math.max(8, (item.value / max) * 100)}%"></span></span>
      <strong>${money.format(item.value)} ${item.suffix || ''}</strong>
    </div>
  `).join('');
}

function renderTrend() {
  const items = state.overview.trend;
  const max = Math.max(...items.map((item) => item.visitors));
  byId('trend').innerHTML = items.map((item) => `
    <div class="trend-col">
      <span class="trend-bar" style="height:${Math.max(40, (item.visitors / max) * 170)}px"></span>
      <strong>${item.day}</strong>
      <span>${item.alarms} 告警</span>
    </div>
  `).join('');
}

function badge(text, color = '') {
  return `<span class="badge ${color}">${text}</span>`;
}

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!response.ok) throw new Error(`${path} HTTP ${response.status}`);
  return response.json();
}

function debounce(fn, wait) {
  let timer = 0;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

function toast(message) {
  byId('healthText').textContent = message;
  setTimeout(checkHealth, 1200);
}

function formatTime(value) {
  return String(value || '').replace('T', ' ').slice(0, 19);
}
