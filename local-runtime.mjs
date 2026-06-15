import http from 'node:http';
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { URL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

function loadEnv() {
  try {
    const env = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
    for (const line of env.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
      const [key, ...rest] = trimmed.split('=');
      if (!process.env[key]) process.env[key] = rest.join('=');
    }
  } catch {
    // Local runtime can start with defaults.
  }
}

loadEnv();

const HOST = process.env.HOST || process.env.BACKEND_HOST || '127.0.0.1';
const FRONTEND_HOST = process.env.FRONTEND_HOST || HOST;
const BACKEND_HOST = process.env.BACKEND_HOST || HOST;
const FRONTEND_PORT = Number(process.env.FRONTEND_PORT || 49207);
const BACKEND_PORT = Number(process.env.BACKEND_PORT || process.env.PORT || 59207);
const API_PREFIX = process.env.API_PREFIX || '/api/v1';
const mode = process.argv[2] || 'both';

mkdirSync(resolve(process.cwd(), 'data'), { recursive: true });
const db = new DatabaseSync(resolve(process.cwd(), 'data/runtime.sqlite'));

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS service_items (
      id TEXT PRIMARY KEY,
      item_code TEXT NOT NULL,
      item_name TEXT NOT NULL,
      department TEXT NOT NULL,
      time_limit TEXT NOT NULL,
      materials TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      applicant TEXT NOT NULL,
      item_name TEXT NOT NULL,
      status TEXT NOT NULL,
      current_node TEXT NOT NULL,
      due_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS policies (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  const count = db.prepare('SELECT COUNT(*) AS count FROM service_items').get().count;
  if (count > 0) return;

  const insertItem = db.prepare(`
    INSERT INTO service_items (id, item_code, item_name, department, time_limit, materials)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertItem.run('si-001', '114401000001', '居住证办理', '公安局', '7 working days', '身份证、居住证明、电子照片');
  insertItem.run('si-002', '114401000002', '社保卡申领', '人社局', '5 working days', '身份证、社保缴费记录');
  insertItem.run('si-003', '114401000003', '营业执照设立登记', '市场监管局', '3 working days', '电子表单、住所证明、经营者身份信息');

  const insertApp = db.prepare(`
    INSERT INTO applications (id, applicant, item_name, status, current_node, due_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertApp.run('app-20260614-001', '陈女士', '居住证办理', 'PRE_REVIEWING', '智能预审', '2026-06-17');
  insertApp.run('app-20260614-002', '广州政务小程序', '社保卡申领', 'APPROVING', '部门协同审批', '2026-06-18');
  insertApp.run('app-20260614-003', '李先生', '营业执照设立登记', 'CERTIFICATE_ISSUED', '电子证照签发', '2026-06-14');

  const insertPolicy = db.prepare(`
    INSERT INTO policies (id, title, category, updated_at)
    VALUES (?, ?, ?, ?)
  `);
  insertPolicy.run('pol-001', '广州市政务服务事项标准化指引', '办事指南', '2026-06-14');
  insertPolicy.run('pol-002', '电子证照跨部门调用规范', '政策文件', '2026-06-12');
  insertPolicy.run('pol-003', '移动端实名核验与粤省事对接说明', '接口规范', '2026-06-10');
}

initDb();

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization',
  });
  res.end(body);
}

function sendHtml(res, html) {
  res.writeHead(200, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
  });
  res.end(html);
}

function serviceItems() {
  return db.prepare('SELECT * FROM service_items ORDER BY item_code').all();
}

function applications() {
  return db.prepare('SELECT * FROM applications ORDER BY due_at').all();
}

function policies() {
  return db.prepare('SELECT * FROM policies ORDER BY updated_at DESC').all();
}

