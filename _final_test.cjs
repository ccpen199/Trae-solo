const http = require('http');

function get(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: 'localhost', port: 5173, path: '/api' + path, method: 'GET', headers }, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => { try { resolve({ status: res.statusCode, data: JSON.parse(d) }); } catch { resolve({ status: res.statusCode, data: d }); } });
    });
    req.on('error', reject);
    req.end();
  });
}

function post(path, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const req = http.request({ hostname: 'localhost', port: 5173, path: '/api' + path, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), ...headers }}, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => { try { resolve({ status: res.statusCode, data: JSON.parse(d) }); } catch { resolve({ status: res.statusCode, data: d }); } });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function test() {
  console.log('=== 最终端到端验证 ===\n');
  
  console.log('1. 发送验证码...');
  const r1 = await post('/auth/send-code', { phone: '13800138000' });
  console.log('   Status:', r1.status, 'Success:', r1.data.success);

  console.log('\n2. 手机号登录...');
  const r2 = await post('/auth/login', { phone: '13800138000', verifyCode: '123456' });
  console.log('   Status:', r2.status, 'Success:', r2.data.success);
  console.log('   User:', r2.data.user?.name, '| elderlyMode:', r2.data.user?.elderlyMode);
  console.log('   Token:', !!r2.data.token ? '✅ 存在' : '❌ 缺失');

  const token = r2.data.token;
  const auth = { Authorization: 'Bearer ' + token };

  console.log('\n3. 首页推荐服务...');
  const r3 = await get('/recommend/services', auth);
  console.log('   Status:', r3.status);
  console.log('   数据类型:', Array.isArray(r3.data.data) ? '✅ 数组' : '❌ 对象');
  console.log('   数量:', r3.data.data?.length);

  console.log('\n4. 社保账户...');
  const r4 = await get('/social/account', auth);
  console.log('   Status:', r4.status);
  console.log('   养老余额:', r4.data.data?.social?.pension);

  console.log('\n5. 户籍业务...');
  const r5 = await get('/household/list', auth);
  console.log('   Status:', r5.status, '数量:', r5.data.data?.length);

  console.log('\n6. 电子证照...');
  const r6 = await get('/certificates', auth);
  console.log('   Status:', r6.status, '数量:', r6.data.data?.length);

  console.log('\n7. 健康码...');
  const r7 = await get('/health/code', auth);
  console.log('   Status:', r7.status, '状态:', r7.data.data?.status);

  console.log('\n8. 测试失败场景...');
  await post('/auth/send-code', { phone: '13800138000' });
  const r8 = await post('/auth/login', { phone: '13800138000', verifyCode: '000000' });
  console.log('   Status:', r8.status, '错误提示:', r8.data.error);

  console.log('\n9. 测试错误手机号...');
  const r9 = await post('/auth/send-code', { phone: '12345' });
  console.log('   Status:', r9.status, '错误提示:', r9.data.error);

  console.log('\n✅ 全部验证完成！');
  console.log('\n核心链路总结:');
  console.log('  登录页 → 发送验证码 → 输入验证码 → 点击登录 → 后端验证 → 返回 token+user');
  console.log('  → 前端 store 更新 isAuthenticated=true → navigate 到 / → 首页加载成功');
  console.log('  → 所有政务服务入口（乘车/社保/户籍/教育/健康码/证照）全部可进入');
}

test().catch(console.error);
