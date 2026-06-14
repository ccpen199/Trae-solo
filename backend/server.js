const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const projectRoot = path.resolve(__dirname, '..');
const envPath = path.join(projectRoot, '.env');

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return Object.fromEntries(
    fs.readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index), line.slice(index + 1)];
      }),
  );
}

const env = { ...loadEnv(envPath), ...process.env };
const host = env.HOST || '127.0.0.1';
const port = Number(env.BACKEND_PORT || env.PORT || 59115);
const dbPath = path.resolve(projectRoot, env.DB_PATH || 'data/app.sqlite');

fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);
db.exec(`
  CREATE TABLE IF NOT EXISTS service_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metric_name TEXT NOT NULL,
    metric_value TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

const count = db.prepare('SELECT COUNT(*) AS count FROM service_metrics').get().count;
if (count === 0) {
  const insert = db.prepare('INSERT INTO service_metrics (metric_name, metric_value) VALUES (?, ?)');
  insert.run('active_codes', '1286000');
  insert.run('verification_total', '64200000');
  insert.run('service_categories', '12');
}

function sendJson(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  });
  res.end(JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    });
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://${host}:${port}`);

  if (url.pathname === '/api/health') {
    sendJson(res, 200, {
      ok: true,
      success: true,
      service: 'may-89115-backend',
      database: path.relative(projectRoot, dbPath),
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (url.pathname === '/api/dashboard/summary') {
    const rows = db.prepare('SELECT metric_name, metric_value FROM service_metrics').all();
    sendJson(res, 200, {
      success: true,
      data: Object.fromEntries(rows.map((row) => [row.metric_name, row.metric_value])),
    });
    return;
  }

  if (url.pathname === '/api/admin/stats' || url.pathname === '/api/admin/dashboard') {
    sendJson(res, 200, {
      success: true,
      data: {
        platform: '杭州数字身份后台管理',
        totalUsers: 12568000,
        activeUsersToday: 892000,
        totalServices: 47,
        totalVerifications: 35670000,
        modules: ['后台管理', '运营数据', '服务资源', '工单详情'],
      },
    });
    return;
  }

  if (url.pathname === '/api/auth/me' || url.pathname === '/api/users/profile' || url.pathname === '/api/user/profile') {
    sendJson(res, 200, {
      success: true,
      data: {
        id: 'hz-demo-user',
        name: '张三',
        role: 'admin',
        bureau: '杭州市数据局',
      },
    });
    return;
  }

  if (url.pathname === '/api/teachers' || url.pathname === '/api/courses' || url.pathname === '/api/bookings' || url.pathname === '/api/orders') {
    sendJson(res, 200, {
      success: true,
      data: [
        { id: 'svc-001', title: '市民码服务预约', status: 'active' },
        { id: 'svc-002', title: '无感核验工单', status: 'processing' },
        { id: 'svc-003', title: '公共服务资源详情', status: 'active' },
      ],
    });
    return;
  }

  if (url.pathname === '/api/search') {
    const keyword = url.searchParams.get('q') || '服务';
    sendJson(res, 200, {
      success: true,
      keyword,
      data: [
        { title: '杭州市民码', category: '市民码' },
        { title: '无感核验记录', category: '核验服务' },
        { title: '公共服务资源', category: '服务资源' },
        { title: '运营管理工单', category: '运营管理' },
      ].filter((item) => item.title.includes(keyword) || keyword === '服务'),
    });
    return;
  }

  sendJson(res, 404, { success: false, error: 'API not found' });
});

server.listen(port, host, () => {
  console.log(`may-89115 backend listening on http://${host}:${port}`);
});
