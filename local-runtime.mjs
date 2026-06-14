import http from 'node:http';
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { URL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

function loadEnv() {
  try {
    const env = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
    for (const line of env.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
      const [key, ...rest] = trimmed.split('=');
      if (!process.env[key]) process.env[key] = rest.join('=');
    }
  } catch {
    // Local runtime can start with defaults.
  }
}

loadEnv();

const HOST = process.env.HOST || process.env.BACKEND_HOST || '127.0.0.1';
const FRONTEND_HOST = process.env.FRONTEND_HOST || HOST;
const BACKEND_HOST = process.env.BACKEND_HOST || HOST;
const FRONTEND_PORT = Number(process.env.FRONTEND_PORT || 49207);
const BACKEND_PORT = Number(process.env.BACKEND_PORT || process.env.PORT || 59207);
const API_PREFIX = process.env.API_PREFIX || '/api/v1';
const mode = process.argv[2] || 'both';

mkdirSync(resolve(process.cwd(), 'data'), { recursive: true });
const db = new DatabaseSync(resolve(process.cwd(), 'data/runtime.sqlite'));

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS service_items (
      id TEXT PRIMARY KEY,
      item_code TEXT NOT NULL,
      item_name TEXT NOT NULL,
      department TEXT NOT NULL,
      time_limit TEXT NOT NULL,
      materials TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      applicant TEXT NOT NULL,
      item_name TEXT NOT NULL,
      status TEXT NOT NULL,
      current_node TEXT NOT NULL,
      due_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS policies (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  const count = db.prepare('SELECT COUNT(*) AS count FROM service_items').get().count;
  if (count > 0) return;

  const insertItem = db.prepare(`
    INSERT INTO service_items (id, item_code, item_name, department, time_limit, materials)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertItem.run('si-001', '114401000001', '居住证办理', '公安局', '7 working days', '身份证、居住证明、电子照片');
  insertItem.run('si-002', '114401000002', '社保卡申领', '人社局', '5 working days', '身份证、社保缴费记录');
  insertItem.run('si-003', '114401000003', '营业执照设立登记', '市场监管局', '3 working days', '电子表单、住所证明、经营者身份信息');

  const insertApp = db.prepare(`
    INSERT INTO applications (id, applicant, item_name, status, current_node, due_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertApp.run('app-20260614-001', '陈女士', '居住证办理', 'PRE_REVIEWING', '智能预审', '2026-06-17');
  insertApp.run('app-20260614-002', '广州政务小程序', '社保卡申领', 'APPROVING', '部门协同审批', '2026-06-18');
  insertApp.run('app-20260614-003', '李先生', '营业执照设立登记', 'CERTIFICATE_ISSUED', '电子证照签发', '2026-06-14');

  const insertPolicy = db.prepare(`
    INSERT INTO policies (id, title, category, updated_at)
    VALUES (?, ?, ?, ?)
  `);
  insertPolicy.run('pol-001', '广州市政务服务事项标准化指引', '办事指南', '2026-06-14');
  insertPolicy.run('pol-002', '电子证照跨部门调用规范', '政策文件', '2026-06-12');
  insertPolicy.run('pol-003', '移动端实名核验与粤省事对接说明', '接口规范', '2026-06-10');
}

initDb();

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization',
  });
  res.end(body);
}

function sendHtml(res, html) {
  res.writeHead(200, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
  });
  res.end(html);
}

function serviceItems() {
  return db.prepare('SELECT * FROM service_items ORDER BY item_code').all();
}

function applications() {
  return db.prepare('SELECT * FROM applications ORDER BY due_at').all();
}

function policies() {
  return db.prepare('SELECT * FROM policies ORDER BY updated_at DESC').all();
}

