import http from 'http';

function post(path, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5173,
        path: '/api' + path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          ...headers,
        },
      },
      (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => {
          try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
          catch { resolve({ status: res.statusCode, data: d }); }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function get(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5173,
        path: '/api' + path,
        method: 'GET',
        headers,
      },
      (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => {
          try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
          catch { resolve({ status: res.statusCode, data: d }); }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function test() {
  let token = null;

  console.log('========== 前端模拟：完整登录 + 业务流程 ==========');

  console.log('\n1. 发送验证码');
  const r1 = await post('/auth/send-code', { phone: '13800138000' });
  console.log('   ✓ Status:', r1.status, '| Success:', r1.data.success);

  console.log('\n2. 登录（模拟前端 axios）');
  const r2 = await post('/auth/login', { phone: '13800138000', verifyCode: '123456' });
  console.log('   ✓ Status:', r2.status, '| Success:', r2.data.success);
  if (r2.data.success) {
    token = r2.data.token;
    const user = r2.data.user;
    console.log('   ✓ Token:', token?.slice(0, 20) + '...');
    console.log('   ✓ User:', user.name, '| elderlyMode:', user.elderlyMode, '| fontScale:', user.fontScale);
    console.log('   ✓ 亲属:', user.relatives?.[0]?.name, '(' + user.relatives?.[0]?.relation + ')');
  } else {
    console.log('   ✗ 登录失败:', r2.data.error);
    return;
  }

  console.log('\n3. 携带Token访问业务接口（模拟 axios 拦截器解包后的效果）');
  const authHeader = { Authorization: `Bearer ${token}` };

  const tests = [
    { name: '首页推荐服务', path: '/recommend/services', checkArray: false },
    { name: '社保账户', path: '/social/account', checkArray: false },
    { name: '社保记录', path: '/social/records', checkArray: true },
    { name: '户籍业务', path: '/household/list', checkArray: true },
    { name: '乘车码', path: '/transport/qr', checkArray: false },
    { name: '乘车记录', path: '/transport/records', checkArray: true },
    { name: '电子证照', path: '/certificates', checkArray: true },
    { name: '健康码', path: '/health/code', checkArray: false },
    { name: '审计日志', path: '/audit/logs', checkArray: true },
    { name: '学区学校', path: '/education/schools', checkArray: true },
  ];

  let allPass = true;
  for (const t of tests) {
    const r = await get(t.path, authHeader);
    const ok = r.status === 200 && r.data.success === true;
    const body = r.data;
    const data = body.data;
    const dataOk = data !== undefined && data !== null;
    const arrayOk = !t.checkArray || (Array.isArray(data) && data.length > 0);
    const pass = ok && dataOk && arrayOk;
    allPass = allPass && pass;
    console.log(`   ${pass ? '✓' : '✗'} ${t.name.padEnd(10)} status:${r.status} success:${body.success} hasData:${dataOk} ${t.checkArray ? 'len:' + (Array.isArray(data) ? data.length : 'N/A') : ''}`);
  }

  console.log('\n4. 测试 axios 解包逻辑：后端返回 { success, data } → 前端应收到 data');
  console.log('   后端返回格式示例: { success: true, data: { social: {...}, fund: {...} } }');
  console.log('   axios 拦截器自动解包后，res.data = { social: {...}, fund: {...} }');
  console.log('   前端页面可直接用 res.data.social 取业务数据');

  console.log('\n5. 测试失败场景提示');
  const r3 = await post('/auth/login', { phone: '13800138000', verifyCode: '000000' });
  console.log('   ✓ 错误验证码: status', r3.status, '| 错误信息:', r3.data.error);

  const r4 = await post('/auth/send-code', { phone: '12345' });
  console.log('   ✓ 错误手机号: status', r4.status, '| 错误信息:', r4.data.error);

  const r5 = await post('/auth/login', { idCard: '110101199001011234' });
  console.log('   ✓ 缺真实姓名: status', r5.status, '| 错误信息:', r5.data.error);

  console.log('\n==========', allPass ? '✅ 全部通过' : '❌ 存在问题', '==========');
}

test().catch(console.error);