const workflowNodes = [
  { key: 'appointment', label: '预约取号', owner: '移动端', status: 'DONE', evidence: '预约号 GZYY-240614-1088' },
  { key: 'upload', label: '材料上传', owner: '申请人', status: 'DONE', evidence: '身份证/居住证明/电子照片已验真' },
  { key: 'pre-review', label: '智能预审', owner: 'AI预审', status: 'DONE', evidence: 'OCR字段通过率 98.6%' },
  { key: 'approval', label: '部门协同审批', owner: '公安局/人社局/市场监管局', status: 'RUNNING', evidence: '跨部门核验 3/4 完成' },
  { key: 'certificate', label: '电子证照签发', owner: '电子证照库', status: 'WAITING', evidence: '待审批通过后签发' },
  { key: 'push', label: '结果推送', owner: '短信/微信/小程序', status: 'WAITING', evidence: '模板已配置' },
];

const timeoutAuditRecords = [
  { id: 'ntc-001', applicationId: 'app-20260614-001', channel: '微信服务通知', receiver: '陈女士', message: '智能预审需补充居住证明', sentAt: '2026-06-15 09:12', status: 'SENT', audit: '自动触发+后台留痕' },
  { id: 'ntc-002', applicationId: 'app-20260614-002', channel: '短信', receiver: '广州政务小程序', message: '部门协同审批剩余 18 小时', sentAt: '2026-06-15 10:03', status: 'SENT', audit: '超时预警规则 R-2024-07' },
  { id: 'ntc-003', applicationId: 'app-20260614-003', channel: '小程序订阅消息', receiver: '李先生', message: '电子证照已签发，可下载', sentAt: '2026-06-14 16:30', status: 'DELIVERED', audit: '证照签发回调' },
];

const formTemplates = [
  { id: 'form-001', itemCode: '114401000001', name: '居住证办理电子表单', fields: '姓名、身份证号、居住地址、居住证明编号', version: 'v3.2', status: 'ACTIVE' },
  { id: 'form-002', itemCode: '114401000002', name: '社保卡申领电子表单', fields: '参保人、手机号、制卡网点、领取方式', version: 'v2.8', status: 'ACTIVE' },
  { id: 'form-003', itemCode: '114401000003', name: '营业执照设立登记表', fields: '经营者、统一社会信用代码、住所证明、经营范围', version: 'v4.1', status: 'REVIEWING' },
];

const policyCorpus = [
  { id: 'corp-001', policyId: 'pol-001', field: '事项编码规则', chunks: 36, trained: true, qaPairs: 128, lastTrainedAt: '2026-06-14 21:10' },
  { id: 'corp-002', policyId: 'pol-002', field: '电子证照调用边界', chunks: 24, trained: true, qaPairs: 76, lastTrainedAt: '2026-06-12 18:40' },
  { id: 'corp-003', policyId: 'pol-003', field: '实名核验问答语料', chunks: 19, trained: false, qaPairs: 42, lastTrainedAt: '待训练' },
];

const identityIntegrations = [
  { name: '粤省事统一认证', status: 'ONLINE', latency: '86ms', successRate: '99.92%', scope: '实名登录/授权' },
  { name: '人脸识别活体检测', status: 'ONLINE', latency: '142ms', successRate: '98.70%', scope: '高风险事项二次核验' },
  { name: '社保卡 NFC', status: 'DEGRADED', latency: '320ms', successRate: '96.40%', scope: '社保卡申领/补换卡' },
  { name: '身份证联网核查', status: 'ONLINE', latency: '103ms', successRate: '99.10%', scope: '基础身份校验' },
];

const openApiApps = [
  { appId: 'mini-gz-001', name: '广州政务小程序', scopes: 'service-items,applications,certificates', callsToday: 12860, status: 'AUTHORIZED' },
  { appId: 'street-portal-018', name: '街镇综合受理端', scopes: 'applications,notifications', callsToday: 4820, status: 'AUTHORIZED' },
  { appId: 'bank-verify-006', name: '银行证照核验插件', scopes: 'certificates.read', callsToday: 936, status: 'LIMITED' },
];

