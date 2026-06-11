import http from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const projectRoot = resolve(new URL('..', import.meta.url).pathname);

function loadEnv() {
  const envPath = resolve(projectRoot, '.env');
  if (!existsSync(envPath)) return;
  const envText = readFileSync(envPath, 'utf8');
  for (const line of envText.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv();

const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.BACKEND_PORT || process.env.PORT || 59146);

const users = {
  student: { id: 'U001', phone: '13800001111', role: 'student', balance: 25.6, boundDevices: ['DEV001', 'DEV005', 'DEV007'] },
  operator: { id: 'U002', phone: '13800002222', role: 'operator', balance: 0, boundDevices: [] },
  investor: { id: 'U003', phone: '13800003333', role: 'investor', balance: 0, boundDevices: [] },
};

const accountRoles = {
  student: 'student',
  test: 'student',
  admin: 'operator',
  ops: 'operator',
  platform: 'investor',
  investor: 'investor',
};

const devices = [
  { id: 'DEV001', name: '1号教学楼-A1', location: '1号教学楼东侧', status: 'online', temperature: 95, firmwareVersion: 'v2.3.1', dailyWaterUsage: 585, energyConsumption: 12.4 },
  { id: 'DEV005', name: '图书馆-B2', location: '图书馆二楼', status: 'online', temperature: 90, firmwareVersion: 'v2.3.1', dailyWaterUsage: 420, energyConsumption: 9.8 },
  { id: 'DEV007', name: '宿舍区-C3', location: '学生宿舍 C 区', status: 'fault', temperature: 88, firmwareVersion: 'v2.2.9', dailyWaterUsage: 260, energyConsumption: 14.1 },
  { id: 'DEV014', name: '体育馆-D1', location: '体育馆入口', status: 'offline', temperature: 0, firmwareVersion: 'v2.3.0', dailyWaterUsage: 0, energyConsumption: 0 },
];

const transactions = [
  { id: 'TXN001', userId: 'U001', deviceId: 'DEV001', volume: 0.5, amount: 1.5, status: 'paid', createdAt: '2026-06-11T08:30:00' },
  { id: 'TXN002', userId: 'U001', deviceId: 'DEV005', volume: 0.75, amount: 2.25, status: 'paid', createdAt: '2026-06-11T10:15:00' },
  { id: 'RCG001', userId: 'U001', deviceId: '账户充值', volume: 0, amount: 20, status: 'paid', createdAt: '2026-06-11T11:20:00' },
];

const products = [
  { id: 'water-hot', name: '热水取水', price: 3, unit: '元/L', stock: 9999 },
  { id: 'water-warm', name: '温水取水', price: 2, unit: '元/L', stock: 9999 },
  { id: 'balance-20', name: '余额充值 20 元', price: 20, unit: '次', stock: 9999 },
];

const alerts = [
  { id: 'ALT001', deviceId: 'DEV007', level: 'critical', message: '加热模块故障，错误码 E003', status: 'pending' },
  { id: 'ALT002', deviceId: 'DEV014', level: 'warning', message: '设备离线超过 12 小时', status: 'pending' },
];

const firmwareTasks = [
  { id: 'FW001', version: 'v2.3.2', targetDevices: ['DEV003', 'DEV004'], progress: 66, status: 'in_progress' },
  { id: 'FW002', version: 'v2.4.0', targetDevices: ['DEV001', 'DEV005'], progress: 0, status: 'pending' },
];

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-Id',
  });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolveBody) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      if (!raw) {
        resolveBody({});
        return;
      }
      try {
        resolveBody(JSON.parse(raw));
      } catch {
        resolveBody({});
      }
    });
  });
}

