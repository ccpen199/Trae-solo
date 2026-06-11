import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

loadEnv(path.join(projectRoot, '.env'));

const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.BACKEND_PORT || process.env.PORT || 59117);
const dbPath = path.resolve(projectRoot, process.env.DB_PATH || 'data/app.sqlite');

fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS service_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_name TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    type_name TEXT NOT NULL,
    applicant_name TEXT NOT NULL,
    applicant_id_card TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    current_step INTEGER NOT NULL DEFAULT 1,
    total_steps INTEGER NOT NULL DEFAULT 4,
    submit_time TEXT NOT NULL,
    update_time TEXT NOT NULL,
    materials TEXT NOT NULL DEFAULT '[]',
    handler TEXT,
    approver TEXT,
    approval_opinion TEXT
  );
  CREATE TABLE IF NOT EXISTS certificates (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    type_name TEXT NOT NULL,
    holder_name TEXT NOT NULL,
    holder_id_number TEXT NOT NULL,
    issue_date TEXT NOT NULL,
    expiry_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'valid',
    qr_code_data TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS verification_records (
    id TEXT PRIMARY KEY,
    cert_type TEXT NOT NULL,
    holder_name TEXT NOT NULL,
    verifier_name TEXT NOT NULL,
    verifier_type TEXT NOT NULL,
    verifier_location TEXT NOT NULL,
    verified_at TEXT NOT NULL,
    result TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operator TEXT NOT NULL,
    action TEXT NOT NULL,
    target TEXT NOT NULL,
    time TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS violations (
    id TEXT PRIMARY KEY,
    plate_number TEXT NOT NULL,
    violation_type TEXT NOT NULL,
    location TEXT NOT NULL,
    violation_date TEXT NOT NULL,
    fine_amount REAL NOT NULL,
    penalty_points INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'unpaid'
  );
  CREATE TABLE IF NOT EXISTS accidents (
    id TEXT PRIMARY KEY,
    reporter_name TEXT NOT NULL,
    accident_date TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT NOT NULL,
    video_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'submitted'
  );
  CREATE TABLE IF NOT EXISTS suggestions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    content TEXT NOT NULL,
    submitter_name TEXT NOT NULL,
    submit_time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    response TEXT
  );
`);

seedInitialData();

const serviceGuides = [
  { id: 'sg1', name: '户籍证明', category: '户政', description: '申请出具户籍证明，用于各类需提供户籍信息的场景', processingTime: '3个工作日', fees: '免费', requiredMaterials: ['居民身份证', '户口簿'] },
  { id: 'sg2', name: '无犯罪记录证明', category: '治安', description: '申请出具无犯罪记录证明，用于就业、出国等场景', processingTime: '5个工作日', fees: '免费', requiredMaterials: ['居民身份证', '申请表'] },
  { id: 'sg3', name: '居住证申领', category: '户政', description: '申领居住证，适用于非本地户籍常住人口', processingTime: '7个工作日', fees: '免费', requiredMaterials: ['居民身份证', '居住证明', '劳动合同'] },
  { id: 'sg4', name: '护照办理', category: '出入境', description: '申办中华人民共和国护照，用于出国旅游、商务等', processingTime: '10个工作日', fees: '120元', requiredMaterials: ['居民身份证', '户口簿', '照片回执'] },
  { id: 'sg5', name: '港澳通行证', category: '出入境', description: '申办往来港澳通行证及签注', processingTime: '7个工作日', fees: '60元', requiredMaterials: ['居民身份证', '户口簿', '照片回执'] },
  { id: 'sg6', name: '养犬登记', category: '治安', description: '办理养犬登记证，依法文明养犬', processingTime: '5个工作日', fees: '免费', requiredMaterials: ['居民身份证', '犬只免疫证明', '居住证明'] },
];

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || '*';
  if (req.method === 'OPTIONS') {
    writeCors(res, 204, origin);
    return;
  }

  const url = new URL(req.url || '/', `http://${host}:${port}`);
  const pathname = url.pathname;

  if (req.method === 'GET' && pathname === '/api/health') {
    json(res, 200, {
      ok: true,
      success: true,
      project: 'may-89117',
      service: '贵州省公安厅互联网+公安服务一体化平台后端',
      database: path.relative(projectRoot, dbPath),
      events: db.prepare('SELECT COUNT(*) AS count FROM service_events').get().count,
      time: new Date().toISOString(),
    }, origin);
    return;
  }

  if (req.method === 'GET' && pathname === '/api/services') {
    const keyword = url.searchParams.get('q') || '';
    const category = url.searchParams.get('category') || '';
    const data = serviceGuides.filter((r) => {
      if (category && r.category !== category) return false;
      if (keyword && !r.name.includes(keyword) && !r.category.includes(keyword) && !(r.description || '').includes(keyword)) return false;
      return true;
    });
    json(res, 200, { success: true, data }, origin);
    return;
  }

  if (req.method === 'GET' && pathname === '/api/certificates') {
    const rows = db.prepare('SELECT * FROM certificates').all();
    json(res, 200, { success: true, data: rows.map(formatCert) }, origin);
    return;
  }

  if (req.method === 'GET' && pathname === '/api/applications') {
    const rows = db.prepare('SELECT * FROM applications').all();
    json(res, 200, { success: true, data: rows.map(formatApp) }, origin);
    return;
  }

  if (req.method === 'POST' && pathname === '/api/applications') {
    const body = await readJson(req);
    const id = `app${Date.now()}`;
    const now = new Date().toLocaleString('zh-CN');
    db.prepare(`INSERT INTO applications (id, type_name, applicant_name, applicant_id_card, status, current_step, total_steps, submit_time, update_time, materials) VALUES (?, ?, ?, ?, 'pending', 1, 4, ?, ?, ?)`).run(
      id, body.typeName || '', body.applicantName || '', body.applicantIdCard || '', now, now, JSON.stringify(body.materials || [])
    );
    logEvent('application_submitted', { id, typeName: body.typeName });
    json(res, 201, { success: true, data: { id, status: 'pending', submitTime: now } }, origin);
    return;
  }

  if (req.method === 'PATCH' && pathname.match(/^\/api\/applications\/[^/]+\/status$/)) {
    const id = pathname.split('/')[3];
    const body = await readJson(req);
    const now = new Date().toLocaleString('zh-CN');
    const stepMap = { pending: 1, processing: 2, approved: 3, completed: 4, rejected: 2 };
    db.prepare('UPDATE applications SET status = ?, current_step = ?, update_time = ? WHERE id = ?').run(body.status, stepMap[body.status] || 1, now, id);
    logEvent('application_status_updated', { id, status: body.status });
    json(res, 200, { success: true, data: { id, status: body.status, updateTime: now } }, origin);
    return;
  }

  if (req.method === 'GET' && pathname === '/api/verifications') {
    const rows = db.prepare('SELECT * FROM verification_records').all();
    json(res, 200, { success: true, data: rows }, origin);
    return;
  }

  if (req.method === 'GET' && pathname === '/api/violations') {
    const rows = db.prepare('SELECT * FROM violations').all();
    json(res, 200, { success: true, data: rows }, origin);
    return;
  }

  if (req.method === 'PATCH' && pathname.match(/^\/api\/violations\/[^/]+\/pay$/)) {
    const id = pathname.split('/')[3];
    db.prepare("UPDATE violations SET status = 'paid' WHERE id = ?").run(id);
    logEvent('violation_paid', { id });
    json(res, 200, { success: true, data: { id, status: 'paid' } }, origin);
    return;
  }

  if (req.method === 'GET' && pathname === '/api/accidents') {
    const rows = db.prepare('SELECT * FROM accidents').all();
    json(res, 200, { success: true, data: rows }, origin);
    return;
  }

  if (req.method === 'PATCH' && pathname.match(/^\/api\/accidents\/[^/]+\/status$/)) {
    const id = pathname.split('/')[3];
    const body = await readJson(req);
    db.prepare('UPDATE accidents SET status = ? WHERE id = ?').run(body.status, id);
    logEvent('accident_status_updated', { id, status: body.status });
    json(res, 200, { success: true, data: { id, status: body.status } }, origin);
    return;
  }

  if (req.method === 'GET' && pathname === '/api/suggestions') {
    const rows = db.prepare('SELECT * FROM suggestions').all();
    json(res, 200, { success: true, data: rows }, origin);
    return;
  }

  if (req.method === 'POST' && pathname === '/api/suggestions') {
    const body = await readJson(req);
    const id = `sug${Date.now()}`;
    const now = new Date().toLocaleString('zh-CN');
    db.prepare(`INSERT INTO suggestions (id, title, category, content, submitter_name, submit_time, status) VALUES (?, ?, ?, ?, ?, ?, 'pending')`).run(
      id, body.title || '', body.category || '', body.content || '', body.submitterName || '', now
    );
    logEvent('suggestion_submitted', { id, title: body.title });
    json(res, 201, { success: true, data: { id, submitTime: now } }, origin);
    return;
  }

  if (req.method === 'GET' && (pathname === '/api/admin/stats' || pathname === '/api/admin/dashboard')) {
    const appCount = db.prepare('SELECT COUNT(*) AS c FROM applications').get().c;
    const certCount = db.prepare('SELECT COUNT(*) AS c FROM certificates').get().c;
    const sugCount = db.prepare('SELECT COUNT(*) AS c FROM suggestions').get().c;
    const auditCount = db.prepare('SELECT COUNT(*) AS c FROM audit_logs').get().c;
    json(res, 200, {
      success: true,
      data: {
        platform: '贵州省公安厅民警工作台',
        applications: appCount,
        certificates: certCount,
        suggestions: sugCount,
        auditLogs: auditCount,
        onlineConsults: 24,
      },
    }, origin);
    return;
  }

  if (req.method === 'GET' && pathname === '/api/admin/audit-logs') {
    const rows = db.prepare('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100').all();
    json(res, 200, { success: true, data: rows }, origin);
    return;
  }

  if (req.method === 'POST' && pathname === '/api/admin/audit-logs') {
    const body = await readJson(req);
    const now = new Date().toLocaleString('zh-CN');
    db.prepare('INSERT INTO audit_logs (operator, action, target, time) VALUES (?, ?, ?, ?)').run(
      body.operator || '民警李明', body.action || '', body.target || '', now
    );
    json(res, 201, { success: true }, origin);
    return;
  }

  if (req.method === 'GET' && pathname === '/api/auth/me') {
    const role = url.searchParams.get('role') || 'citizen';
    json(res, 200, {
      success: true,
      data: {
        id: role === 'police' ? 'gz-police-008' : 'gz-demo-user',
        name: role === 'police' ? '李明' : '张三',
        role,
        badge: role === 'police' ? 'GZ202601008' : undefined,
      },
    }, origin);
    return;
  }

  if (req.method === 'GET' && pathname === '/api/search') {
    const keyword = url.searchParams.get('q') || url.searchParams.get('keyword') || '';
    const data = serviceGuides.filter((item) => !keyword || item.name.includes(keyword) || item.category.includes(keyword));
    json(res, 200, { success: true, keyword, data }, origin);
    return;
  }

  json(res, 404, { success: false, error: 'API not found', path: pathname }, origin);
});

