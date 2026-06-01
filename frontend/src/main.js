const backendPort = Number(window.location.port || 43454) + 10000;
const API_BASE = `${window.location.protocol}//${window.location.hostname}:${backendPort}/api`;

const app = document.querySelector('#app');

app.innerHTML = `
  <aside class="sidebar">
    <div class="brand">
      <span class="mark">54</span>
      <div>
        <strong>Service Ops</strong>
        <small>Local SQLite console</small>
      </div>
    </div>
    <nav>
      <a href="#overview" class="active">Overview</a>
      <a href="#sites">Sites</a>
      <a href="#orders">Orders</a>
      <a href="#events">Events</a>
    </nav>
    <div class="api-box">
      <span>API</span>
      <code>${API_BASE}</code>
    </div>
  </aside>
  <main class="content">
    <header>
      <div>
        <h1>Operations Readiness</h1>
        <p>Frontend, backend, and SQLite are running from this project directory.</p>
      </div>
      <button id="refresh" type="button">Refresh</button>
    </header>
    <section class="metrics" id="metrics"></section>
    <section class="layout">
      <article class="panel wide">
        <div class="panel-head">
          <h2>Service Sites</h2>
          <span id="health">Checking</span>
        </div>
        <div id="sites" class="site-list"></div>
      </article>
      <article class="panel">
        <div class="panel-head"><h2>Open Work</h2></div>
        <div id="orders" class="stack"></div>
      </article>
      <article class="panel">
        <div class="panel-head"><h2>Recent Events</h2></div>
        <div id="events" class="stack"></div>
      </article>
    </section>
  </main>
`;

async function request(path) {
  const response = await fetch(`${API_BASE}${path}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

function label(value) {
  return String(value || '').replace(/_/g, ' ');
}

function metric(title, value, tone) {
  return `<div class="metric ${tone || ''}"><span>${title}</span><strong>${value}</strong></div>`;
}

async function render() {
  const [health, dashboard] = await Promise.all([
    request('/health'),
    request('/dashboard')
  ]);

  document.querySelector('#health').textContent = health.status === 'ok' ? 'Backend online' : 'Backend issue';
  const summary = dashboard.summary;
  document.querySelector('#metrics').innerHTML = [
    metric('Sites', summary.sites, 'blue'),
    metric('Online', summary.online_sites, 'green'),
    metric('Open orders', summary.open_orders, 'amber'),
    metric('Warnings', summary.warnings, 'red')
  ].join('');

  document.querySelector('#sites').innerHTML = dashboard.sites.map((site) => `
    <div class="site-card">
      <div>
        <strong>${site.name}</strong>
        <span>${label(site.region)} region</span>
      </div>
      <div class="status ${site.status}">${label(site.status)}</div>
      <meter min="0" max="100" value="${site.capacity}"></meter>
    </div>
  `).join('');

  document.querySelector('#orders').innerHTML = dashboard.orders.map((order) => `
    <div class="row">
      <span class="pill ${order.priority}">${label(order.priority)}</span>
      <div>
        <strong>${order.title}</strong>
        <small>${order.site_name} - ${label(order.status)} - ${order.assignee}</small>
      </div>
    </div>
  `).join('');

  document.querySelector('#events').innerHTML = dashboard.events.map((event) => `
    <div class="row">
      <span class="dot ${event.severity}"></span>
      <div>
        <strong>${event.message}</strong>
        <small>${event.site_name} - ${label(event.event_type)}</small>
      </div>
    </div>
  `).join('');
}

document.querySelector('#refresh').addEventListener('click', () => {
  render().catch(showError);
});

function showError(error) {
  document.querySelector('#health').textContent = error.message;
  document.querySelector('#metrics').innerHTML = metric('Connection', 'offline', 'red');
}

render().catch(showError);
