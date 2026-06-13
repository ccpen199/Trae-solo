import http from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnv() {
  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnv();

const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.BACKEND_PORT || process.env.PORT || 59184);

const properties = [
  {
    id: 'P001',
    name: '环球金融中心 T3 座 28层',
    type: '写字楼',
    status: '出租中',
    city: '上海市',
    district: '浦东新区',
    area: 1850,
    rent: 12,
  },
  {
    id: 'P002',
    name: '望京SOHO T1 座 15层',
    type: '写字楼',
    status: '待出租',
    city: '北京市',
    district: '朝阳区',
    area: 1280,
    rent: 9,
  },
  {
    id: 'P003',
    name: '华润万象天地 旗舰店商铺',
    type: '商铺',
    status: '装修中',
    city: '深圳市',
    district: '南山区',
    area: 680,
    rent: 35,
  },
];

const workOrders = [
  { id: 'WO-2026-0612-001', title: '万达广场A座装修方案确认', status: 'processing', priority: 'high' },
  { id: 'WO-2026-0612-002', title: 'CBD核心区隐蔽工程验收', status: 'pending', priority: 'high' },
  { id: 'WO-2026-0611-003', title: '科技园B栋材料采购', status: 'completed', priority: 'medium' },
];

const serviceCatalog = [
  { id: 'design-review', name: '商业空间方案审查', category: 'design', price: 2999, inventory: 32 },
  { id: 'fire-audit', name: '消防报审协同', category: 'compliance', price: 4999, inventory: 18 },
  { id: 'site-supervision', name: '装修工地巡检', category: 'construction', price: 899, inventory: 80 },
];

const profile = {
  id: 'proptech-user-89184',
  name: '商业地产运营管理员',
  role: 'admin',
  company: 'PropTech OS 演示组织',
};

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function handle(req, res) {
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  const url = new URL(req.url || '/', `http://${host}:${port}`);

  if (url.pathname === '/api/health') {
    sendJson(res, 200, {
      success: true,
      message: 'ok',
      service: 'may-89184-backend',
      app: '商业地产智能装修SaaS平台',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (['/api/auth/me', '/api/users/profile', '/api/user/profile'].includes(url.pathname)) {
    sendJson(res, 200, { success: true, data: profile });
    return;
  }

  if (url.pathname === '/api/properties') {
    sendJson(res, 200, { success: true, data: { items: properties, total: properties.length } });
    return;
  }

  if (url.pathname === '/api/work-orders' || url.pathname === '/api/orders') {
    sendJson(res, 200, { success: true, data: { items: workOrders, total: workOrders.length } });
    return;
  }

  if (url.pathname === '/api/admin/dashboard' || url.pathname === '/api/admin/stats') {
    sendJson(res, 200, {
      success: true,
      data: {
        overview: {
          activeProperties: properties.length,
          activeWorkOrders: workOrders.filter((item) => item.status !== 'completed').length,
          providerMatches: 42,
          complianceAlerts: 5,
        },
        modules: ['房源管理', '装修工单', '供需匹配', '合同履约', '消防合规'],
      },
    });
    return;
  }

  if (url.pathname === '/api/products') {
    sendJson(res, 200, { success: true, data: serviceCatalog });
    return;
  }

  if (url.pathname === '/api/cart') {
    sendJson(res, 200, { success: true, data: { items: [{ productId: 'site-supervision', quantity: 1 }], total: 899 } });
    return;
  }

  if (url.pathname === '/api/search') {
    const keyword = String(url.searchParams.get('q') || url.searchParams.get('keyword') || '').trim();
    const items = [...properties, ...serviceCatalog].filter((item) => !keyword || JSON.stringify(item).includes(keyword));
    sendJson(res, 200, { success: true, data: { keyword, items, total: items.length } });
    return;
  }

  sendJson(res, 404, { success: false, error: 'API not found' });
}

const server = http.createServer(handle);

server.listen(port, host, () => {
  console.log(`Server ready on http://${host}:${port}`);
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});
