const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const projectDir = path.resolve(__dirname, '..');
loadEnv(path.join(projectDir, '.env'));

const host = process.env.HOST || '127.0.0.1';
const frontendPort = Number(process.env.FRONTEND_PORT || 49107);
const backendPort = Number(process.env.BACKEND_PORT || 59107);
const dbPath = path.resolve(projectDir, process.env.DB_PATH || 'data/app.sqlite');

fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
initDatabase();

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || '';
  if (req.method === 'OPTIONS') {
    writeJson(res, 204, {}, origin);
    return;
  }

  try {
    const url = new URL(req.url || '/', `http://${host}:${backendPort}`);
    const route = url.pathname.replace(/\/$/, '') || '/';

    if (req.method === 'GET' && route === '/api/health') {
      writeJson(res, 200, ok({
        status: 'ok',
        project: 'may-89107',
        service: 'guizhou-digital-platform-local',
        db: dbPath,
        time: new Date().toISOString()
      }), origin);
      return;
    }

    if (req.method === 'POST' && route === '/api/auth/login') {
      const body = await readBody(req);
      const phone = body.phone || body.username || '13800000000';
      addEvent('auth.login', `用户 ${phone} 登录贵州数字服务平台`);
      writeJson(res, 200, ok({
        accessToken: `local-access-${Date.now()}`,
        refreshToken: `local-refresh-${Date.now()}`,
        token: `local-access-${Date.now()}`,
        userInfo: demoUser(phone),
        user: demoUser(phone)
      }, '登录成功'), origin);
      return;
    }

    if (req.method === 'POST' && route === '/api/auth/sms/send') {
      writeJson(res, 200, ok({ sent: true, code: '123456' }, '验证码已发送'), origin);
      return;
    }

    if (req.method === 'POST' && route === '/api/auth/refresh') {
      writeJson(res, 200, ok({ accessToken: `local-access-${Date.now()}` }), origin);
      return;
    }

    if (req.method === 'POST' && route === '/api/auth/logout') {
      writeJson(res, 200, ok({ loggedOut: true }, '已退出'), origin);
      return;
    }

    if (req.method === 'GET' && route === '/api/auth/user/info') {
      writeJson(res, 200, ok(demoUser('13800000000')), origin);
      return;
    }

    if (req.method === 'GET' && route === '/api/government/categories') {
      writeJson(res, 200, ok([
        { id: 'social', name: '社会保障', icon: 'safety', count: 328 },
        { id: 'medical', name: '医疗卫生', icon: 'medicine', count: 216 },
        { id: 'housing', name: '住房保障', icon: 'home', count: 149 },
        { id: 'business', name: '企业开办', icon: 'shop', count: 96 }
      ]), origin);
      return;
    }

    if (req.method === 'GET' && route === '/api/government/items') {
      const keyword = String(url.searchParams.get('keyword') || '').trim();
      const categoryId = String(url.searchParams.get('categoryId') || '').trim();
      const items = governmentItems().filter((item) => {
        const matchesKeyword = !keyword || `${item.name}${item.department}`.includes(keyword);
        const matchesCategory = !categoryId || item.category === categoryId;
        return matchesKeyword && matchesCategory;
      });
      writeJson(res, 200, ok(items), origin);
      return;
    }

    const governmentDetail = route.match(/^\/api\/government\/items\/([^/]+)$/);
    if (req.method === 'GET' && governmentDetail) {
      const item = governmentItems().find((entry) => entry.id === governmentDetail[1]) || governmentItems()[0];
      writeJson(res, 200, ok({ ...item, materials: ['身份证', '户口簿', '申请表'], promiseDays: 3 }), origin);
      return;
    }

    const governmentApply = route.match(/^\/api\/government\/items\/([^/]+)\/apply$/);
    if (req.method === 'POST' && governmentApply) {
      addEvent('government.apply', `提交政务服务 ${governmentApply[1]}`);
      writeJson(res, 200, ok({ applicationNo: `GZ${Date.now()}`, status: '已受理' }, '申请已提交'), origin);
      return;
    }

    if (req.method === 'GET' && route === '/api/government/my-applications') {
      writeJson(res, 200, ok([
        { id: 'A20260609001', name: '社保参保证明打印', status: '已办结', submittedAt: '2026-06-09 09:18' },
        { id: 'A20260608007', name: '公积金提取预审', status: '审核中', submittedAt: '2026-06-08 15:40' }
      ]), origin);
      return;
    }

    if (req.method === 'GET' && route === '/api/payment/bills') {
      const type = url.searchParams.get('type') || 'water';
      writeJson(res, 200, ok([
        { id: `${type}-001`, type, accountNo: url.searchParams.get('accountNo') || 'GZ-88001234', amount: 86.5, period: '2026-05', status: 'unpaid', dueDate: '2026-06-20' },
        { id: `${type}-002`, type, accountNo: url.searchParams.get('accountNo') || 'GZ-88001234', amount: 79.2, period: '2026-04', status: 'paid', dueDate: '2026-05-20' }
      ]), origin);
      return;
    }

    if (req.method === 'POST' && route === '/api/payment/pay') {
      addEvent('payment.pay', '完成便民缴费');
      writeJson(res, 200, ok({ paid: true, tradeNo: `PAY${Date.now()}` }, '缴费成功'), origin);
      return;
    }

    if (req.method === 'GET' && route === '/api/payment/records') {
      writeJson(res, 200, ok({ list: paymentRecords(), total: paymentRecords().length }), origin);
      return;
    }

    if (req.method === 'POST' && route === '/api/payment/accounts/bind') {
      writeJson(res, 200, ok({ bound: true }, '户号已绑定'), origin);
      return;
    }

    if (req.method === 'GET' && route === '/api/payment/accounts') {
      writeJson(res, 200, ok([
        { id: 'acct-water', type: 'water', accountNo: 'GZ-88001234', name: '贵阳市云岩区居民户' },
        { id: 'acct-power', type: 'electricity', accountNo: 'GZ-66008888', name: '贵阳市观山湖区居民户' }
      ]), origin);
      return;
    }

    if (req.method === 'GET' && route === '/api/living/services') {
      const category = url.searchParams.get('category') || '';
      const keyword = url.searchParams.get('keyword') || '';
      const list = livingServices().filter((item) => {
        const categoryOk = !category || item.category === category;
        const keywordOk = !keyword || `${item.name}${item.description}${item.provider}`.includes(keyword);
        return categoryOk && keywordOk;
      });
      writeJson(res, 200, ok(list), origin);
      return;
    }

    const livingDetail = route.match(/^\/api\/living\/services\/([^/]+)$/);
    if (req.method === 'GET' && livingDetail) {
      const item = livingServices().find((entry) => entry.id === livingDetail[1]) || livingServices()[0];
      writeJson(res, 200, ok({ ...item, serviceHours: '08:00-20:00', guarantee: '平台担保，服务后评价' }), origin);
      return;
    }

    if (req.method === 'POST' && route === '/api/living/appointments') {
      addEvent('living.appointment', '预约生活服务');
      writeJson(res, 200, ok({ appointmentNo: `LIFE${Date.now()}`, status: '待确认' }, '预约已提交'), origin);
      return;
    }

    if (req.method === 'GET' && route === '/api/living/my-appointments') {
      writeJson(res, 200, ok([
        { id: 'LIFE001', serviceName: '安心家政保洁', date: '2026-06-12', time: '10:00', status: '待上门' },
        { id: 'LIFE002', serviceName: '社区助老陪诊', date: '2026-06-10', time: '14:30', status: '已完成' }
      ]), origin);
      return;
    }

    if (req.method === 'PUT' && /^\/api\/living\/appointments\/[^/]+\/cancel$/.test(route)) {
      writeJson(res, 200, ok({ cancelled: true }, '预约已取消'), origin);
      return;
    }

    if (req.method === 'GET' && ['/api/subsidy/my', '/api/subsidy/available'].includes(route)) {
      writeJson(res, 200, ok(subsidies()), origin);
      return;
    }

    const subsidyDetail = route.match(/^\/api\/subsidy\/([^/]+)$/);
    if (req.method === 'GET' && subsidyDetail && !['records', 'available', 'my'].includes(subsidyDetail[1])) {
      const item = subsidies().find((entry) => entry.id === subsidyDetail[1]) || subsidies()[0];
      writeJson(res, 200, ok(item), origin);
      return;
    }

    if (req.method === 'POST' && route === '/api/subsidy/verify') {
      addEvent('subsidy.verify', '核销消费补贴');
      writeJson(res, 200, ok({
        success: true,
        subsidyName: '多彩贵州文旅消费券',
        amount: 100,
        merchantName: '贵阳云岩文旅商户',
        verifiedAt: new Date().toISOString()
      }, '核销成功'), origin);
      return;
    }

    if (req.method === 'GET' && route === '/api/subsidy/records') {
      writeJson(res, 200, ok({ list: subsidyRecords(), total: subsidyRecords().length }), origin);
      return;
    }

    if (req.method === 'GET' && route === '/api/certificate/my') {
      writeJson(res, 200, ok([
        { id: 'CERT001', name: '贵州省居民电子身份证', status: '有效', issuedAt: '2026-01-10' },
        { id: 'CERT002', name: '社保电子凭证', status: '有效', issuedAt: '2026-03-22' }
      ]), origin);
      return;
    }

    if (req.method === 'GET' && route === '/api/ticket/my') {
      writeJson(res, 200, ok([
        { id: 'T20260609001', title: '医保异地结算咨询', status: '处理中', department: '医保局', updatedAt: '2026-06-09 10:25' },
        { id: 'T20260607003', title: '小区路灯报修', status: '已办结', department: '住建局', updatedAt: '2026-06-08 17:42' }
      ]), origin);
      return;
    }

    if (req.method === 'POST' && route === '/api/ticket/create') {
      addEvent('ticket.create', '提交市民诉求');
      writeJson(res, 200, ok({ ticketNo: `T${Date.now()}`, status: '已分派' }, '诉求已提交'), origin);
      return;
    }

    if (route.startsWith('/api/auth/users')) return listCrud(req, res, origin, 'users', adminUsers());
    if (route.startsWith('/api/auth/roles')) return listCrud(req, res, origin, 'roles', roles());
    if (route.startsWith('/api/auth/audit-logs')) return listCrud(req, res, origin, 'auditLogs', auditLogs());
    if (route.startsWith('/api/data/apis')) return listCrud(req, res, origin, 'apis', dataApis());
    if (route.startsWith('/api/data/permissions')) return listCrud(req, res, origin, 'permissions', permissions());
    if (route.startsWith('/api/data/desensitize-rules')) return listCrud(req, res, origin, 'rules', rules());
    if (route.startsWith('/api/certificate/certificates')) return listCrud(req, res, origin, 'certificates', certificates());
    if (route.startsWith('/api/certificate/templates')) return listCrud(req, res, origin, 'templates', templates());
    if (route.startsWith('/api/monitor/services')) return listCrud(req, res, origin, 'services', monitorServices());
    if (route.startsWith('/api/monitor/alerts')) return listCrud(req, res, origin, 'alerts', monitorAlerts());
    if (route.startsWith('/api/monitor/slas')) return listCrud(req, res, origin, 'slas', slas());
    if (route.startsWith('/api/ticket/tickets')) return listCrud(req, res, origin, 'tickets', adminTickets());
    if (route.startsWith('/api/ticket/dispatch-rules')) return listCrud(req, res, origin, 'dispatchRules', dispatchRules());
    if (route.startsWith('/api/ticket/knowledge')) return listCrud(req, res, origin, 'knowledge', knowledge());
    if (route.startsWith('/api/subsidy/policies')) return listCrud(req, res, origin, 'policies', policies());
    if (route.startsWith('/api/subsidy/grants')) return listCrud(req, res, origin, 'grants', grants());
    if (route.startsWith('/api/subsidy/fund-traces')) return listCrud(req, res, origin, 'fundTraces', fundTraces());
    if (route.startsWith('/api/subsidy/risk-warnings')) return listCrud(req, res, origin, 'riskWarnings', riskWarnings());

    writeJson(res, 404, { code: 404, message: `未找到接口 ${route}`, data: null }, origin);
  } catch (error) {
    writeJson(res, 500, { code: 500, message: error.message || String(error), data: null }, origin);
  }
});