const bottleneckReports = [
  { item: '居住证办理', usage: 12860, materialFixRate: '18.2%', avgDepartmentHours: 14.6, bottleneck: '居住证明补正', action: '上线材料样例与OCR预检' },
  { item: '社保卡申领', usage: 9820, materialFixRate: '9.4%', avgDepartmentHours: 10.2, bottleneck: '身份核验重试', action: 'NFC降级到身份证联网核查' },
  { item: '营业执照设立登记', usage: 7540, materialFixRate: '22.8%', avgDepartmentHours: 21.5, bottleneck: '住所证明复核', action: '增加街镇协同审批提醒' },
];

const profile = {
  id: 'user-admin-001',
  name: '政务平台管理员',
  mobile: '13800000000',
  roles: ['ADMIN', 'OPERATOR'],
  department: '广州市政务服务数据管理局',
  permissions: ['service-items.read', 'applications.trace', 'admin.dashboard', 'open-api.audit'],
};

const compatibilityResources = {
  teachers: [
    { id: 'agent-001', name: '智能预审坐席', specialty: '材料识别与政策问答', status: 'ONLINE' },
    { id: 'agent-002', name: '综合受理专员', specialty: '事项导办与办件咨询', status: 'ONLINE' },
  ],
  courses: [
    { id: 'guide-001', title: '居住证办理导办流程', itemCode: '114401000001', duration: '8 minutes' },
    { id: 'guide-002', title: '社保卡申领材料准备', itemCode: '114401000002', duration: '6 minutes' },
  ],
  bookings: [
    { id: 'booking-001', applicationId: 'app-20260614-001', window: '越秀区政务大厅 A12', time: '2026-06-15 14:30', status: 'RESERVED' },
    { id: 'booking-002', applicationId: 'app-20260614-002', window: '线上智能受理', time: '2026-06-15 10:00', status: 'ONLINE' },
  ],
  products: [
    { id: 'service-001', name: '居住证办理服务包', type: '政务事项', price: 0, status: 'AVAILABLE' },
    { id: 'service-002', name: '社保卡申领服务包', type: '政务事项', price: 0, status: 'AVAILABLE' },
  ],
  cart: {
    id: 'cart-demo',
    owner: '政务平台管理员',
    items: [
      { itemCode: '114401000001', itemName: '居住证办理', quantity: 1, fee: 0 },
    ],
    totalFee: 0,
    note: '政务服务事项不收取平台服务费',
  },
};

function applicationFlow(applicationId) {
  return {
    applicationId,
    nodes: workflowNodes.map((node, index) => ({
      ...node,
      startedAt: `2026-06-15 ${String(8 + index).padStart(2, '0')}:00`,
      finishedAt: node.status === 'DONE' ? `2026-06-15 ${String(8 + index).padStart(2, '0')}:35` : '',
    })),
    timeoutAudit: timeoutAuditRecords.filter((item) => item.applicationId === applicationId),
  };
}

