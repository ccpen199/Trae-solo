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
const port = Number(process.env.BACKEND_PORT || process.env.PORT || 59174);

const sendJson = (res, status, payload) => {
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

const jobs = [
  { id: 'job-001', title: '高级前端工程师', company: '星河科技', category: '技术', salary: '35-55K', tags: ['React', 'TypeScript', '直播招聘'] },
  { id: 'job-002', title: 'AI产品经理', company: '智聘云', category: '产品', salary: '30-45K', tags: ['AI', 'SaaS', '增长'] },
  { id: 'job-003', title: '招聘运营专家', company: '未来人才集团', category: '运营', salary: '20-32K', tags: ['招聘会', '雇主品牌'] },
];

const mentors = [
  { id: 'mentor-001', name: '林老师', specialty: '简历诊断', rating: 4.9, slots: ['今天 19:00', '明天 10:30'] },
  { id: 'mentor-002', name: '周导师', specialty: '视频面试陪练', rating: 4.8, slots: ['今天 20:00', '周六 14:00'] },
];

const courses = [
  { id: 'course-001', title: 'AI 简历优化课', category: '求职课程', lessons: 8, enrolled: 1260 },
  { id: 'course-002', title: '直播招聘面试训练营', category: '面试课程', lessons: 6, enrolled: 840 },
];

const bookings = [
  { id: 'booking-001', service: '视频面试预约', mentor: '周导师', time: '今天 20:00', status: '已确认' },
  { id: 'booking-002', service: '简历诊断预约', mentor: '林老师', time: '明天 10:30', status: '待开始' },
];

const profile = {
  id: 'recruit-user-89174',
  name: '企业管理员',
  role: 'employer',
  company: '智聘OS演示企业',
  stats: {
    publishedJobs: 12,
    resumes: 86,
    interviews: 24,
  },
};

const adminDashboard = {
  overview: {
    total_users: 12860,
    total_jobs: jobs.length,
    total_resumes: 4820,
    active_live_rooms: 6,
  },
  modules: [
    { label: '职位管理', count: 12, status: '招聘中' },
    { label: '简历管理', count: 86, status: '待筛选' },
    { label: '直播管理', count: 6, status: '直播中' },
    { label: '招聘会管理', count: 3, status: '本周' },
  ],
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
    sendJson(res, 200, {
      success: true,
      message: 'ok',
      service: 'may-89174-backend',
      app: 'smart-recruitment-os',
      dataMode: 'local sqlite prisma',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (url.pathname === '/api/auth/me' || url.pathname === '/api/users/profile' || url.pathname === '/api/user/profile') {
    sendJson(res, 200, { success: true, data: profile });
    return;
  }

  if (url.pathname === '/api/admin/dashboard' || url.pathname === '/api/admin/stats') {
    sendJson(res, 200, { success: true, data: adminDashboard });
    return;
  }

  if (url.pathname === '/api/search') {
    const keyword = String(url.searchParams.get('q') || url.searchParams.get('keyword') || '').trim();
    const items = keyword
      ? jobs.filter((item) => JSON.stringify(item).includes(keyword))
      : jobs;
    sendJson(res, 200, { success: true, data: { keyword, items, total: items.length } });
    return;
  }

  if (url.pathname === '/api/teachers') {
    sendJson(res, 200, { success: true, data: { items: mentors, total: mentors.length } });
    return;
  }

  if (url.pathname === '/api/courses') {
    sendJson(res, 200, { success: true, data: { items: courses, total: courses.length } });
    return;
  }

  if (url.pathname === '/api/bookings') {
    sendJson(res, 200, { success: true, data: { items: bookings, total: bookings.length } });
    return;
  }

  if (url.pathname === '/api/discover' || url.pathname === '/api/categories') {
    sendJson(res, 200, {
      success: true,
      data: {
        categories: ['技术', '产品', '运营', '设计', '销售', '直播招聘'],
        recommended: jobs,
        channels: ['直播招聘', '雇主品牌', '薪酬报告', '招聘会管理'],
      },
    });
    return;
  }

  if (url.pathname === '/api/products') {
    sendJson(res, 200, {
      success: true,
      data: [
        { id: 'plan-basic', name: '基础招聘套餐', price: 299, category: 'plan', inventory: 99 },
        { id: 'plan-live', name: '直播招聘权益包', price: 899, category: 'live', inventory: 30 },
      ],
    });
    return;
  }

  if (url.pathname === '/api/orders') {
    sendJson(res, 200, {
      success: true,
      data: {
        items: [
          { id: 'order-89174-1', product: '直播招聘权益包', status: '已开通', amount: 899 },
          { id: 'order-89174-2', product: '薪酬报告', status: '已生成', amount: 199 },
        ],
        total: 2,
      },
    });
    return;
  }

  if (url.pathname === '/api/cart') {
    sendJson(res, 200, { success: true, data: { items: [], total: 0 } });
    return;
  }

  sendJson(res, 404, {
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