server.listen(backendPort, host, () => {
  console.log(`may-89107 local backend ready on http://${host}:${backendPort}`);
  console.log(`SQLite database: ${dbPath}`);
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
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}

function addEvent(type, message) {
  db.prepare('INSERT INTO events (type, message, created_at) VALUES (?, ?, ?)')
    .run(type, message, new Date().toISOString());
}

function ok(data, message = 'success') {
  return { code: 200, msg: message, message, data, timestamp: Date.now() };
}

function writeJson(res, status, payload, origin) {
  const body = Buffer.from(JSON.stringify(payload));
  const allowedOrigin = origin && /^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin)
    ? origin
    : `http://127.0.0.1:${frontendPort}`;
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': body.length,
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    Vary: 'Origin'
  });
  res.end(body);
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return {};
  const raw = Buffer.concat(chunks).toString('utf8');
  try {
    return JSON.parse(raw);
  } catch {
    return Object.fromEntries(new URLSearchParams(raw));
  }
}

function listCrud(req, res, origin, key, rows) {
  if (req.method === 'GET') {
    writeJson(res, 200, ok({ list: rows, records: rows, total: rows.length, [key]: rows }), origin);
    return;
  }
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    addEvent(`admin.${key}`, `${req.method} ${key}`);
    writeJson(res, 200, ok({ success: true }, '操作成功'), origin);
    return;
  }
  writeJson(res, 405, { code: 405, message: 'Method not allowed', data: null }, origin);
}

