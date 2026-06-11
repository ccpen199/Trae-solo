import http from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
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
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnv();

const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.BACKEND_PORT || process.env.PORT || 59148);

const users = {
  personal: {
    id: 'U001',
    name: '张明华',
    role: 'personal',
    authStatus: 'verified',
  },
  enterprise: {
    id: 'E001',
    name: '北京智联科技有限公司',
    role: 'enterprise',
    authStatus: 'verified',
    creditCode: '91110000123456789X',
  },
  admin: {
    id: 'A001',
    name: '人社管理员',
    role: 'admin',
    authStatus: 'verified',
  },
};

const readBody = (req) => new Promise((resolveBody) => {
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

const json = (res, status, payload) => {
  const body = JSON.stringify({
    code: status >= 400 ? status : 0,
    message: status >= 400 ? 'error' : 'ok',
    data: payload,
    timestamp: Date.now(),
    requestId: `local-${Date.now()}`,
  });

  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-Id',
  });
  res.end(body);
};

const rawJson = (res, status, payload) => {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-Id',
  });
  res.end(JSON.stringify(payload));
};

const routes = {
  '/api/health': () => ({
    success: true,
    message: 'ok',
    service: 'may-89148-api',
    storage: 'mock-local',
  }),
  '/api/user/profile': () => ({
    id: 'U001',
    name: '张明华',
    role: 'personal',
    authStatus: 'verified',
  }),
  '/api/users/profile': () => ({
    id: 'U001',
    name: '张明华',
    role: 'personal',
    authStatus: 'verified',
  }),
  '/api/auth/me': () => ({
    id: 'U001',
    name: '张明华',
    role: 'personal',
    authStatus: 'verified',
  }),
  '/api/services/summary': () => ({
    socialInsurance: 'normal',
    medicalInsurance: 'normal',
    housingFund: 'normal',
    pendingTasks: 3,
  }),
  '/api/messages': () => [
    { id: 'M001', title: '您的社保转移申请已受理', status: 'unread' },
    { id: 'M002', title: '医保报销审核通过', status: 'read' },
  ],
  '/api/search': () => ({
    total: 3,
    results: [
      { title: '社保查询', path: '/personal/social-insurance' },
      { title: '医保服务', path: '/personal/medical' },
      { title: '公积金', path: '/personal/housing-fund' },
    ],
  }),
  '/api/admin/stats': () => ({
    todayNew: 18,
    pendingTasks: 42,
    warningCount: 5,
    completedCount: 128,
  }),
  '/api/admin/dashboard': () => ({
    serviceStatus: 'normal',
    modules: ['督办中心', '实名认证', '政策管理'],
    alerts: [{ level: 'warning', title: '医保报销业务即将超时' }],
  }),
  '/api/products': () => ({
    products: [
      { id: 'S001', name: '社保查询', path: '/personal/social-insurance' },
      { id: 'M001', name: '医保服务', path: '/personal/medical' },
    ],
  }),
  '/api/orders': () => ({
    orders: [
      { id: 'YW20250615001', title: '养老保险关系转移', status: 'processing' },
      { id: 'YW20250610002', title: '医保报销申请', status: 'completed' },
    ],
  }),
  '/api/cart': () => ({
    items: [],
    total: 0,
  }),
};

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-Id',
    });
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://${host}:${port}`);
  const handler = routes[url.pathname];

  if (req.method === 'GET' && handler) {
    const payload = handler();
    if (url.pathname === '/api/health') {
      rawJson(res, 200, payload);
      return;
    }
    json(res, 200, payload);
    return;
  }

  if (req.method === 'POST' && (url.pathname === '/api/auth/login' || url.pathname === '/api/auth/register')) {
    const body = await readBody(req);
    const requestedRole = ['personal', 'enterprise', 'admin'].includes(body.role) ? body.role : 'personal';
    const user = users[requestedRole];
    json(res, 200, {
      success: true,
      token: `mock-token-${requestedRole}`,
      user,
      role: requestedRole,
      message: url.pathname.endsWith('/register') ? '注册成功并已登录' : '登录成功',
    });
    return;
  }

  if (req.method === 'POST' && (url.pathname === '/api/orders' || url.pathname === '/api/services/apply')) {
    const body = await readBody(req);
    json(res, 200, {
      success: true,
      order: {
        id: body.id || `YW${Date.now()}`,
        title: body.title || body.serviceName || '人社业务在线办理',
        status: 'processing',
        submittedAt: new Date().toISOString(),
      },
      message: '业务申请已提交，进入办理中',
    });
    return;
  }

  if (req.method === 'POST' && (url.pathname === '/api/cart' || url.pathname === '/api/cart/add')) {
    const body = await readBody(req);
    json(res, 200, {
      success: true,
      item: {
        id: `CART${Date.now()}`,
        productId: body.productId || 'HRSS-SERVICE',
        quantity: Number(body.quantity || 1),
      },
      message: '已加入业务办理清单',
    });
    return;
  }

  if (req.method === 'POST' && url.pathname.startsWith('/api/admin/')) {
    json(res, 200, {
      success: true,
      actionId: `ADM${Date.now()}`,
      status: 'completed',
      message: '后台管理操作已完成',
    });
    return;
  }

  json(res, 404, { error: 'API not found', path: url.pathname });
});

server.listen(port, host, () => {
  console.log(`Server ready on http://${host}:${port}`);
});

const shutdown = () => {
  server.close(() => process.exit(0));
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