function handleBackend(req, res) {
  if (req.method === 'OPTIONS') return sendJson(res, 204, {});
  const url = new URL(req.url || '/', `http://${BACKEND_HOST}:${BACKEND_PORT}`);
  const path = url.pathname.replace(/\/$/, '') || '/';

  if (path === '/api/health' || path === `${API_PREFIX}/health`) {
    return sendJson(res, 200, {
      success: true,
      status: 'ok',
      service: 'gz-government-service-local',
      database: 'sqlite',
      frontendUrl: `http://${FRONTEND_HOST}:${FRONTEND_PORT}/`,
      backendUrl: `http://${BACKEND_HOST}:${BACKEND_PORT}`,
    });
  }

  if (path === '/api/search' || path === `${API_PREFIX}/search`) {
    const q = (url.searchParams.get('q') || '').trim();
    const rows = [...serviceItems(), ...applications(), ...policies()].filter((item) =>
      JSON.stringify(item).includes(q),
    );
    return sendJson(res, 200, { success: true, query: q, results: rows });
  }

  if (path === `${API_PREFIX}/service-items` || path === '/api/service-items') {
    return sendJson(res, 200, { success: true, data: serviceItems() });
  }

  if (path === `${API_PREFIX}/applications` || path === '/api/applications') {
    return sendJson(res, 200, { success: true, data: applications() });
  }

  if (path === `${API_PREFIX}/policies` || path === '/api/policies') {
    return sendJson(res, 200, { success: true, data: policies() });
  }

  if (path === `${API_PREFIX}/analytics/hotspots` || path === '/api/analytics/hotspots') {
    return sendJson(res, 200, {
      success: true,
      data: [
        { name: '居住证办理', count: 12860, bottleneck: '材料补正' },
        { name: '社保卡申领', count: 9820, bottleneck: '身份核验' },
        { name: '营业执照设立登记', count: 7540, bottleneck: '部门协同审批' },
      ],
    });
  }

  if (path === `${API_PREFIX}/open-api/catalog` || path === '/api/open-api/catalog') {
    return sendJson(res, 200, {
      success: true,
      data: [
        { method: 'GET', path: `${API_PREFIX}/service-items`, scope: 'THIRD_PARTY' },
        { method: 'POST', path: `${API_PREFIX}/applications`, scope: 'THIRD_PARTY' },
        { method: 'GET', path: `${API_PREFIX}/analytics/hotspots`, scope: 'INTERNAL' },
      ],
    });
  }

  return sendJson(res, 404, { success: false, error: 'API not found' });
}

