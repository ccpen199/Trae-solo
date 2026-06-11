import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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
const port = Number(env.BACKEND_PORT || env.PORT || 59113);
const dbPath = path.resolve(projectRoot, env.DB_PATH || 'data/app.sqlite');

fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);
db.exec(`
  CREATE TABLE IF NOT EXISTS service_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_name TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

const count = db.prepare('SELECT COUNT(*) AS count FROM service_events').get().count;
if (count === 0) {
  const insert = db.prepare('INSERT INTO service_events (event_name, payload) VALUES (?, ?)');
  insert.run('policy_search_ready', JSON.stringify({ module: '政策检索', records: 28 }));
  insert.run('admin_dashboard_ready', JSON.stringify({ module: '数据看板', cityCount: 12 }));
  insert.run('social_insurance_ready', JSON.stringify({ module: '社保查询', services: ['参保查询', '证明生成'] }));
}

function json(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  });
  res.end(data);
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
    json(res, 200, {
      ok: true,
      success: true,
      service: 'may-89113-backend',
      database: path.relative(projectRoot, dbPath),
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (url.pathname === '/api/admin/summary') {
    json(res, 200, {
      success: true,
      data: {
        platform: '粤人社移动政务中台',
        modules: ['社保查询', '就业服务', '人才服务', '劳动维权', '政策检索', '数据看板'],
        events: db.prepare('SELECT COUNT(*) AS count FROM service_events').get().count,
      },
    });
    return;
  }

  if (url.pathname === '/api/admin/stats' || url.pathname === '/api/admin/dashboard') {
    json(res, 200, {
      success: true,
      data: {
        platform: '粤人社后台管理',
        users: 12860,
        services: 42,
        policies: 28,
        todayRequests: 356,
        modules: ['后台管理', '政策检索', '操作日志', '数据看板'],
      },
    });
    return;
  }

  if (url.pathname === '/api/auth/me' || url.pathname === '/api/users/profile' || url.pathname === '/api/user/profile') {
    json(res, 200, {
      success: true,
      data: {
        id: 'gd-demo-user',
        name: '张伟',
        role: 'admin',
        city: '广州',
      },
    });
    return;
  }

  if (url.pathname === '/api/ide/v1/text_to_image') {
    json(res, 200, {
      success: true,
      data: {
        image: 'local-placeholder',
        prompt: url.searchParams.get('prompt') || '',
      },
    });
    return;
  }

  if (url.pathname === '/api/search') {
    const keyword = url.searchParams.get('q') || '政策';
    json(res, 200, {
      success: true,
      keyword,
      data: [
        { title: '社会保险缴费基数政策', category: '社会保险' },
        { title: '就业困难人员认定办法', category: '就业服务' },
        { title: '职称评审管理服务实施办法', category: '人才服务' },
      ].filter((item) => item.title.includes(keyword) || keyword === '政策'),
    });
    return;
  }

  json(res, 404, { success: false, error: 'API not found' });
});

server.listen(port, host, () => {
  console.log(`may-89113 backend listening on http://${host}:${port}`);
});