const getRoutes = {
  '/api/health': () => ({
    success: true,
    ok: true,
    message: 'ok',
    service: 'may-89146-api',
    storage: 'mock-local',
  }),
  '/health': () => ({
    success: true,
    ok: true,
    message: 'ok',
    service: 'may-89146-api',
  }),
  '/api/auth/me': () => ({
    success: true,
    user: users.student,
  }),
  '/api/users/profile': () => ({
    success: true,
    user: users.student,
  }),
  '/api/user/profile': () => ({
    success: true,
    user: users.student,
  }),
  '/api/student/dashboard': () => ({
    success: true,
    user: users.student,
    balance: users.student.balance,
    todayUsage: 1.25,
    unpaidBills: 0,
    boundDevices: devices.filter((device) => users.student.boundDevices.includes(device.id)),
  }),
  '/api/student/transactions': () => ({
    success: true,
    transactions,
  }),
  '/api/student/bills': () => ({
    success: true,
    bills: transactions,
  }),
  '/api/student/devices': () => ({
    success: true,
    devices: devices.filter((device) => users.student.boundDevices.includes(device.id)),
  }),
  '/api/operator/dashboard': () => ({
    success: true,
    onlineDevices: 118,
    offlineDevices: 4,
    criticalAlerts: 2,
    firmwareTasks: 3,
    devices,
    alerts,
  }),
  '/api/operator/devices': () => ({
    success: true,
    devices,
  }),
  '/api/operator/alerts': () => ({
    success: true,
    alerts,
  }),
  '/api/operator/firmware': () => ({
    success: true,
    tasks: firmwareTasks,
  }),
  '/api/investor/dashboard': () => ({
    success: true,
    dailyRevenue: 27150,
    roi: 286,
    activeProjects: 2,
    deviceCount: 46,
    revenueTrend: [
      { date: '6/7', revenue: 23100 },
      { date: '6/8', revenue: 24620 },
      { date: '6/9', revenue: 26340 },
      { date: '6/10', revenue: 25880 },
      { date: '6/11', revenue: 27150 },
    ],
  }),
  '/api/admin/stats': () => ({
    success: true,
    studentCount: 12860,
    activeDevices: 118,
    todayRevenue: 27150,
  }),
  '/api/admin/dashboard': () => ({
    success: true,
    title: '校园直饮水运营管理后台',
    stats: {
      studentCount: 12860,
      activeDevices: 118,
      todayRevenue: 27150,
      pendingAlerts: alerts.filter((alert) => alert.status === 'pending').length,
    },
    devices,
    alerts,
    firmwareTasks,
  }),
  '/api/orders': () => ({
    success: true,
    orders: transactions,
  }),
  '/api/products': () => ({
    success: true,
    products,
  }),
  '/api/cart': () => ({
    success: true,
    items: [
      { id: 'cart-1', productId: 'balance-20', name: '余额充值 20 元', quantity: 1, amount: 20 },
    ],
    totalAmount: 20,
  }),
  '/api/investor/roi': () => ({
    success: true,
    projects: [
      { projectId: 'P001', projectName: '杭州校区-一期', dailyRevenue: 17550, maintenanceCost: 4200, roi: 318 },
      { projectId: 'P002', projectName: '杭州校区-二期', dailyRevenue: 9600, maintenanceCost: 2800, roi: 243 },
    ],
  }),
};

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  const url = new URL(req.url || '/', `http://${host}:${port}`);
  if (req.method === 'GET' && getRoutes[url.pathname]) {
    sendJson(res, 200, getRoutes[url.pathname]());
    return;
  }

  if (req.method === 'POST' && (url.pathname === '/api/auth/login' || url.pathname === '/api/auth/register')) {
    const body = await readBody(req);
    const account = String(body.account || body.username || body.phone || '').trim().toLowerCase();
    const role = accountRoles[account] || (['student', 'operator', 'investor'].includes(body.role) ? body.role : 'student');
    sendJson(res, 200, {
      success: true,
      token: `mock-token-${role}`,
      user: users[role],
      message: url.pathname.endsWith('/register') ? '注册成功并已登录' : '登录成功',
    });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/student/recharge') {
    const body = await readBody(req);
    sendJson(res, 200, {
      success: true,
      orderNo: `RCG${Date.now()}`,
      amount: Number(body.amount || 0),
      status: 'paid',
    });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/student/dispense/start') {
    sendJson(res, 200, {
      success: true,
      sessionId: `DSP${Date.now()}`,
      status: 'started',
    });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/orders') {
    const body = await readBody(req);
    const amount = Number(body.amount || body.totalAmount || 0);
    const order = {
      id: `ORD${Date.now()}`,
      userId: body.userId || 'U001',
      deviceId: body.deviceId || body.productId || 'balance-20',
      volume: Number(body.volume || 0),
      amount,
      status: 'paid',
      createdAt: new Date().toISOString(),
    };
    transactions.unshift(order);
    sendJson(res, 200, {
      success: true,
      order,
      message: '订单已提交并支付成功',
    });
    return;
  }

  if (req.method === 'POST' && (url.pathname === '/api/cart' || url.pathname === '/api/cart/add')) {
    const body = await readBody(req);
    sendJson(res, 200, {
      success: true,
      item: {
        id: `CART${Date.now()}`,
        productId: body.productId || 'balance-20',
        quantity: Number(body.quantity || 1),
      },
      message: '已加入购物车',
    });
    return;
  }

  if (req.method === 'POST' && url.pathname.startsWith('/api/operator/devices/')) {
    sendJson(res, 200, {
      success: true,
      commandId: `CMD${Date.now()}`,
      message: '远程管控指令已下发',
    });
    return;
  }

  sendJson(res, 404, {
    success: false,
    error: 'API not found',
    path: url.pathname,
  });
});

server.listen(port, host, () => {
  console.log(`Server ready on http://${host}:${port}`);
});

const shutdown = () => {
  server.close(() => process.exit(0));
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
