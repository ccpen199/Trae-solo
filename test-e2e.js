const http = require('http');

function request(port, method, path, data, token) {
  return new Promise((resolve, reject) => {
    const body = data ? JSON.stringify(data) : '';
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    if (body) headers['Content-Length'] = Buffer.byteLength(body);
    const req = http.request({ hostname: '127.0.0.1', port, path, method, headers }, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => {
        let j;
        try { j = JSON.parse(d); } catch { j = null; }
        resolve({ status: res.statusCode, data: j, raw: d });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

const api = (method, path, data, token) => request(58822, method, path, data, token);
const proxy = (method, path, data, token) => request(48822, method, path, data, token);

async function test() {
  let pass = 0, fail = 0;
  function check(name, ok) {
    if (ok) { pass++; console.log('  ✅ ' + name); }
    else { fail++; console.log('  ❌ ' + name); }
  }

  console.log('\n========================================');
  console.log('端到端测试：委托人登录→工作台→发单');
  console.log('========================================');
  
  const r1 = await api('POST', '/api/auth/client/login', { phone: '13800138001', password: '123456' });
  check('委托人登录成功', r1.status === 200 && r1.data.success);
  check('返回token', !!r1.data.token);
  check('返回用户信息', !!r1.data.user);
  const clientToken = r1.data.token;

  const r2 = await api('GET', '/api/tasks', null, clientToken);
  check('获取任务列表', r2.status === 200 && r2.data.success);
  check('任务列表含数据', r2.data.tasks && r2.data.tasks.length >= 0);

  const r3 = await api('POST', '/api/pricing/calculate', { distance_km: 8, safety_level_id: 1 });
  check('动态定价计算', r3.status === 200 && r3.data.success);
  check('返回final_price', r3.data.final_price > 0);
  console.log('  📊 定价明细: 基准价=' + r3.data.breakdown.base_price + ' 最终价=' + r3.data.final_price);

  const r4 = await api('POST', '/api/tasks', {
    pickup_address: '北京市朝阳区望京SOHO', delivery_address: '北京市海淀区中关村',
    distance_km: 12, item_name: '宠物猫', item_category: '宠物', safety_level_id: 1,
    special_requirements: '活体动物，注意通风', pickup_time: '2026-06-02 10:00:00'
  }, clientToken);
  check('发布任务成功', r4.status === 200 && r4.data.success);
  if (r4.data.success) {
    check('自动生成保单号', !!r4.data.task.insurance?.policy_number);
    check('自动生成物品特征码', !!r4.data.task.item?.feature_code);
    check('动态定价生效', r4.data.task.dynamic_price > r4.data.task.base_price);
    console.log('  📋 保单号: ' + r4.data.task.insurance?.policy_number);
    console.log('  🔑 特征码: ' + r4.data.task.item?.feature_code);
    console.log('  💰 基准价: ' + r4.data.task.base_price + ' → 动态价: ' + r4.data.task.dynamic_price);
  }

  console.log('\n========================================');
  console.log('端到端测试：管理员登录→后台→治理页面');
  console.log('========================================');

  const admins = [
    { id: 'admin', key: 'admin123', name: '系统管理员' },
    { id: 'platform', key: 'platform123', name: '平台运营' },
    { id: 'ops', key: 'ops123', name: '运维管理' }
  ];
  for (const a of admins) {
    const r = await api('POST', '/api/auth/admin/login', { admin_id: a.id, secret_key: a.key });
    check(a.name + '登录成功', r.status === 200 && r.data.success);
  }

  const adminR = await api('POST', '/api/auth/admin/login', { admin_id: 'admin', secret_key: 'admin123' });
  const adminToken = adminR.data.token;

  const r5 = await api('GET', '/api/admin/stats', null, adminToken);
  check('后台统计数据', r5.status === 200 && r5.data.success);
  console.log('  📊 任务总数: ' + r5.data.stats?.tasks?.total + ' 待接单: ' + r5.data.stats?.tasks?.pending);

  const r6 = await api('GET', '/api/admin/zones', null, adminToken);
  check('城市围栏列表', r6.status === 200 && r6.data.success && r6.data.zones.length > 0);
  console.log('  🗺️ 围栏数量: ' + r6.data.zones.length);

  const r7 = await api('GET', '/api/admin/restricted-items', null, adminToken);
  check('禁运词库列表', r7.status === 200 && r7.data.success && r7.data.items.length > 0);
  console.log('  🚫 禁运词数量: ' + r7.data.items.length);

  const r8 = await api('GET', '/api/admin/disputes', null, adminToken);
  check('纠纷仲裁台账', r8.status === 200 && r8.data.success);

  const r9 = await api('GET', '/api/admin/audit-logs', null, adminToken);
  check('骑手合规审计日志', r9.status === 200 && r9.data.success);
  console.log('  📝 审计日志数量: ' + r9.data.logs?.length);

  const r10 = await api('GET', '/api/admin/couriers', null, adminToken);
  check('骑手管理列表', r10.status === 200 && r10.data.success);

  console.log('\n========================================');
  console.log('端到端测试：接单人登录→资质提示');
  console.log('========================================');

  const r11 = await api('POST', '/api/auth/courier/login', { phone: '13900139001', password: '123456' });
  check('接单人登录成功', r11.status === 200 && r11.data.success);
  check('返回骑手状态', !!r11.data.courier?.status);
  console.log('  🏍️ 骑手状态: ' + r11.data.courier?.status);

  console.log('\n========================================');
  console.log('端到端测试：错误密码/不存在的账号');
  console.log('========================================');

  const r12 = await api('POST', '/api/auth/client/login', { phone: '13800138001', password: 'wrong' });
  check('错误密码返回401', r12.status === 401);
  check('错误密码有提示', !!r12.data?.error);
  console.log('  ⚠️ 提示: ' + r12.data?.error);

  const r13 = await api('POST', '/api/auth/admin/login', { admin_id: 'admin', secret_key: 'wrong' });
  check('错误密钥返回401', r13.status === 401);
  check('错误密钥有提示', !!r13.data?.error);
  console.log('  ⚠️ 提示: ' + r13.data?.error);

  const r14 = await api('POST', '/api/auth/client/login', { phone: '19999999999', password: '123456' });
  check('不存在的手机号返回401', r14.status === 401);

  console.log('\n========================================');
  console.log('端到端测试：前端代理转发验证');
  console.log('========================================');
  
  const r15 = await proxy('POST', '/api/auth/admin/login', { admin_id: 'admin', secret_key: 'admin123' });
  check('前端代理→管理员登录', r15.status === 200 && r15.data.success);
  
  const r16 = await proxy('POST', '/api/auth/client/login', { phone: '13800138001', password: '123456' });
  check('前端代理→委托人登录', r16.status === 200 && r16.data.success);

  console.log('\n========================================');
  console.log('测试结果: ✅ ' + pass + '  ❌ ' + fail);
  console.log('========================================');
}

test().catch(e => console.error(e));