function demoUser(phone) {
  return { id: 'U0001', name: '演示市民', realName: '演示市民', phone, avatar: '', roles: ['citizen'] };
}

function governmentItems() {
  return [
    { id: 'social-proof', name: '社保参保证明打印', department: '贵州省人社厅', category: 'social', online: true },
    { id: 'medical-settle', name: '异地就医备案', department: '贵州省医保局', category: 'medical', online: true },
    { id: 'fund-withdraw', name: '住房公积金提取', department: '贵州省住建厅', category: 'housing', online: true },
    { id: 'business-license', name: '个体工商户设立登记', department: '贵州省市场监管局', category: 'business', online: true }
  ];
}

function paymentRecords() {
  return [
    { id: 'PAY001', type: 'water', amount: 86.5, paidAt: '2026-06-03 11:20', status: 'paid' },
    { id: 'PAY002', type: 'electricity', amount: 146.8, paidAt: '2026-06-01 09:12', status: 'paid' }
  ];
}

function livingServices() {
  return [
    { id: 'life-clean', category: 'housekeeping', name: '安心家政保洁', description: '双人标准化上门保洁', price: 168, provider: '贵阳安心家政', rating: 4.9 },
    { id: 'life-renovation', category: 'renovation', name: '旧房局部翻新', description: '厨房、卫生间、防水维修', price: 599, provider: '黔居焕新服务', rating: 4.8 },
    { id: 'life-transport', category: 'transport', name: '社区出行预约', description: '助老就医、政务大厅往返', price: 35, provider: '黔行便民车队', rating: 4.7 }
  ];
}

