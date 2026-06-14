const http = require('http');
const fs = require('fs');
const path = require('path');

const PROJECT_DIR = path.resolve(__dirname, '..');
const ENV_FILE = path.join(PROJECT_DIR, '.env');

function loadEnv() {
  const env = {};
  if (!fs.existsSync(ENV_FILE)) return env;
  for (const rawLine of fs.readFileSync(ENV_FILE, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const index = line.indexOf('=');
    if (index === -1) continue;
    env[line.slice(0, index)] = line.slice(index + 1);
  }
  return env;
}

function getArg(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index !== -1 && process.argv[index + 1]) return process.argv[index + 1];
  return fallback;
}

const env = loadEnv();
const HOST = getArg('--host', env.HOST || '127.0.0.1');
const PORT = Number(getArg('--port', env.FRONTEND_PORT || 49082));
const API_BASE = env.API_BASE_URL || `http://127.0.0.1:${env.BACKEND_PORT || 59082}/api`;

const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>may-89082 本地服务工作台</title>
  <style>
    :root { color-scheme: light; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #18202c; background: #f5f7fb; }
    body { margin: 0; }
    header { background: #245b77; color: white; padding: 26px clamp(18px, 4vw, 44px); }
    main { padding: 24px clamp(18px, 4vw, 44px); display: grid; gap: 18px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
    section { background: white; border: 1px solid #d9e1ea; border-radius: 8px; padding: 18px; box-shadow: 0 1px 2px rgba(16, 24, 40, .05); }
    h1 { margin: 0 0 6px; font-size: clamp(24px, 4vw, 34px); letter-spacing: 0; }
    h2 { margin: 0 0 12px; font-size: 18px; letter-spacing: 0; }
    p { margin: 0; color: #4a5565; line-height: 1.6; }
    ul { margin: 0; padding-left: 18px; }
    li { margin: 8px 0; }
    label { display: grid; gap: 6px; margin-bottom: 12px; color: #344256; }
    input, select, button { font: inherit; border-radius: 6px; border: 1px solid #bdc8d6; padding: 10px 12px; }
    button { background: #2c6e49; color: white; border-color: #2c6e49; cursor: pointer; }
    .status { display: inline-flex; align-items: center; gap: 8px; font-weight: 600; color: #1f6f43; }
    .dot { width: 10px; height: 10px; border-radius: 50%; background: currentColor; }
    .muted { color: #65758b; font-size: 14px; }
  </style>
</head>
<body>
  <header>
    <h1>本地服务工作台</h1>
    <p>订单 may-89082 的前端、后端和 SQLite 链路已接入本地端口。</p>
  </header>
  <main>
    <div class="grid">
      <section>
        <h2>服务状态</h2>
        <p id="status" class="status"><span class="dot"></span>正在检查后端</p>
        <p class="muted" id="healthMeta"></p>
      </section>
      <section>
        <h2>提交申请</h2>
        <label>申请人<input id="applicant" value="窗口用户"></label>
        <label>事项<select id="itemSelect"></select></label>
        <button id="submitBtn">提交</button>
      </section>
    </div>
    <div class="grid">
      <section>
        <h2>服务事项</h2>
        <ul id="items"></ul>
      </section>
      <section>
        <h2>申请记录</h2>
        <ul id="apps"></ul>
      </section>
    </div>
  </main>
  <script>
    const API_BASE = ${JSON.stringify(API_BASE)};
    const statusEl = document.getElementById('status');
    const metaEl = document.getElementById('healthMeta');
    const itemsEl = document.getElementById('items');
    const appsEl = document.getElementById('apps');
    const itemSelect = document.getElementById('itemSelect');

    async function fetchJson(path, options) {
      const response = await fetch(API_BASE + path, options);
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    }

    async function refresh() {
      const health = await fetchJson('/health');
      statusEl.innerHTML = '<span class="dot"></span>后端运行正常';
      metaEl.textContent = 'SQLite: ' + health.sqlite + '，端口: ' + health.port;

      const items = (await fetchJson('/service-items')).data;
      itemsEl.innerHTML = items.map(item => '<li><strong>' + item.title + '</strong><br><span class="muted">' + item.department + ' · ' + item.status + '</span></li>').join('');
      itemSelect.innerHTML = items.map(item => '<option value="' + item.title + '">' + item.title + '</option>').join('');

      const apps = (await fetchJson('/applications')).data;
      appsEl.innerHTML = apps.map(app => '<li><strong>' + app.applicant + '</strong>：' + app.item_title + '<br><span class="muted">' + app.status + ' · ' + app.created_at + '</span></li>').join('');
    }

    document.getElementById('submitBtn').addEventListener('click', async () => {
      await fetchJson('/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicant: document.getElementById('applicant').value,
          itemTitle: itemSelect.value
        })
      });
      await refresh();
    });

    refresh().catch(error => {
      statusEl.textContent = '后端检查失败：' + error.message;
      statusEl.style.color = '#b42318';
    });
  </script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url.startsWith('/?')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found');
});

server.listen(PORT, HOST, () => {
  console.log(`may-89082 frontend listening on http://${HOST}:${PORT}`);
});
