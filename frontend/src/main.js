import './styles.css';

const app = document.querySelector('#app');

const state = {
  services: [],
  selected: null,
  stats: null,
  query: '',
  status: '',
};

async function request(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.json();
}

function statusClass(status) {
  return status === 'online' ? 'status-online' : status === 'ready' ? 'status-ready' : 'status-offline';
}

function render() {
  app.innerHTML = `
    <header class="topbar">
      <div>
        <div class="eyebrow">may-89084</div>
        <h1>Local Service Console</h1>
      </div>
      <nav>
        <a href="#services">Services</a>
        <a href="#admin">Admin</a>
        <a href="#details">Details</a>
      </nav>
    </header>
    <main>
      <section class="toolbar" id="services">
        <label>
          Search
          <input id="query" value="${state.query}" placeholder="service, category, owner" />
        </label>
        <label>
          Status
          <select id="status">
            <option value="">All</option>
            <option value="online" ${state.status === 'online' ? 'selected' : ''}>online</option>
            <option value="ready" ${state.status === 'ready' ? 'selected' : ''}>ready</option>
          </select>
        </label>
        <button id="refresh">Refresh</button>
      </section>

      <section class="grid">
        ${state.services.map((service) => `
          <article class="service-card" data-id="${service.id}">
            <div class="card-head">
              <h2>${service.name}</h2>
              <span class="pill ${statusClass(service.status)}">${service.status}</span>
            </div>
            <p>${service.description}</p>
            <div class="meta">
              <span>${service.category}</span>
              <span>${service.owner}</span>
            </div>
            <button class="details-button" data-id="${service.id}">View Details</button>
          </article>
        `).join('')}
      </section>

      <section class="admin" id="admin">
        <h2>Admin Dashboard</h2>
        <div class="metrics">
          <div><strong>${state.stats?.totalServices ?? 0}</strong><span>Total services</span></div>
          <div><strong>${state.stats?.onlineServices ?? 0}</strong><span>Online</span></div>
          <div><strong>${state.stats?.auditEvents ?? 0}</strong><span>Audit events</span></div>
        </div>
      </section>

      <section class="details" id="details">
        <h2>Detail View</h2>
        ${state.selected ? `
          <h3>${state.selected.service.name}</h3>
          <p>${state.selected.service.description}</p>
          <ul>
            ${state.selected.events.map((event) => `<li>${event.created_at} - ${event.action}: ${event.result}</li>`).join('')}
          </ul>
        ` : '<p>Select a service to inspect audit details.</p>'}
      </section>
    </main>
  `;

  document.querySelector('#query').addEventListener('input', (event) => {
    state.query = event.target.value;
  });
  document.querySelector('#status').addEventListener('change', (event) => {
    state.status = event.target.value;
    loadServices();
  });
  document.querySelector('#refresh').addEventListener('click', loadAll);
  document.querySelectorAll('.details-button').forEach((button) => {
    button.addEventListener('click', () => loadDetails(button.dataset.id));
  });
  document.querySelector('#query').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      loadServices();
    }
  });
}

async function loadServices() {
  const params = new URLSearchParams();
  if (state.query) params.set('q', state.query);
  if (state.status) params.set('status', state.status);
  const result = await request(`/api/services?${params.toString()}`);
  state.services = result.data;
  render();
}

async function loadDetails(id) {
  state.selected = await request(`/api/services/${id}`);
  render();
}

async function loadAll() {
  const [services, stats] = await Promise.all([
    request('/api/services'),
    request('/api/admin/stats'),
  ]);
  state.services = services.data;
  state.stats = stats;
  render();
}

loadAll().catch((error) => {
  app.innerHTML = `<main class="error">Service console failed to load: ${error.message}</main>`;
});
