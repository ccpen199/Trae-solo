const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const projectDir = path.resolve(__dirname, '..');
loadEnv(path.join(projectDir, '.env'));

const host = process.env.HOST || '127.0.0.1';
const frontendPort = Number(process.env.FRONTEND_PORT || 49106);
const backendPort = Number(process.env.BACKEND_PORT || 59106);
const dbPath = path.resolve(projectDir, process.env.DB_PATH || 'data/app.sqlite');

fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
initDatabase();

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || '';
  if (req.method === 'OPTIONS') {
    write(res, 204, '', origin);
    return;
  }

  try {
    const url = new URL(req.url, `http://${host}:${backendPort}`);
    const pathname = url.pathname;

    if (req.method === 'GET' && pathname === '/api/health') {
      json(res, 200, {
        ok: true,
        status: 'ok',
        project: 'may-89106',
        name: '山东省文旅场所智慧监管服务平台',
        db: dbPath,
        time: new Date().toISOString()
      }, origin);
      return;
    }

    if (req.method === 'POST' && pathname === '/api/auth/login') {
      const body = await readJson(req);
      addAudit('登录认证', `${body.username || '监管员'} 完成双因素认证`);
      json(res, 200, {
        token: 'demo-token-may-89106',
        user: { id: 1, name: '省级监管员', role: 'province_admin', region: '山东省' }
      }, origin);
      return;
    }

    if (req.method === 'GET' && pathname === '/api/overview') {
      const places = scalar('SELECT COUNT(*) FROM places');
      const online = scalar("SELECT COUNT(*) FROM places WHERE status = '在线'");
      const alarms = scalar("SELECT COUNT(*) FROM alarms WHERE status <> '已关闭'");
      const inspections = scalar("SELECT COUNT(*) FROM inspections WHERE status <> '已归档'");
      const reservations = scalar("SELECT COUNT(*) FROM reservations WHERE status IN ('待核销','已核销')");
      json(res, 200, {
        metrics: [
          { label: '备案场所', value: places, unit: '家' },
          { label: '在线场所', value: online, unit: '家' },
          { label: '实时告警', value: alarms, unit: '条' },
          { label: '巡检任务', value: inspections, unit: '项' },
          { label: '今日预约', value: reservations, unit: '人次' }
        ],
        heatmap: all('SELECT city, COUNT(*) AS total, SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) AS online FROM places GROUP BY city ORDER BY total DESC', ['在线']),
        trend: [
          { day: '周一', alarms: 18, visitors: 12600 },
          { day: '周二', alarms: 12, visitors: 11920 },
          { day: '周三', alarms: 22, visitors: 13880 },
          { day: '周四', alarms: 15, visitors: 13210 },
          { day: '周五', alarms: 28, visitors: 15140 }
        ]
      }, origin);
      return;
    }

    if (req.method === 'GET' && pathname === '/api/places') {
      const keyword = `%${url.searchParams.get('keyword') || ''}%`;
      const status = url.searchParams.get('status') || '';
      const city = url.searchParams.get('city') || '';
      const list = all(`
        SELECT * FROM places
        WHERE (name LIKE ? OR city LIKE ? OR district LIKE ? OR license_no LIKE ?)
          AND (? = '' OR status = ?)
          AND (? = '' OR city = ?)
        ORDER BY id DESC
      `, [keyword, keyword, keyword, keyword, status, status, city, city]);
      json(res, 200, { list, total: list.length }, origin);
      return;
    }

    if (req.method === 'POST' && pathname === '/api/places') {
      const body = await readJson(req);
      const now = new Date().toISOString();
      const result = db.prepare(`
        INSERT INTO places (name, city, district, address, manager, phone, license_no, capacity, status, risk_level, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        body.name || '新增文旅场所',
        body.city || '济南市',
        body.district || '历下区',
        body.address || '未填写',
        body.manager || '场所管理员',
        body.phone || '13800000000',
        body.license_no || `SD-WL-${Date.now().toString().slice(-6)}`,
        Number(body.capacity || 120),
        body.status || '待审核',
        body.risk_level || '低',
        now
      );
      addAudit('场所备案', `新增备案 ${body.name || '新增文旅场所'}`);
      json(res, 201, { id: result.lastInsertRowid, message: '备案已提交' }, origin);
      return;
    }

    if (req.method === 'GET' && pathname === '/api/verifications') {
      json(res, 200, { list: all('SELECT * FROM verifications ORDER BY id DESC LIMIT 50') }, origin);
      return;
    }

    if (req.method === 'GET' && pathname === '/api/reservations') {
      json(res, 200, { list: all('SELECT * FROM reservations ORDER BY id DESC LIMIT 50') }, origin);
      return;
    }

    if (req.method === 'GET' && pathname === '/api/alarms') {
      const status = url.searchParams.get('status') || '';
      const level = url.searchParams.get('level') || '';
      const list = all(`
        SELECT * FROM alarms
        WHERE (? = '' OR status = ?) AND (? = '' OR level = ?)
        ORDER BY created_at DESC
      `, [status, status, level, level]);
      json(res, 200, { list, total: list.length }, origin);
      return;
    }

    const alarmMatch = pathname.match(/^\/api\/alarms\/(\d+)\/handle$/);
    if (req.method === 'PATCH' && alarmMatch) {
      const body = await readJson(req);
      db.prepare('UPDATE alarms SET status = ?, handler = ?, result = ? WHERE id = ?')
        .run(body.status || '处置中', body.handler || '县级监管员', body.result || '已派发整改任务', Number(alarmMatch[1]));
      addAudit('AI告警处置', `告警 ${alarmMatch[1]} 更新为 ${body.status || '处置中'}`);
      json(res, 200, { message: '告警处置状态已更新' }, origin);
      return;
    }

    if (req.method === 'GET' && pathname === '/api/inspections') {
      json(res, 200, { list: all('SELECT * FROM inspections ORDER BY due_date ASC, id DESC') }, origin);
      return;
    }

    if (req.method === 'POST' && pathname === '/api/inspections') {
      const body = await readJson(req);
      const result = db.prepare(`
        INSERT INTO inspections (title, city, place_name, inspector, due_date, checklist, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        body.title || '网吧日常安全巡检',
        body.city || '济南市',
        body.place_name || '泉城数字文化空间',
        body.inspector || '县级巡检员',
        body.due_date || '2026-06-15',
        body.checklist || '实名登记,消防通道,AI摄像头在线',
        '待执行',
        new Date().toISOString()
      );
      addAudit('巡检任务', `创建巡检任务 ${body.title || '网吧日常安全巡检'}`);
      json(res, 201, { id: result.lastInsertRowid, message: '巡检任务已派发' }, origin);
      return;
    }

    if (req.method === 'GET' && pathname === '/api/analytics') {
      json(res, 200, {
        business: all('SELECT city, SUM(today_visitors) AS visitors, ROUND(AVG(avg_hours), 1) AS avg_hours FROM places GROUP BY city ORDER BY visitors DESC'),
        alarmTypes: all('SELECT type, COUNT(*) AS count FROM alarms GROUP BY type ORDER BY count DESC'),
        auditLogs: all('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 12')
      }, origin);
      return;
    }

    if (req.method === 'GET' && pathname === '/api/system/users') {
      json(res, 200, { list: all('SELECT * FROM users ORDER BY id') }, origin);
      return;
    }

    if (req.method === 'PATCH' && pathname.match(/^\/api\/system\/users\/\d+\/status$/)) {
      const id = Number(pathname.split('/')[4]);
      const body = await readJson(req);
      const status = body.status || '启用';
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
      if (!user) {
        json(res, 404, { error: 'user not found' }, origin);
        return;
      }
      db.prepare('UPDATE users SET status = ?, last_login = ? WHERE id = ?')
        .run(status, new Date().toISOString(), id);
      addAudit('后台管理', `${user.name} 账号状态更新为 ${status}`);
      json(res, 200, {
        message: '账号状态已更新',
        user: db.prepare('SELECT * FROM users WHERE id = ?').get(id)
      }, origin);
      return;
    }

    if (req.method === 'GET' && pathname === '/api/system/roles') {
      json(res, 200, {
        list: [
          { role: 'province_admin', name: '省级监管员', permissions: ['全省监管大屏', '跨市备案审核', 'AI告警督办', '审计导出'] },
          { role: 'city_admin', name: '市级监管员', permissions: ['辖区备案审核', '实名核验抽查', '预约限流配置', '巡检派发'] },
          { role: 'county_admin', name: '县级监管员', permissions: ['场所巡检闭环', '告警现场处置', '经营数据复核'] },
          { role: 'place_manager', name: '场所管理员', permissions: ['本场所备案变更', '预约核销', '整改反馈'] }
        ]
      }, origin);
      return;
    }

    if (req.method === 'GET' && pathname === '/api/system/audit') {
      const module = url.searchParams.get('module') || '';
      const list = all(`
        SELECT * FROM audit_logs
        WHERE (? = '' OR module = ?)
        ORDER BY id DESC
        LIMIT 30
      `, [module, module]);
      json(res, 200, { list }, origin);
      return;
    }

    json(res, 404, { error: 'API endpoint not found', path: pathname }, origin);
  } catch (error) {
    json(res, 500, { error: error.message || String(error) }, origin);
  }
});