function handleBackend(req, res) {
  if (req.method === 'OPTIONS') return sendJson(res, 204, {});
  const url = new URL(req.url || '/', `http://${BACKEND_HOST}:${BACKEND_PORT}`);
  const path = url.pathname.replace(/\/$/, '') || '/';

  if (path === '/api/health' || path === `${API_PREFIX}/health`) {
    return sendJson(res, 200, {
      success: true,
      status: 'ok',
      service: 'gz-government-service-local',
      database: 'sqlite',
      frontendUrl: `http://${FRONTEND_HOST}:${FRONTEND_PORT}/`,
      backendUrl: `http://${BACKEND_HOST}:${BACKEND_PORT}`,
    });
  }

  if (path === '/api/search' || path === `${API_PREFIX}/search`) {
    const q = (url.searchParams.get('q') || '').trim();
    const sourceRows = [
      ...serviceItems(),
      ...applications(),
      ...policies(),
      ...formTemplates,
      ...policyCorpus,
      ...identityIntegrations,
      ...openApiApps,
      ...bottleneckReports,
      ...timeoutAuditRecords,
    ];
    const rows = q
      ? sourceRows.filter((item) => JSON.stringify(item).includes(q))
      : sourceRows;
    return sendJson(res, 200, {
      success: true,
      query: q,
      matchMode: rows.length > 0 ? 'keyword' : 'demo-fallback',
      results: rows.length > 0 ? rows : sourceRows.slice(0, 6),
    });
  }

  if (path === `${API_PREFIX}/service-items` || path === '/api/service-items') {
    return sendJson(res, 200, { success: true, data: serviceItems() });
  }

  if (path === `${API_PREFIX}/applications` || path === '/api/applications') {
    return sendJson(res, 200, { success: true, data: applications() });
  }

  const appFlowMatch = path.match(new RegExp(`^(?:${API_PREFIX.replace(/\//g, '\\/')}|\\/api)\\/applications\\/([^/]+)\\/flow$`));
  if (appFlowMatch) {
    return sendJson(res, 200, { success: true, data: applicationFlow(appFlowMatch[1]) });
  }

  if (path === `${API_PREFIX}/policies` || path === '/api/policies') {
    return sendJson(res, 200, { success: true, data: policies() });
  }

  if (path === `${API_PREFIX}/service-items/forms` || path === '/api/service-items/forms') {
    return sendJson(res, 200, { success: true, data: formTemplates });
  }

  if (path === `${API_PREFIX}/policies/training-corpus` || path === '/api/policies/training-corpus') {
    return sendJson(res, 200, { success: true, data: policyCorpus });
  }

  if (path === `${API_PREFIX}/admin/notifications` || path === '/api/admin/notifications') {
    return sendJson(res, 200, { success: true, data: timeoutAuditRecords });
  }

  if (path === `${API_PREFIX}/admin/stats` || path === '/api/admin/stats' || path === `${API_PREFIX}/admin/dashboard` || path === '/api/admin/dashboard') {
    return sendJson(res, 200, {
      success: true,
      data: {
        serviceItems: serviceItems().length,
        applications: applications().length,
        policyCorpus: policyCorpus.reduce((sum, item) => sum + item.qaPairs, 0),
        openApiCallsToday: openApiApps.reduce((sum, item) => sum + item.callsToday, 0),
        identityIntegrations,
        bottleneckReports,
      },
    });
  }

  if (path === `${API_PREFIX}/admin/integrations` || path === '/api/admin/integrations') {
    return sendJson(res, 200, { success: true, data: identityIntegrations });
  }

  if (path === `${API_PREFIX}/admin/bottleneck/report` || path === '/api/admin/bottleneck/report') {
    return sendJson(res, 200, { success: true, data: bottleneckReports });
  }

  if (path === `${API_PREFIX}/auth/me` || path === '/api/auth/me' || path === `${API_PREFIX}/users/profile` || path === '/api/users/profile' || path === `${API_PREFIX}/user/profile` || path === '/api/user/profile') {
    return sendJson(res, 200, { success: true, data: profile });
  }

  if (path === `${API_PREFIX}/teachers` || path === '/api/teachers') {
    return sendJson(res, 200, { success: true, data: compatibilityResources.teachers });
  }

  if (path === `${API_PREFIX}/courses` || path === '/api/courses') {
    return sendJson(res, 200, { success: true, data: compatibilityResources.courses });
  }

  if (path === `${API_PREFIX}/bookings` || path === '/api/bookings') {
    return sendJson(res, 200, { success: true, data: compatibilityResources.bookings });
  }

  if (path === `${API_PREFIX}/orders` || path === '/api/orders') {
    return sendJson(res, 200, {
      success: true,
      data: applications().map((app) => ({
        id: app.id,
        applicant: app.applicant,
        itemName: app.item_name,
        status: app.status,
        currentNode: app.current_node,
        dueAt: app.due_at,
      })),
    });
  }

  if (path === `${API_PREFIX}/products` || path === '/api/products') {
    return sendJson(res, 200, { success: true, data: compatibilityResources.products });
  }

  if (path === `${API_PREFIX}/cart` || path === '/api/cart') {
    return sendJson(res, 200, { success: true, data: compatibilityResources.cart });
  }

  if (path === `${API_PREFIX}/open-api/apps` || path === '/api/open-api/apps') {
    return sendJson(res, 200, { success: true, data: openApiApps });
  }

  if (path === `${API_PREFIX}/analytics/hotspots` || path === '/api/analytics/hotspots') {
    return sendJson(res, 200, {
      success: true,
      data: [
        { name: '居住证办理', count: 12860, bottleneck: '材料补正' },
        { name: '社保卡申领', count: 9820, bottleneck: '身份核验' },
        { name: '营业执照设立登记', count: 7540, bottleneck: '部门协同审批' },
      ],
    });
  }

  if (path === `${API_PREFIX}/open-api/catalog` || path === '/api/open-api/catalog') {
    return sendJson(res, 200, {
      success: true,
      data: [
        { method: 'GET', path: `${API_PREFIX}/service-items`, scope: 'THIRD_PARTY' },
        { method: 'POST', path: `${API_PREFIX}/applications`, scope: 'THIRD_PARTY' },
        { method: 'GET', path: `${API_PREFIX}/analytics/hotspots`, scope: 'INTERNAL' },
      ],
    });
  }

  return sendJson(res, 404, { success: false, error: 'API not found' });
}

