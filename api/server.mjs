import http from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const envPath = resolve(process.cwd(), '.env');

if (existsSync(envPath)) {
  const env = readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of env) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const index = trimmed.indexOf('=');
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.BACKEND_PORT || process.env.PORT || 59175);

const json = (res, status, payload) => {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
};

const templates = [
  { id: 'tpl-001', name: '高级前端工程师简历', category: '科技', industry: '互联网', usage: 982, rating: 4.9 },
  { id: 'tpl-002', name: '产品经理转型简历', category: '商务', industry: 'SaaS', usage: 756, rating: 4.8 },
  { id: 'tpl-003', name: '应届生校招简历', category: '简约', industry: '教育', usage: 641, rating: 4.7 },
];

const cases = [
  { id: 'case-001', title: '3年前端进阶大厂案例', category: '互联网', position: '前端工程师', tags: ['React', '性能优化', 'ATS'] },
  { id: 'case-002', title: '技术转产品经理案例', category: '产品', position: '产品经理', tags: ['PRD', '数据分析', '转型'] },
  { id: 'case-003', title: '应届毕业生实习包装案例', category: '校招', position: '运营管培生', tags: ['校园经历', '实习', 'STAR'] },
];

const adminDashboard = {
  overview: {
    total_users: 50000,
    total_templates: templates.length,
    total_cases: cases.length,
    ats_pass_rate: 86,
  },
  user_management: [
    { role: '求职者', count: 41200 },
    { role: 'HR顾问', count: 320 },
    { role: '企业账号', count: 860 },
  ],
  operations: [
    { label: '模板审核', count: 12, status: '待处理' },
    { label: '案例精选', count: 8, status: '本周新增' },
    { label: '导出任务', count: 46, status: '运行中' },
  ],
};

const profile = {
  id: 'user-89175',
  name: 'ResumeForge 用户',
  role: 'candidate',
  membership: 'pro',
  stats: {
    resumes: 12,
    interviews: 34,
    exports: 18,
  },
};

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://${host}:${port}`);

  if (url.pathname === '/api/health') {
    json(res, 200, {
      success: true,
      message: 'ok',
      service: 'may-89175-backend',
      app: 'ResumeForge AI',
      dataMode: 'local mock data',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (url.pathname === '/api/dashboard') {
    json(res, 200, {
      success: true,
      data: {
        resumes: 12,
        interviews: 34,
        cases: 8,
        conversionRate: 0.76,
      },
    });
    return;
  }

  if (url.pathname === '/api/admin/dashboard' || url.pathname === '/api/admin/stats') {
    json(res, 200, {
      success: true,
      data: adminDashboard,
    });
    return;
  }

  if (url.pathname === '/api/discover' || url.pathname === '/api/categories') {
    json(res, 200, {
      success: true,
      data: {
        categories: ['互联网', '产品', '校招', '金融', '设计', '教育'],
        recommended: cases,
        templates,
      },
    });
    return;
  }

  if (url.pathname === '/api/search') {
    const keyword = String(url.searchParams.get('q') || url.searchParams.get('keyword') || '').trim();
    const source = [...cases, ...templates];
    const items = keyword
      ? source.filter((item) => JSON.stringify(item).includes(keyword))
      : source;
    json(res, 200, {
      success: true,
      data: {
        keyword,
        items,
        total: items.length,
      },
    });
    return;
  }

  if (url.pathname === '/api/auth/me' || url.pathname === '/api/users/profile' || url.pathname === '/api/user/profile') {
    json(res, 200, {
      success: true,
      data: profile,
    });
    return;
  }

  if (url.pathname === '/api/products') {
    json(res, 200, {
      success: true,
      data: templates.map((item) => ({ ...item, price: item.id === 'tpl-001' ? 99 : 69, inventory: 100 })),
    });
    return;
  }

  if (url.pathname === '/api/orders') {
    json(res, 200, {
      success: true,
      data: {
        items: [
          { id: 'ord-89175-1', product: '高级前端工程师简历', status: '已支付', amount: 99 },
          { id: 'ord-89175-2', product: 'AI模拟面试', status: '已完成', amount: 39 },
        ],
        total: 2,
      },
    });
    return;
  }

  if (url.pathname === '/api/cart') {
    json(res, 200, {
      success: true,
      data: { items: [{ id: 'tpl-002', name: '产品经理转型简历', amount: 69 }], total: 69 },
    });
    return;
  }

  json(res, 404, {
    success: false,
    error: 'API not found',
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