function pageHtml() {
  const items = serviceItems();
  const apps = applications();
  const policyRows = policies();
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>广州市统一政务服务移动端后端支撑平台</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f6f8fb; color: #162033; }
    header { background: #0b4f6c; color: white; padding: 18px 28px; display: flex; justify-content: space-between; align-items: center; gap: 16px; }
    h1 { margin: 0; font-size: 22px; }
    .sub { margin-top: 4px; color: #d7eef7; font-size: 13px; }
    main { padding: 24px; max-width: 1280px; margin: 0 auto; }
    .grid { display: grid; gap: 16px; }
    .stats { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .columns { grid-template-columns: 1.2fr .8fr; align-items: start; }
    .card { background: white; border: 1px solid #dfe7f0; border-radius: 8px; padding: 18px; box-shadow: 0 10px 24px rgba(22, 32, 51, .05); }
    .stat { display: flex; flex-direction: column; gap: 6px; }
    .stat strong { font-size: 28px; color: #0b4f6c; }
    h2 { margin: 0 0 12px; font-size: 18px; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th, td { padding: 10px 8px; border-bottom: 1px solid #edf1f6; text-align: left; }
    th { color: #667085; font-size: 12px; background: #f8fafc; }
    .badge { display: inline-flex; border-radius: 999px; padding: 4px 9px; font-size: 12px; background: #e7f6ed; color: #137333; font-weight: 600; }
    .warn { background: #fff4df; color: #9a5b00; }
    .list { display: grid; gap: 10px; }
    .item { border: 1px solid #edf1f6; border-radius: 8px; padding: 12px; background: #fbfdff; }
    .toolbar { display: flex; gap: 10px; align-items: center; }
    input { width: 320px; max-width: 100%; border: 1px solid #bfd0dd; border-radius: 8px; padding: 10px 12px; }
    button { border: 0; border-radius: 8px; padding: 10px 14px; background: #ffb703; color: #162033; font-weight: 700; cursor: pointer; }
    pre { white-space: pre-wrap; background: #0f172a; color: #dbeafe; border-radius: 8px; padding: 12px; min-height: 78px; }
    @media (max-width: 900px) { .stats, .columns { grid-template-columns: 1fr; } header { align-items: flex-start; flex-direction: column; } }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>广州市统一政务服务移动端后端支撑平台</h1>
      <div class="sub">事项标准化管理 · 多源身份认证 · 全流程线上办件 · 电子证照签发 · 开放 API</div>
    </div>
    <div class="toolbar">
      <input id="q" placeholder="搜索事项编码、办件、政策文件..." />
      <button onclick="runSearch()">搜索筛选</button>
    </div>
  </header>
  <main class="grid">
    <section class="grid stats">
      <div class="card stat"><span>标准化事项</span><strong>${items.length}</strong><small>事项编码/材料清单/电子表单模板</small></div>
      <div class="card stat"><span>线上办件</span><strong>${apps.length}</strong><small>预约、材料上传、智能预审、审批</small></div>
      <div class="card stat"><span>政策语料</span><strong>${policyRows.length}</strong><small>政策文件结构化入库与 AI 问答训练</small></div>
      <div class="card stat"><span>开放接口</span><strong>6</strong><small>第三方政务小程序 API 调用</small></div>
    </section>
    <section class="grid columns">
      <div class="card">
        <h2>办件全生命周期追踪</h2>
        <table>
          <thead><tr><th>办件号</th><th>申请人</th><th>事项</th><th>节点</th><th>状态</th><th>到期</th></tr></thead>
          <tbody>
            ${apps.map((app) => `<tr><td>${app.id}</td><td>${app.applicant}</td><td>${app.item_name}</td><td>${app.current_node}</td><td><span class="badge">${app.status}</span></td><td>${app.due_at}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div class="card">
        <h2>后台管理看板</h2>
        <div class="list">
          <div class="item"><strong>身份认证集成</strong><br />粤省事、人脸识别、社保卡 NFC、身份证核验</div>
          <div class="item"><strong>超时预警通知</strong><br />节点超时后短信/微信主动通知，后台留痕</div>
          <div class="item"><strong>堵点热力图</strong><br />高频事项使用量、材料补正率、部门协同耗时</div>
        </div>
      </div>
    </section>
    <section class="card">
      <h2>事项标准化与政策文件</h2>
      <table>
        <thead><tr><th>事项编码</th><th>事项名称</th><th>部门</th><th>办理时限</th><th>材料清单</th></tr></thead>
        <tbody>
          ${items.map((item) => `<tr><td>${item.item_code}</td><td>${item.item_name}</td><td>${item.department}</td><td>${item.time_limit}</td><td>${item.materials}</td></tr>`).join('')}
        </tbody>
      </table>
    </section>
    <section class="card">
      <h2>接口验证</h2>
      <button onclick="checkHealth()">检查 /api/health</button>
      <button onclick="loadHotspots()">加载堵点分析</button>
      <pre id="result">等待操作...</pre>
    </section>
  </main>
  <script>
    const apiBase = 'http://${BACKEND_HOST}:${BACKEND_PORT}';
    async function show(path) {
      const res = await fetch(apiBase + path);
      document.getElementById('result').textContent = JSON.stringify(await res.json(), null, 2);
    }
    function checkHealth() { show('/api/health'); }
    function loadHotspots() { show('${API_PREFIX}/analytics/hotspots'); }
    function runSearch() {
      const q = encodeURIComponent(document.getElementById('q').value || '居住证');
      show('/api/search?q=' + q);
    }
    checkHealth();
  </script>
</body>
</html>`;
}

function handleFrontend(req, res) {
  const url = new URL(req.url || '/', `http://${FRONTEND_HOST}:${FRONTEND_PORT}`);
  if (url.pathname === '/' || url.pathname === '/index.html') {
    return sendHtml(res, pageHtml());
  }
  return sendHtml(res, pageHtml());
}

function startBackend() {
  const server = http.createServer(handleBackend);
  server.listen(BACKEND_PORT, BACKEND_HOST, () => {
    console.log(`[backend] ready http://${BACKEND_HOST}:${BACKEND_PORT}`);
  });
  return server;
}

function startFrontend() {
  const server = http.createServer(handleFrontend);
  server.listen(FRONTEND_PORT, FRONTEND_HOST, () => {
    console.log(`[frontend] ready http://${FRONTEND_HOST}:${FRONTEND_PORT}`);
  });
  return server;
}

const servers = [];
if (mode === 'backend' || mode === 'both') servers.push(startBackend());
if (mode === 'frontend' || mode === 'both') servers.push(startFrontend());

function shutdown(signal) {
  console.log(`${signal} received`);
  let remaining = servers.length;
  if (remaining === 0) process.exit(0);
  for (const server of servers) {
    server.close(() => {
      remaining -= 1;
      if (remaining === 0) process.exit(0);
    });
  }
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