function subsidies() {
  return [
    { id: 'SUB001', name: '多彩贵州文旅消费券', amount: 100, status: 'available', source: '贵州省文旅厅', validFrom: '2026-06-01', validTo: '2026-06-30', qrCode: 'GZ-SUB001' },
    { id: 'SUB002', name: '绿色家电以旧换新补贴', amount: 300, status: 'available', source: '贵州省商务厅', validFrom: '2026-05-20', validTo: '2026-07-31', qrCode: 'GZ-SUB002' }
  ];
}

function subsidyRecords() {
  return [
    { id: 'SR001', subsidyName: '多彩贵州文旅消费券', amount: 100, status: 'used', merchantName: '青岩古镇文创店', usedAt: '2026-06-05 16:42' }
  ];
}

function adminUsers() {
  return Array.from({ length: 8 }, (_, index) => ({
    id: `U${String(index + 1).padStart(4, '0')}`,
    username: `operator${index + 1}`,
    realName: ['张敏', '王磊', '李华', '陈洁'][index % 4],
    phone: `1380000${String(index + 1).padStart(4, '0')}`,
    email: `operator${index + 1}@guizhou.local`,
    department: ['政务服务部', '数据资源部', '财政监管部'][index % 3],
    status: 1,
    roles: ['operator'],
    createdAt: '2026-06-01 09:00:00'
  }));
}

