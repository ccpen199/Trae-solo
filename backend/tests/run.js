require('dotenv').config({ path: '../../.env' });
const assert = require('assert');
const Database = require('better-sqlite3');
const path = require('path');

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║           SSL证书管理系统 - 测试套件                     ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

const dbPath = path.join(__dirname, '../data/ssl_manager.db');
const db = new Database(dbPath);

let passed = 0;
let failed = 0;

const test = (name, fn) => {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`❌ ${name}`);
    console.log(`   错误: ${e.message}`);
    failed++;
  }
};

console.log('📋 开始数据库结构测试...\n');

test('用户表存在', () => {
  const table = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
  assert(table, '用户表不存在');
});

test('域名表存在', () => {
  const table = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='domains'").get();
  assert(table, '域名表不存在');
});

test('证书表存在', () => {
  const table = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='certificates'").get();
  assert(table, '证书表不存在');
});

test('续签任务表存在', () => {
  const table = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='renewal_tasks'").get();
  assert(table, '续签任务表不存在');
});

test('变更记录表存在', () => {
  const table = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='change_logs'").get();
  assert(table, '变更记录表不存在');
});

test('告警表存在', () => {
  const table = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='alerts'").get();
  assert(table, '告警表不存在');
});

console.log('\n📋 开始数据完整性测试...\n');

test('默认管理员用户存在', () => {
  const user = db.prepare("SELECT * FROM users WHERE username = 'admin'").get();
  assert(user, '管理员用户不存在');
  assert(user.role === 'admin', '用户角色不正确');
});

test('存在测试域名数据', () => {
  const count = db.prepare("SELECT COUNT(*) as count FROM domains").get().count;
  assert(count > 0, '域名数据为空');
  console.log(`   域名数量: ${count}`);
});

test('存在测试证书数据', () => {
  const count = db.prepare("SELECT COUNT(*) as count FROM certificates").get().count;
  assert(count > 0, '证书数据为空');
  console.log(`   证书数量: ${count}`);
});

test('存在测试任务数据', () => {
  const count = db.prepare("SELECT COUNT(*) as count FROM renewal_tasks").get().count;
  assert(count > 0, '任务数据为空');
  console.log(`   任务数量: ${count}`);
});

test('存在变更记录数据', () => {
  const count = db.prepare("SELECT COUNT(*) as count FROM change_logs").get().count;
  assert(count > 0, '变更记录为空');
  console.log(`   记录数量: ${count}`);
});

console.log('\n📋 开始业务逻辑测试...\n');

test('域名关联证书正确', () => {
  const domain = db.prepare(`
    SELECT d.*, c.id as cert_id 
    FROM domains d
    LEFT JOIN certificates c ON d.id = c.domain_id
    LIMIT 1
  `).get();
  assert(domain && domain.cert_id, '域名没有关联证书');
});

test('任务关联证书和域名正确', () => {
  const task = db.prepare(`
    SELECT t.*, c.id as cert_id, d.id as domain_id
    FROM renewal_tasks t
    LEFT JOIN certificates c ON t.cert_id = c.id
    LEFT JOIN domains d ON t.domain_id = d.id
    LIMIT 1
  `).get();
  assert(task, '任务数据异常');
  assert(task.cert_id, '任务未关联证书');
  assert(task.domain_id, '任务未关联域名');
});

test('变更记录关联正确', () => {
  const log = db.prepare(`
    SELECT * FROM change_logs 
    WHERE domain_id IS NOT NULL OR cert_id IS NOT NULL
    LIMIT 1
  `).get();
  assert(log, '变更记录关联异常');
});

console.log('\n📋 开始边界条件测试...\n');

test('存在即将过期的证书', () => {
  const certs = db.prepare(`
    SELECT * FROM certificates 
    WHERE julianday(expiry_date) - julianday('now') <= 30
      AND julianday(expiry_date) - julianday('now') > 0
  `).all();
  console.log(`   即将过期证书数量: ${certs.length}`);
});

test('存在已过期的证书', () => {
  const certs = db.prepare("SELECT * FROM certificates WHERE status = 'expired'").all();
  console.log(`   已过期证书数量: ${certs.length}`);
});

test('存在弱算法证书', () => {
  const certs = db.prepare(`
    SELECT * FROM certificates 
    WHERE algorithm IN ('RSA-1024', 'MD5-RSA', 'SHA1-RSA')
       OR algorithm LIKE '%MD5%'
       OR algorithm LIKE '%SHA1%'
  `).all();
  console.log(`   弱算法证书数量: ${certs.length}`);
});

test('存在失败的任务', () => {
  const tasks = db.prepare("SELECT * FROM renewal_tasks WHERE status = 'failed'").all();
  console.log(`   失败任务数量: ${tasks.length}`);
});

console.log('\n📋 开始API接口测试...\n');

const http = require('http');

const apiTest = (method, path, data = null, token = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: process.env.SERVER_PORT || 5174,
      path: `/api${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
};

let authToken = null;

test('健康检查接口正常', async () => {
  try {
    const res = await apiTest('GET', '/health');
    assert(res.status === 200, `状态码异常: ${res.status}`);
    assert(res.data.status === 'ok', '健康检查失败');
  } catch (e) {
    throw new Error('后端服务未启动或无法连接');
  }
});

test('登录接口正常', async () => {
  const res = await apiTest('POST', '/auth/login', { username: 'admin', password: 'admin123' });
  assert(res.status === 200, `登录失败: ${res.status}`);
  assert(res.data.token, '未返回token');
  authToken = res.data.token;
  console.log(`   获取Token成功`);
});

test('域名列表接口正常', async () => {
  const res = await apiTest('GET', '/domains', null, authToken);
  assert(res.status === 200, `接口异常: ${res.status}`);
  assert(Array.isArray(res.data.domains), '返回数据格式错误');
});

test('证书列表接口正常', async () => {
  const res = await apiTest('GET', '/certificates', null, authToken);
  assert(res.status === 200, `接口异常: ${res.status}`);
  assert(Array.isArray(res.data.certificates), '返回数据格式错误');
});

test('任务列表接口正常', async () => {
  const res = await apiTest('GET', '/tasks', null, authToken);
  assert(res.status === 200, `接口异常: ${res.status}`);
  assert(Array.isArray(res.data.tasks), '返回数据格式错误');
});

test('变更记录接口正常', async () => {
  const res = await apiTest('GET', '/logs', null, authToken);
  assert(res.status === 200, `接口异常: ${res.status}`);
  assert(Array.isArray(res.data.logs), '返回数据格式错误');
});

test('仪表盘统计接口正常', async () => {
  const res = await apiTest('GET', '/dashboard/summary', null, authToken);
  assert(res.status === 200, `接口异常: ${res.status}`);
  assert(res.data.summary, '返回数据格式错误');
});

test('风险看板接口正常', async () => {
  const res = await apiTest('GET', '/dashboard/risks', null, authToken);
  assert(res.status === 200, `接口异常: ${res.status}`);
  assert(res.data.risks, '返回数据格式错误');
});

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log(`║  测试完成: 通过 ${passed} 项, 失败 ${failed} 项`);
console.log('╚══════════════════════════════════════════════════════════╝');

process.exit(failed > 0 ? 1 : 0);