server.listen(port, host, () => {
  console.log(`[may-89117] 贵州公安后端已启动 → http://${host}:${port}`);
  console.log(`  健康检查: http://${host}:${port}/api/health`);
  console.log(`  数据库:   ${path.relative(projectRoot, dbPath)}`);
});

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)=(.*)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}

function seedInitialData() {
  const certCount = db.prepare('SELECT COUNT(*) AS c FROM certificates').get().c;
  if (certCount === 0) {
    const insertCert = db.prepare(`INSERT INTO certificates (id, type, type_name, holder_name, holder_id_number, issue_date, expiry_date, status, qr_code_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    insertCert.run('cert001', 'id_card', '居民身份证', '张三', '5221****1234', '2020-06-15', '2040-06-15', 'valid', 'ID_ZHANGSAN_5221_2026');
    insertCert.run('cert002', 'driver_license', '机动车驾驶证', '张三', '5221****1234', '2022-03-20', '2028-03-20', 'valid', 'DL_ZHANGSAN_5221_2026');
    insertCert.run('cert003', 'passport', '中华人民共和国护照', '张三', '5221****1234', '2021-09-10', '2031-09-10', 'valid', 'PP_ZHANGSAN_5221_2026');
    insertCert.run('cert004', 'driver_license', '机动车驾驶证', '刘过期', '5221****5555', '2016-03-20', '2022-03-20', 'expired', 'DL_LIUGUOQI_5221_2026');
    insertCert.run('cert005', 'id_card', '居民身份证', '赵注销', '5221****6666', '2015-06-15', '2035-06-15', 'revoked', 'ID_ZHAOZHUXIAO_5221_2026');
  }

  const verCount = db.prepare('SELECT COUNT(*) AS c FROM verification_records').get().c;
  if (verCount === 0) {
    const insertVer = db.prepare(`INSERT INTO verification_records (id, cert_type, holder_name, verifier_name, verifier_type, verifier_location, verified_at, result) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
    insertVer.run('vr001', '居民身份证', '张三', '如家酒店（观山湖店）', 'hotel', '贵阳市观山湖区金阳大道', '2026-06-08 14:30:00', 'pass');
    insertVer.run('vr002', '居民身份证', '张三', '星网咖', 'internet_cafe', '贵阳市南明区花果园大街', '2026-06-07 20:15:00', 'pass');
    insertVer.run('vr003', '居民身份证', '李四', '贵阳龙洞堡机场', 'airport', '贵阳市南明区龙洞堡', '2026-06-06 08:45:00', 'fail');
    insertVer.run('vr004', '机动车驾驶证', '张三', '贵阳交警大队', 'other', '贵阳市云岩区北京路', '2026-06-05 10:00:00', 'pass');
    insertVer.run('vr005', '居民身份证', '王五', '7天酒店（南明店）', 'hotel', '贵阳市南明区遵义路', '2026-06-04 22:10:00', 'fail');
  }

  const vioCount = db.prepare('SELECT COUNT(*) AS c FROM violations').get().c;
  if (vioCount === 0) {
    const insertVio = db.prepare(`INSERT INTO violations (id, plate_number, violation_type, location, violation_date, fine_amount, penalty_points, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
    insertVio.run('vio001', '贵A·12345', '超速行驶', '贵阳市观山湖区金阳大道', '2026-05-20', 200, 6, 'unpaid');
    insertVio.run('vio002', '贵A·12345', '违章停车', '贵阳市南明区花果园大街', '2026-05-25', 150, 0, 'unpaid');
    insertVio.run('vio003', '贵A·12345', '闯红灯', '贵阳市云岩区北京路交叉口', '2026-06-01', 200, 6, 'unpaid');
    insertVio.run('vio004', '贵A·12345', '不按车道行驶', '贵阳市观山湖区林城路', '2026-06-03', 100, 2, 'paid');
  }

  const accCount = db.prepare('SELECT COUNT(*) AS c FROM accidents').get().c;
  if (accCount === 0) {
    const insertAcc = db.prepare(`INSERT INTO accidents (id, reporter_name, accident_date, location, description, video_count, status) VALUES (?, ?, ?, ?, ?, ?, ?)`);
    insertAcc.run('acc001', '张三', '2026-06-02 15:30:00', '贵阳市观山湖区金阳大道与林城路交叉口', '直行时被右侧变道车辆刮擦，右前门受损', 2, 'processing');
    insertAcc.run('acc002', '李四', '2026-05-28 10:15:00', '贵阳市南明区花果园大街', '追尾事故，前车突然刹车导致碰撞，前车后保险杠受损', 1, 'resolved');
    insertAcc.run('acc003', '王五', '2026-06-08 08:45:00', '贵阳市云岩区北京路', '左转与直行车辆发生碰撞，双方车辆均有损伤', 3, 'submitted');
  }

  const sugCount = db.prepare('SELECT COUNT(*) AS c FROM suggestions').get().c;
  if (sugCount === 0) {
    const insertSug = db.prepare(`INSERT INTO suggestions (id, title, category, content, submitter_name, submit_time, status, response) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
    insertSug.run('sug001', '增加居住证在线续签', '户政', '建议增加居住证在线续签功能，方便外地务工人员办理', '张三', '2026-06-01 10:00:00', 'processing', null);
    insertSug.run('sug002', '优化交管罚款缴纳流程', '交管', '罚款缴纳后凭证生成较慢，建议优化', '李四', '2026-05-28 14:30:00', 'replied', '感谢您的建议，我们已优化缴纳流程，凭证将即时生成。');
    insertSug.run('sug003', '增加出入境预约办理', '出入境', '护照办理排队时间长，建议增加在线预约功能', '王五', '2026-06-05 09:20:00', 'pending', null);
  }

  const evtCount = db.prepare('SELECT COUNT(*) AS c FROM service_events').get().c;
  if (evtCount === 0) {
    const insertEvt = db.prepare('INSERT INTO service_events (event_name, payload) VALUES (?, ?)');
    insertEvt.run('services_ready', JSON.stringify({ module: '办事大厅', count: 6 }));
    insertEvt.run('certificates_ready', JSON.stringify({ module: '电子证照', count: 5 }));
    insertEvt.run('police_admin_ready', JSON.stringify({ module: '民警工作台', pending: 12 }));
  }
}

function logEvent(name, payload) {
  try {
    db.prepare('INSERT INTO service_events (event_name, payload) VALUES (?, ?)').run(name, JSON.stringify(payload));
  } catch {}
}

function formatCert(r) {
  return { id: r.id, type: r.type, typeName: r.type_name, holderName: r.holder_name, holderIdNumber: r.holder_id_number, issueDate: r.issue_date, expiryDate: r.expiry_date, status: r.status, qrCodeData: r.qr_code_data };
}

function formatApp(r) {
  return { id: r.id, typeName: r.type_name, applicantName: r.applicant_name, applicantIdCard: r.applicant_id_card, status: r.status, currentStep: r.current_step, totalSteps: r.total_steps, submitTime: r.submit_time, updateTime: r.update_time, materials: JSON.parse(r.materials || '[]'), handler: r.handler, approver: r.approver, approvalOpinion: r.approval_opinion };
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return { raw }; }
}

function writeCors(res, status, origin) {
  res.writeHead(status, {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  });
  res.end();
}

function json(res, status, body, origin) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  });
  res.end(JSON.stringify(body));
}