function roles() {
  return [
    { id: 'admin', name: '系统管理员', code: 'admin', status: 1 },
    { id: 'operator', name: '业务经办员', code: 'operator', status: 1 },
    { id: 'auditor', name: '审计员', code: 'auditor', status: 1 }
  ];
}

function auditLogs() {
  return db.prepare('SELECT id, type, message, created_at AS createdAt FROM events ORDER BY id DESC LIMIT 20').all();
}

function dataApis() {
  return [
    { id: 'API001', name: '社保参保状态查询', path: '/api/v1/social/query', owner: '人社厅', status: 'online' },
    { id: 'API002', name: '医保结算记录查询', path: '/api/v1/medical/settle', owner: '医保局', status: 'online' }
  ];
}

function permissions() {
  return [{ id: 'DP001', name: '跨部门社保数据共享', department: '人社厅', scope: 'read', status: 'enabled' }];
}

function rules() {
  return [{ id: 'DR001', field: 'idCard', strategy: 'mask', sample: '5221********0012' }];
}

function certificates() {
  return [{ id: 'CERT001', holder: '演示市民', type: '居民身份证', status: 'valid', issuedAt: '2026-01-10' }];
}

function templates() {
  return [{ id: 'TPL001', name: '电子证照标准模板', version: '2026.1', status: 'enabled' }];
}

function monitorServices() {
  return [
    { id: 'SVC001', name: '统一身份认证', availability: 99.95, status: 'healthy' },
    { id: 'SVC002', name: '数据共享中间件', availability: 99.91, status: 'healthy' }
  ];
}

function monitorAlerts() {
  return [{ id: 'AL001', service: '补贴核销', level: 'warning', content: '核销峰值接近阈值', status: 'open' }];
}

function slas() {
  return [{ id: 'SLA001', service: '政务服务网关', target: '99.9%', current: '99.95%', status: 'met' }];
}

function adminTickets() {
  return [{ id: 'T001', title: '医保异地结算咨询', status: 'processing', department: '医保局' }];
}

function dispatchRules() {
  return [{ id: 'R001', keyword: '医保', department: '医保局', priority: 'high' }];
}

function knowledge() {
  return [{ id: 'K001', title: '异地就医备案办理指南', category: '医保', status: 'published' }];
}

function policies() {
  return [{ id: 'P001', name: '多彩贵州文旅消费券', budget: 5000000, status: 'active' }];
}

function grants() {
  return [{ id: 'G001', citizen: '演示市民', amount: 100, status: 'granted' }];
}

function fundTraces() {
  return [{ id: 'F001', policy: '文旅消费券', amount: 100, node: '商户核销', time: '2026-06-05 16:42' }];
}

function riskWarnings() {
  return [{ id: 'RW001', policy: '家电补贴', level: 'medium', reason: '同设备短期重复申请', status: 'open' }];
}