server.listen(backendPort, host, () => {
  console.log(`Backend ready on http://${host}:${backendPort}`);
});

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)=(.*)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS places (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      district TEXT NOT NULL,
      address TEXT NOT NULL,
      manager TEXT NOT NULL,
      phone TEXT NOT NULL,
      license_no TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      status TEXT NOT NULL,
      risk_level TEXT NOT NULL,
      today_visitors INTEGER DEFAULT 0,
      avg_hours REAL DEFAULT 0,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      place_name TEXT NOT NULL,
      person_name TEXT NOT NULL,
      id_tail TEXT NOT NULL,
      age INTEGER NOT NULL,
      result TEXT NOT NULL,
      note TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      place_name TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      visitor_name TEXT NOT NULL,
      people_count INTEGER NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS alarms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      place_name TEXT NOT NULL,
      city TEXT NOT NULL,
      type TEXT NOT NULL,
      level TEXT NOT NULL,
      status TEXT NOT NULL,
      description TEXT NOT NULL,
      handler TEXT,
      result TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS inspections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      city TEXT NOT NULL,
      place_name TEXT NOT NULL,
      inspector TEXT NOT NULL,
      due_date TEXT NOT NULL,
      checklist TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      region TEXT NOT NULL,
      status TEXT NOT NULL,
      last_login TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      module TEXT NOT NULL,
      action TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  if (scalar('SELECT COUNT(*) FROM places') > 0) return;
  const now = new Date().toISOString();
  const placeInsert = db.prepare(`
    INSERT INTO places (name, city, district, address, manager, phone, license_no, capacity, status, risk_level, today_visitors, avg_hours, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  [
    ['泉城数字文化空间', '济南市', '历下区', '文化东路 66 号', '李明', '13805310001', 'SD-WL-370102-001', 180, '在线', '中', 1280, 2.8],
    ['青岛海岸网吧', '青岛市', '市南区', '香港中路 18 号', '王磊', '13805320002', 'SD-WL-370202-014', 220, '在线', '低', 1640, 3.1],
    ['烟台智享电竞馆', '烟台市', '芝罘区', '南大街 102 号', '赵宁', '13805350003', 'SD-WL-370602-021', 160, '整改中', '高', 860, 3.7],
    ['潍坊云端文化驿站', '潍坊市', '奎文区', '东风东街 77 号', '周倩', '13805360004', 'SD-WL-370705-033', 120, '待审核', '低', 420, 1.9],
    ['临沂沂蒙数字娱乐中心', '临沂市', '兰山区', '沂蒙路 58 号', '陈宇', '13805390005', 'SD-WL-371302-009', 240, '在线', '中', 1910, 3.4]
  ].forEach((row) => placeInsert.run(...row, now));

  const verifyInsert = db.prepare('INSERT INTO verifications (place_name, person_name, id_tail, age, result, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
  [
    ['泉城数字文化空间', '张某', '0421', 28, '通过', '公安人口库核验一致'],
    ['烟台智享电竞馆', '刘某', '9918', 16, '异常', '未成年人入内预警'],
    ['青岛海岸网吧', '孙某', '2387', 33, '通过', '实名登记完成']
  ].forEach((row) => verifyInsert.run(...row, now));

  const reservationInsert = db.prepare('INSERT INTO reservations (place_name, time_slot, visitor_name, people_count, status, created_at) VALUES (?, ?, ?, ?, ?, ?)');
  [
    ['泉城数字文化空间', '14:00-16:00', '预约用户 A', 2, '待核销'],
    ['青岛海岸网吧', '18:00-20:00', '预约用户 B', 4, '已核销'],
    ['临沂沂蒙数字娱乐中心', '20:00-22:00', '预约用户 C', 3, '待核销']
  ].forEach((row) => reservationInsert.run(...row, now));

  const alarmInsert = db.prepare('INSERT INTO alarms (place_name, city, type, level, status, description, handler, result, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  [
    ['烟台智享电竞馆', '烟台市', '未成年人入内', '高', '待处置', '实名核验显示 16 岁人员尝试入场', '', '', now],
    ['泉城数字文化空间', '济南市', '吸烟检测', '中', '处置中', 'AI 摄像头检测到二层包间疑似吸烟', '历下区监管员', '已通知场所整改', now],
    ['青岛海岸网吧', '青岛市', '摄像头离线', '低', '已关闭', '3 号通道摄像头离线 8 分钟', '市南区监管员', '设备恢复在线', now]
  ].forEach((row) => alarmInsert.run(...row));

  const inspectionInsert = db.prepare('INSERT INTO inspections (title, city, place_name, inspector, due_date, checklist, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  [
    ['暑期未成年人专项巡检', '烟台市', '烟台智享电竞馆', '芝罘区巡检员', '2026-06-12', '实名核验,AI告警,消防通道', '待执行'],
    ['经营数据自动上报复核', '济南市', '泉城数字文化空间', '历下区巡检员', '2026-06-10', '上报日志,营业时长,客流统计', '执行中'],
    ['许可证备案材料复查', '潍坊市', '潍坊云端文化驿站', '奎文区监管员', '2026-06-14', '消防许可证,治安许可证,法人信息', '待执行']
  ].forEach((row) => inspectionInsert.run(...row, now));

  const userInsert = db.prepare('INSERT INTO users (name, role, region, status, last_login) VALUES (?, ?, ?, ?, ?)');
  [
    ['省级监管员', '省级监管员', '山东省', '启用', now],
    ['济南市监管员', '市级监管员', '济南市', '启用', now],
    ['历下区巡检员', '县级监管员', '历下区', '启用', now],
    ['场所管理员李明', '场所管理员', '泉城数字文化空间', '待审核', now]
  ].forEach((row) => userInsert.run(...row));
  addAudit('系统初始化', 'SQLite 演示数据已写入');
}

function scalar(sql, params = []) {
  const row = db.prepare(sql).get(...params);
  return Number(Object.values(row || { value: 0 })[0] || 0);
}

function all(sql, params = []) {
  return db.prepare(sql).all(...params);
}

function addAudit(module, action) {
  db.prepare('INSERT INTO audit_logs (module, action, created_at) VALUES (?, ?, ?)')
    .run(module, action, new Date().toISOString());
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 1024) reject(new Error('request body too large'));
    });
    req.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
  });
}

function write(res, status, body, origin) {
  const allowedOrigin = /^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin)
    ? origin
    : `http://127.0.0.1:${frontendPort}`;
  res.writeHead(status, {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
    'Content-Type': 'application/json; charset=utf-8'
  });
  res.end(body);
}

function json(res, status, payload, origin) {
  write(res, status, JSON.stringify(payload), origin);
}
