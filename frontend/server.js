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

const env = loadEnv();
const HOST = env.HOST || '127.0.0.1';
const PORT = Number(env.FRONTEND_PORT || 49086);
const API_BASE = env.API_BASE_URL || `http://127.0.0.1:${env.BACKEND_PORT || 59086}/api`;

const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>may-89086 本地复验工作台</title>
  <style>
    :root { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #1e293b; background: #f4f7f6; }
    body { margin: 0; }
    header { padding: 28px clamp(18px, 5vw, 48px); background: #184e5d; color: white; }
    main { padding: 22px clamp(18px, 5vw, 48px); display: grid; gap: 16px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
    section { background: white; border: 1px solid #d7dee8; border-radius: 8px; padding: 18px; }
    h1 { margin: 0 0 6px; font-size: clamp(24px, 4vw, 34px); letter-spacing: 0; }
    h2 { margin: 0 0 12px; font-size: 18px; letter-spacing: 0; }
    p { margin: 0; color: #536173; line-height: 1.6; }
    ul { margin: 0; padding-left: 18px; }
    li { margin: 8px 0; }
    textarea, button { font: inherit; border-radius: 6px; border: 1px solid #bcc8d7; padding: 10px 12px; }
    textarea { width: 100%; box-sizing: border-box; min-height: 84px; resize: vertical; }
    button { margin-top: 10px; background: #2d6a4f; color: white; border-color: #2d6a4f; cursor: pointer; }
    .status { display: inline-flex; align-items: center; gap: 8px; color: #1f7a49; font-weight: 700; }
    .dot { width: 10px; height: 10px; border-radius: 999px; background: currentColor; }
    .meta { color: #64748b; font-size: 14px; }
  </style>
</head>
<body>
  <header>
    <h1>本地复验工作台</h1>
    <p>订单 may-89086 的前端、后端和 SQLite 服务已恢复。</p>
  </header>
  <main>
    <div class="grid">
      <section>
        <h2>健康状态</h2>
        <p id="status" class="status"><span class="dot"></span>正在连接后端</p>
        <p id="meta" class="meta"></p>
      </section>
      <section>
        <h2>写入复验记录</h2>
        <textarea id="note">页面已进入本地全栈服务。</textarea>
        <button id="save">写入 SQLite</button>
      </section>
    </div>
    <div class="grid">
      <section>
        <h2>任务列表</h2>
        <ul id="tasks"></ul>
      </section>
      <section>
        <h2>复验记录</h2>
        <ul id="notes"></ul>
      </section>
    </div>
  </main>
  <script>
    const API_BASE = ${JSON.stringify(API_BASE)};
    async function api(path, options) {
      const response = await fetch(API_BASE + path, options);
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    }
    async function refresh() {
      const health = await api('/health');
      document.getElementById('status').innerHTML = '<span class="dot"></span>后端运行正常';
      document.getElementById('meta').textContent = '端口 ' + health.port + ' · SQLite ' + health.sqlite;
      const tasks = (await api('/tasks')).data;
      document.getElementById('tasks').innerHTML = tasks.map(task => '<li><strong>' + task.title + '</strong><br><span class="meta">' + task.owner + ' · ' + task.status + ' · ' + task.priority + '</span></li>').join('');
      const notes = (await api('/notes')).data;
      document.getElementById('notes').innerHTML = notes.map(note => '<li>' + note.content + '<br><span class="meta">' + note.created_at + '</span></li>').join('');
    }
    document.getElementById('save').addEventListener('click', async () => {
      await api('/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: document.getElementById('note').value })
      });
      await refresh();
    });
    refresh().catch(error => {
      const el = document.getElementById('status');
      el.textContent = '后端连接失败：' + error.message;
      el.style.color = '#b42318';
    });
  </script>
</body>
</html>`;

http.createServer((req, res) => {
  if (req.url === '/' || req.url.startsWith('/?')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found');
}).listen(PORT, HOST, () => {
  console.log(`may-89086 frontend listening on http://${HOST}:${PORT}`);
});
