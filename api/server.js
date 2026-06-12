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
const port = Number(process.env.BACKEND_PORT || process.env.PORT || 59177);

const user = {
  id: 'user-owner-001',
  role: 'owner',
  nickname: '业主用户',
  phone: '138****8888',
};

const adminDashboard = {
  overview: {
    companiesPending: 6,
    activeProjects: 18,
    materialSkus: 248,
    openDisputes: 3,
  },
  modules: ['公司审核', '项目甘特图', '供应链对接', '建材SKU', '纠纷工单'],
};

const serviceCatalog = [
  { id: 'design-plan', name: '3D设计方案生成', category: 'design', price: 199 },
  { id: 'measurement', name: '上门量房预约', category: 'appointment', price: 0 },
  { id: 'material-pack', name: '环保主材套餐', category: 'material', price: 12999 },
];

const professionalCatalog = {
  teachers: [
    { id: 'designer-001', name: '陈予安', role: '资深空间设计师', specialty: '全屋3D方案', rating: 4.9 },
    { id: 'supervisor-001', name: '周明', role: '第三方监理', specialty: '水电验收与工艺巡检', rating: 4.8 },
  ],
  courses: [
    { id: 'course-001', title: '装修避坑公开课', category: 'guide', lessons: 12 },
    { id: 'course-002', title: '预算报价拆解课', category: 'quote', lessons: 8 },
  ],
  bookings: [
    { id: 'booking-001', service: '上门量房预约', status: 'confirmed', scheduledAt: '2026-06-13 10:00' },
    { id: 'booking-002', service: '第三方监理巡检', status: 'pending', scheduledAt: '2026-06-15 14:30' },
  ],
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  });
  res.end(JSON.stringify(payload));
}

function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildPlaceholderImage(prompt, imageSize) {
  const label = escapeXml(String(prompt || '装修设计图片').slice(0, 40));
  const subtitle = escapeXml(imageSize || 'local-placeholder');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="720" viewBox="0 0 960 720">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fff7ed"/>
      <stop offset="55%" stop-color="#fde68a"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>
  </defs>
  <rect width="960" height="720" fill="url(#bg)"/>
  <rect x="86" y="86" width="788" height="548" rx="28" fill="#ffffff" opacity="0.7"/>
  <rect x="178" y="172" width="604" height="296" rx="18" fill="#fed7aa" opacity="0.72"/>
  <path d="M226 468h508v84H226z" fill="#c2410c" opacity="0.22"/>
  <path d="M300 438h360v92H300z" fill="#334155" opacity="0.18"/>
  <circle cx="720" cy="214" r="48" fill="#fb923c" opacity="0.78"/>
  <text x="480" y="604" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" font-weight="700" fill="#7c2d12">${label}</text>
  <text x="480" y="646" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="#57534e">${subtitle}</text>
</svg>`;
}

function sendSvgImage(res, prompt, imageSize) {
  res.writeHead(200, {
    'Content-Type': 'image/svg+xml; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=300',
  });
  res.end(buildPlaceholderImage(prompt, imageSize));
}

function route(req, res) {
  const url = new URL(req.url || '/', `http://${host}:${port}`);

  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  if (url.pathname === '/api/ide/v1/text_to_image') {
    sendSvgImage(
      res,
      url.searchParams.get('prompt') || '',
      url.searchParams.get('image_size') || 'landscape_4_3',
    );
    return;
  }

  if (url.pathname === '/api/health') {
    sendJson(res, 200, {
      success: true,
      message: 'ok',
      service: 'may-89177-backend',
      app: '居智通装修全流程服务平台',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (['/api/auth/me', '/api/users/profile', '/api/user/profile'].includes(url.pathname)) {
    sendJson(res, 200, { success: true, data: user });
    return;
  }

  if (['/api/admin/dashboard', '/api/admin/stats'].includes(url.pathname)) {
    sendJson(res, 200, { success: true, data: adminDashboard });
    return;
  }

  if (url.pathname === '/api/products') {
    sendJson(res, 200, { success: true, data: serviceCatalog });
    return;
  }

  if (url.pathname === '/api/teachers') {
    sendJson(res, 200, { success: true, data: professionalCatalog.teachers });
    return;
  }

  if (url.pathname === '/api/courses') {
    sendJson(res, 200, { success: true, data: professionalCatalog.courses });
    return;
  }

  if (url.pathname === '/api/bookings') {
    sendJson(res, 200, { success: true, data: professionalCatalog.bookings });
    return;
  }

  if (url.pathname === '/api/cart') {
    sendJson(res, 200, { success: true, data: { items: [{ productId: 'design-plan', quantity: 1 }], total: 199 } });
    return;
  }

  if (url.pathname === '/api/orders') {
    sendJson(res, 200, {
      success: true,
      data: {
        items: [
          { id: 'order-89177-001', product: '上门量房预约', status: '已确认', amount: 0 },
          { id: 'order-89177-002', product: '3D设计方案生成', status: '处理中', amount: 199 },
        ],
        total: 2,
      },
    });
    return;
  }

  if (url.pathname === '/api/search') {
    const keyword = (url.searchParams.get('q') || url.searchParams.get('keyword') || '').trim();
    const items = serviceCatalog.filter((item) => !keyword || `${item.name}${item.category}`.includes(keyword));
    sendJson(res, 200, { success: true, data: { keyword, items, total: items.length } });
    return;
  }

  sendJson(res, 404, { success: false, error: 'API not found' });
}

const server = http.createServer(route);

server.listen(port, host, () => {
  console.log(`may-89177 backend listening on http://${host}:${port}`);
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
