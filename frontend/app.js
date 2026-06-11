const API_BASE = String(window.API_BASE || 'http://127.0.0.1:59102/api').replace(/\/$/, '');

const state = {
  services: [],
  profile: null,
  reminders: [],
  admin: null
};

const $ = (selector) => document.querySelector(selector);

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok || data.ok === false) {
    throw new Error(data.message || data.error || response.statusText);
  }
  return data;
}

function renderMetrics(counts = {}) {
  const rows = [
    ['服务目录', counts.services || 0],
    ['电子证照', counts.certificates || 0],
    ['主动提醒', counts.reminders || 0],
    ['办件记录', counts.applications || 0],
    ['注册用户', counts.users || 0]
  ];
  $('#metrics').innerHTML = rows.map(([label, value]) => `<div class="metric"><span>${label}</span><strong>${value}</strong></div>`).join('');
}

function renderServices() {
  $('#serviceList').innerHTML = state.services.map((item) => `
    <article class="card">
      <span class="badge">${item.category}</span>
      <h3>${item.name}</h3>
      <p>${item.description}</p>
      <button data-service="${item.id}">${item.entry}</button>
    </article>
  `).join('');

  document.querySelectorAll('[data-service]').forEach((button) => {
    button.addEventListener('click', async () => {
      await api('/applications', {
        method: 'POST',
        body: JSON.stringify({ serviceId: button.dataset.service })
      });
      await loadProfile();
      location.hash = 'profile';
    });
  });
}

function renderProfile() {
  const profile = state.profile || {};
  const user = profile.user || {};
  const identity = profile.identity || {};
  $('#codeValue').textContent = identity.suishen_code || 'SH-SSM-2026-0001';
  $('#profileBox').innerHTML = `
    <div class="list-item">
      <h3>${user.name || '演示用户'} · ${user.real_name_status || '已实名'}</h3>
      <p>${user.district || '上海市'} · 手机号 ${user.phone || '13800138000'} · 信用分 ${user.credit_score || 0}</p>
      <p>${identity.status || '随申码绿码'} · 最近核验 ${formatTime(identity.last_verified_at)}</p>
    </div>
  `;

  $('#certificateList').innerHTML = (profile.certificates || []).map((item) => `
    <div class="list-item">
      <strong>${item.name}</strong>
      <p>${item.issuer} · ${item.status} · ${formatTime(item.updated_at)}</p>
    </div>
  `).join('');

  $('#applicationList').innerHTML = (profile.applications || []).map((item) => `
    <div class="list-item">
      <strong>${item.service_name}</strong>
      <p>${item.status} · ${item.submit_channel} · ${formatTime(item.created_at)}</p>
    </div>
  `).join('');
}

function renderReminders() {
  $('#reminderList').innerHTML = state.reminders.map((item) => `
    <div class="list-item">
      <strong>${item.title}</strong>
      <p>${item.type} · ${item.channel} · ${item.status} · ${item.due_date}</p>
      <p>${item.description}</p>
    </div>
  `).join('');
}

function renderAdmin() {
  const admin = state.admin || {};
  $('#apiLabel').textContent = API_BASE;
  $('#adminMetrics').innerHTML = Object.entries(admin.counts || {}).map(([label, value]) => `
    <div class="metric"><span>${label}</span><strong>${value}</strong></div>
  `).join('');
  $('#auditList').innerHTML = (admin.auditLogs || []).map((item) => `
    <div class="list-item">
      <strong>${item.action}</strong>
      <p>${item.detail}</p>
      <p>${formatTime(item.created_at)}</p>
    </div>
  `).join('');
}

async function loadHealth() {
  const health = await api('/health');
  $('#healthStatus').textContent = `后端正常 · ${health.status}`;
  renderMetrics(health.counts);
}

async function loadServices() {
  const keyword = encodeURIComponent($('#keyword').value.trim());
  const category = encodeURIComponent($('#category').value);
  const data = await api(`/services?keyword=${keyword}&category=${category}`);
  state.services = data.list || [];
  renderServices();
}

async function loadProfile() {
  state.profile = await api('/profile');
  renderProfile();
}

async function loadReminders() {
  const data = await api('/reminders');
  state.reminders = data.list || [];
  renderReminders();
}

async function loadAdmin() {
  state.admin = await api('/admin/summary');
  renderAdmin();
}

function formatTime(value) {
  if (!value) return '';
  return String(value).replace('T', ' ').slice(0, 16);
}

async function refreshAll() {
  try {
    await Promise.all([loadHealth(), loadServices(), loadProfile(), loadReminders(), loadAdmin()]);
  } catch (error) {
    $('#healthStatus').textContent = `后端异常 · ${error.message}`;
  }
}

$('#searchBtn').addEventListener('click', loadServices);
$('#keyword').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') loadServices();
});
$('#category').addEventListener('change', loadServices);
$('#loginBtn').addEventListener('click', async () => {
  await api('/auth/login', { method: 'POST', body: JSON.stringify({ phone: '13800138000' }) });
  await loadAdmin();
});
$('#submitBtn').addEventListener('click', async () => {
  await api('/applications', { method: 'POST', body: JSON.stringify({ serviceId: 2 }) });
  await loadProfile();
  await loadHealth();
});
$('#createReminderBtn').addEventListener('click', async () => {
  await api('/reminders', {
    method: 'POST',
    body: JSON.stringify({
      title: '医保待遇资格复核提醒',
      type: '医保到期',
      channel: '随申办消息',
      dueDate: '2026-06-25',
      priority: 5
    })
  });
  await loadReminders();
  await loadHealth();
  await loadAdmin();
});

refreshAll();