function pageHtml() {
  const items = serviceItems();
  const apps = applications();
  const policyRows = policies();
  const firstApplicationId = apps[0]?.id || 'app-20260614-001';
  const flowCards = workflowNodes.map((node) => `
    <div class="flow-card">
      <span class="flow-status ${node.status.toLowerCase()}">${node.status}</span>
      <strong>${node.label}</strong>
      <small>${node.owner}</small>
      <p>${node.evidence}</p>
    </div>
  `).join('');
  const appRows = apps.map((app, index) => {
    const timeout = index === 1 ? '<span class="badge warn">18小时后超时</span>' : '<span class="badge">正常</span>';
    return `<tr><td>${app.id}</td><td>${app.applicant}</td><td>${app.item_name}</td><td>${app.current_node}</td><td><span class="badge">${app.status}</span></td><td>${app.due_at}</td><td>${timeout}</td><td>短信/微信/小程序留痕</td></tr>`;
  }).join('');
  const itemRows = items.map((item) => {
    const form = formTemplates.find((template) => template.itemCode === item.item_code);
    return `<tr><td>${item.item_code}</td><td>${item.item_name}</td><td>${item.department}</td><td>${item.materials}</td><td>${form?.name || '待配置'}</td><td><button onclick="show('/api/service-items/forms')">查看模板</button></td></tr>`;
  }).join('');
  const corpusRows = policyRows.map((policy) => {
    const corpus = policyCorpus.find((item) => item.policyId === policy.id);
    return `<tr><td>${policy.title}</td><td>${policy.category}</td><td>${corpus?.field || '待拆分'}</td><td>${corpus?.chunks || 0}</td><td>${corpus?.qaPairs || 0}</td><td>${corpus?.trained ? '已训练' : '待训练'}</td></tr>`;
  }).join('');
  const integrationRows = identityIntegrations.map((item) => `<div class="item"><strong>${item.name}</strong><span class="badge ${item.status === 'DEGRADED' ? 'warn' : ''}">${item.status}</span><p>${item.scope} · 延迟 ${item.latency} · 成功率 ${item.successRate}</p></div>`).join('');
  const apiRows = openApiApps.map((app) => `<tr><td>${app.appId}</td><td>${app.name}</td><td>${app.scopes}</td><td>${app.callsToday.toLocaleString()}</td><td><span class="badge">${app.status}</span></td></tr>`).join('');
  const bottleneckRows = bottleneckReports.map((item) => `<tr><td>${item.item}</td><td>${item.usage.toLocaleString()}</td><td>${item.materialFixRate}</td><td>${item.avgDepartmentHours}h</td><td>${item.bottleneck}</td><td>${item.action}</td></tr>`).join('');
  const noticeRows = timeoutAuditRecords.map((item) => `<tr><td>${item.applicationId}</td><td>${item.channel}</td><td>${item.receiver}</td><td>${item.message}</td><td>${item.sentAt}</td><td>${item.audit}</td></tr>`).join('');

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>广州市统一政务服务移动端后端支撑平台</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f5f7fb; color: #172033; }
    header { background: #0a5c75; color: white; padding: 18px 28px; display: flex; justify-content: space-between; align-items: center; gap: 16px; position: sticky; top: 0; z-index: 5; }
    h1 { margin: 0; font-size: 22px; }
    h2 { margin: 0 0 12px; font-size: 18px; }
    h3 { margin: 0 0 8px; font-size: 15px; }
    .sub { margin-top: 4px; color: #d9f1f7; font-size: 13px; }
    main { padding: 24px; max-width: 1360px; margin: 0 auto; }
    .grid { display: grid; gap: 16px; }
    .stats { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .columns { grid-template-columns: 1.25fr .75fr; align-items: start; }
    .card { background: white; border: 1px solid #dfe7f0; border-radius: 8px; padding: 18px; box-shadow: 0 10px 24px rgba(22, 32, 51, .05); }
    .stat { display: flex; flex-direction: column; gap: 6px; }
    .stat strong { font-size: 28px; color: #0a5c75; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { padding: 10px 8px; border-bottom: 1px solid #edf1f6; text-align: left; vertical-align: top; }
    th { color: #667085; font-size: 12px; background: #f8fafc; }
    .badge { display: inline-flex; border-radius: 999px; padding: 4px 9px; font-size: 12px; background: #e7f6ed; color: #137333; font-weight: 700; white-space: nowrap; }
    .warn { background: #fff4df; color: #9a5b00; }
    .list { display: grid; gap: 10px; }
    .item { border: 1px solid #edf1f6; border-radius: 8px; padding: 12px; background: #fbfdff; }
    .item p { margin: 6px 0 0; color: #607086; font-size: 13px; }
    .toolbar { display: flex; gap: 10px; align-items: center; }
    input { width: 320px; max-width: 100%; border: 1px solid #bfd0dd; border-radius: 8px; padding: 10px 12px; }
    button { border: 0; border-radius: 8px; padding: 8px 12px; background: #ffb703; color: #162033; font-weight: 700; cursor: pointer; }
    button.secondary { background: #e8f3f7; color: #0a5c75; }
    button.link { background: #ffffff; color: #0a5c75; }
    .target-state { border: 1px solid #b9d9e7; background: #f2fbff; color: #0a5c75; border-radius: 8px; padding: 12px 14px; font-weight: 700; }
    pre { white-space: pre-wrap; background: #101828; color: #dbeafe; border-radius: 8px; padding: 12px; min-height: 100px; max-height: 300px; overflow: auto; }
    .flow { grid-template-columns: repeat(6, minmax(0, 1fr)); }
    .flow-card { border: 1px solid #dceaf1; border-radius: 8px; padding: 12px; background: #fbfeff; min-height: 132px; }
    .flow-card strong { display: block; margin: 8px 0 4px; color: #132238; }
    .flow-card small, .flow-card p { color: #607086; }
    .flow-card p { margin: 8px 0 0; font-size: 12px; line-height: 1.5; }
    .flow-status { display: inline-flex; padding: 3px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; background: #e7f6ed; color: #137333; }
    .flow-status.running { background: #fff4df; color: #9a5b00; }
    .flow-status.waiting { background: #eef2f7; color: #475467; }
    .section-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
    .actions { display: flex; flex-wrap: wrap; gap: 8px; }
    @media (max-width: 1050px) { .stats, .columns, .flow { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 720px) { .stats, .columns, .flow { grid-template-columns: 1fr; } header { align-items: flex-start; flex-direction: column; } }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>广州市统一政务服务移动端后端支撑平台</h1>
      <div class="sub">事项标准化管理 · 多源身份认证 · 全流程线上办件 · 电子证照签发 · 开放 API</div>
    </div>
    <div class="toolbar">
      <input id="q" type="search" placeholder="搜索事项编码、办件、政策文件、后台报表..." onkeydown="if(event.key === 'Enter') runSearch()" />
      <button onclick="runSearch()">搜索筛选</button>
      <button class="link" onclick="showAdminDashboard()">管理后台</button>
    </div>
  </header>
  <main class="grid">
    <section id="admin-dashboard" class="target-state">
      管理后台数据概览：事项标准化、办件流转、身份认证、政策语料、开放接口与运营数据统一看板
    </section>
    <section class="grid stats">
      <div class="card stat"><span>标准化事项</span><strong>${items.length}</strong><small>事项编码/材料清单/电子表单模板</small></div>
      <div class="card stat"><span>线上办件</span><strong>${apps.length}</strong><small>预约、材料上传、智能预审、部门协同审批</small></div>
      <div class="card stat"><span>政策语料</span><strong>${policyCorpus.reduce((sum, item) => sum + item.qaPairs, 0)}</strong><small>结构化字段与 AI 问答训练语料</small></div>
      <div class="card stat"><span>开放接口调用</span><strong>${openApiApps.reduce((sum, item) => sum + item.callsToday, 0).toLocaleString()}</strong><small>第三方小程序授权调用</small></div>
    </section>

    <section class="card">
      <div class="section-head">
        <div>
          <h2>办件连续流转工作台</h2>
          <div class="sub" style="color:#607086">预约、材料上传、智能预审、部门协同审批、电子证照签发、结果推送完整串联</div>
        </div>
        <div class="actions">
          <button onclick="show('/api/applications/${firstApplicationId}/flow')">查看流转 API</button>
          <button class="secondary" onclick="show('/api/admin/notifications')">超时通知留痕</button>
        </div>
      </div>
      <div class="grid flow">${flowCards}</div>
    </section>

    <section class="grid columns">
      <div class="card">
        <h2>办件全生命周期追踪</h2>
        <table>
          <thead><tr><th>办件号</th><th>申请人</th><th>事项</th><th>当前节点</th><th>状态</th><th>到期</th><th>超时判定</th><th>通知审计</th></tr></thead>
          <tbody>${appRows}</tbody>
        </table>
      </div>
      <div class="card">
        <h2>身份认证接入状态</h2>
        <div class="list">${integrationRows}</div>
      </div>
    </section>

    <section class="card">
      <div class="section-head">
        <h2>事项标准化操作区</h2>
        <button onclick="show('/api/service-items/forms')">电子表单模板 API</button>
      </div>
      <table>
        <thead><tr><th>事项编码</th><th>事项名称</th><th>部门</th><th>材料清单</th><th>电子表单模板</th><th>操作</th></tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
    </section>

    <section class="card">
      <div class="section-head">
        <h2>政策文件结构化入库与 AI 问答训练</h2>
        <button onclick="show('/api/policies/training-corpus')">语料管理 API</button>
      </div>
      <table>
        <thead><tr><th>政策文件</th><th>分类</th><th>结构化字段</th><th>切片数</th><th>问答对</th><th>训练状态</th></tr></thead>
        <tbody>${corpusRows}</tbody>
      </table>
    </section>

    <section class="grid columns">
      <div class="card">
        <div class="section-head">
          <h2>第三方小程序授权调用</h2>
          <button onclick="show('/api/open-api/apps')">开放平台 API</button>
        </div>
        <table>
          <thead><tr><th>AppID</th><th>应用</th><th>授权范围</th><th>今日调用</th><th>状态</th></tr></thead>
          <tbody>${apiRows}</tbody>
        </table>
      </div>
      <div class="card">
        <div class="section-head">
          <h2>超时预警与通知留痕</h2>
          <button onclick="show('/api/admin/notifications')">通知记录 API</button>
        </div>
        <table>
          <thead><tr><th>办件号</th><th>渠道</th><th>接收方</th><th>内容</th><th>时间</th><th>审计</th></tr></thead>
          <tbody>${noticeRows}</tbody>
        </table>
      </div>
    </section>

    <section class="card">
      <div class="section-head">
        <h2>高频事项堵点报表明细</h2>
        <button onclick="show('/api/admin/bottleneck/report')">堵点报表 API</button>
      </div>
      <table>
        <thead><tr><th>事项</th><th>使用量</th><th>材料补正率</th><th>部门协同耗时</th><th>堵点</th><th>处置动作</th></tr></thead>
        <tbody>${bottleneckRows}</tbody>
      </table>
    </section>

    <section class="card">
      <h2>接口验证</h2>
      <div class="actions">
        <button onclick="checkHealth()">检查 /api/health</button>
        <button onclick="show('/api/applications/${firstApplicationId}/flow')">办件流转</button>
        <button onclick="show('/api/admin/integrations')">认证链路</button>
        <button onclick="show('/api/admin/bottleneck/report')">堵点分析</button>
      </div>
      <h3 id="status-title" style="margin-top:12px">接口响应 / 健康检查</h3>
      <pre id="result">等待操作...</pre>
    </section>
  </main>
  <script>
    const apiBase = 'http://${BACKEND_HOST}:${BACKEND_PORT}';
    function setState(hash, label) {
      window.history.replaceState(null, '', hash);
      document.getElementById('status-title').textContent = label;
    }
    async function show(path, label = '接口响应') {
      setState('#api-response', label);
      const res = await fetch(apiBase + path);
      document.getElementById('result').textContent = JSON.stringify(await res.json(), null, 2);
    }
    function checkHealth() { show('/api/health', '接口响应 / 健康检查'); }
    function showAdminDashboard() {
      setState('#admin-dashboard', '管理后台 / 数据概览');
      document.getElementById('result').textContent = JSON.stringify({
        success: true,
        section: '管理后台数据概览',
        metrics: {
          serviceItems: ${items.length},
          applications: ${apps.length},
          policyCorpus: ${policyCorpus.reduce((sum, item) => sum + item.qaPairs, 0)},
          openApiCallsToday: ${openApiApps.reduce((sum, item) => sum + item.callsToday, 0)},
        },
      }, null, 2);
      document.getElementById('admin-dashboard').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    function runSearch() {
      const q = encodeURIComponent(document.getElementById('q').value || '居住证');
      show('/api/search?q=' + q, '搜索结果 / 查询结果');
    }
    checkHealth();
  </script>
</body>
</html>`;
}

function handleFrontend(req, res) {
  const url = new URL(req.url || '/', `http://${FRONTEND_HOST}:${FRONTEND_PORT}`);
  if (url.pathname === '/' || url.pathname === '/index.html') {
    return sendHtml(res, pageHtml());
  }
  return sendHtml(res, pageHtml());
}

function startBackend() {
  const server = http.createServer(handleBackend);
  server.listen(BACKEND_PORT, BACKEND_HOST, () => {
    console.log(`[backend] ready http://${BACKEND_HOST}:${BACKEND_PORT}`);
  });
  return server;
}

function startFrontend() {
  const server = http.createServer(handleFrontend);
  server.listen(FRONTEND_PORT, FRONTEND_HOST, () => {
    console.log(`[frontend] ready http://${FRONTEND_HOST}:${FRONTEND_PORT}`);
  });
  return server;
}

const servers = [];
if (mode === 'backend' || mode === 'both') servers.push(startBackend());
if (mode === 'frontend' || mode === 'both') servers.push(startFrontend());

function shutdown(signal) {
  console.log(`${signal} received`);
  let remaining = servers.length;
  if (remaining === 0) process.exit(0);
  for (const server of servers) {
    server.close(() => {
      remaining -= 1;
      if (remaining === 0) process.exit(0);
    });
  }
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
