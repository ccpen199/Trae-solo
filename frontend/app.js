const statusEl = document.querySelector('#serviceStatus');
const appointmentsTable = document.querySelector('#appointmentsTable');
const escortList = document.querySelector('#escortList');
const patientList = document.querySelector('#patientList');
const refreshButton = document.querySelector('#refreshButton');

const setText = (selector, value) => {
  document.querySelector(selector).textContent = value;
};

async function api(path) {
  const response = await fetch(`/api${path}`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`${path} HTTP ${response.status}`);
  }
  return response.json();
}

function formatMoney(value) {
  return `¥${Number(value || 0).toLocaleString('zh-CN', { maximumFractionDigits: 0 })}`;
}

function renderAppointments(rows) {
  if (!rows.length) {
    appointmentsTable.innerHTML = '<tr><td colspan="5">暂无预约</td></tr>';
    return;
  }

  appointmentsTable.innerHTML = rows.map((item) => `
    <tr>
      <td>${item.patient_name || '-'}</td>
      <td>${item.hospital || '-'} / ${item.department || '-'}</td>
      <td>${item.escort_name || '待分配'}</td>
      <td>${item.appointment_time || '-'}</td>
      <td><span class="pill">${item.status || '-'}</span></td>
    </tr>
  `).join('');
}

function renderEscorts(rows) {
  escortList.innerHTML = rows.slice(0, 6).map((item) => `
    <article class="list-item">
      <div>
        <strong>${item.name}</strong>
        <span>${item.specialty}</span>
      </div>
      <b>${item.status}</b>
    </article>
  `).join('') || '<p class="empty">暂无陪诊员</p>';
}

function renderPatients(rows) {
  patientList.innerHTML = rows.slice(0, 6).map((item) => `
    <article class="list-item">
      <div>
        <strong>${item.name}</strong>
        <span>${item.hospital} / ${item.department}</span>
      </div>
      <b>${item.status}</b>
    </article>
  `).join('') || '<p class="empty">暂无患者档案</p>';
}

async function loadDashboard() {
  statusEl.textContent = '连接中';
  statusEl.className = 'status';

  const [health, dashboard, escorts, patients] = await Promise.all([
    api('/health'),
    api('/dashboard'),
    api('/escorts'),
    api('/patients'),
  ]);

  setText('#patientsCount', dashboard.stats.patients);
  setText('#escortsCount', dashboard.stats.escorts);
  setText('#todayCount', dashboard.stats.todayAppointments);
  setText('#revenueCount', formatMoney(dashboard.stats.revenue));
  renderAppointments(dashboard.upcoming || []);
  renderEscorts(escorts || []);
  renderPatients(patients || []);

  statusEl.textContent = `${health.service} 正常`;
  statusEl.className = 'status ok';
}

refreshButton.addEventListener('click', () => {
  loadDashboard().catch(showError);
});

function showError(error) {
  statusEl.textContent = `接口异常：${error.message}`;
  statusEl.className = 'status error';
  appointmentsTable.innerHTML = '<tr><td colspan="5">后端接口暂不可用</td></tr>';
}

loadDashboard().catch(showError);
