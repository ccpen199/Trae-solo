const http = require('http');
function post(path, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const req = http.request({
      hostname: '127.0.0.1', port: 58822, path, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', reject); req.write(body); req.end();
  });
}
async function test() {
  console.log('=== 1. 委托人登录 ===');
  const r1 = await post('/api/auth/client/login', { phone: '13800138001', password: '123456' });
  console.log('Status:', r1.status);
  try { const j = JSON.parse(r1.body); console.log('success:', j.success, 'token:', j.token ? 'YES' : 'NO', 'user:', j.user ? j.user.name : '-'); } catch { console.log('Body:', r1.body.substring(0, 200)); }

  console.log('\n=== 2. 管理员登录(admin) ===');
  const r2 = await post('/api/auth/admin/login', { admin_id: 'admin', secret_key: 'admin123' });
  console.log('Status:', r2.status);
  try { const j = JSON.parse(r2.body); console.log('success:', j.success, 'token:', j.token ? 'YES' : 'NO', 'admin:', j.admin ? j.admin.name : '-'); } catch { console.log('Body:', r2.body.substring(0, 200)); }

  console.log('\n=== 3. 管理员登录(platform) ===');
  const r3 = await post('/api/auth/admin/login', { admin_id: 'platform', secret_key: 'platform123' });
  console.log('Status:', r3.status);
  try { const j = JSON.parse(r3.body); console.log('success:', j.success, 'token:', j.token ? 'YES' : 'NO'); } catch { console.log('Body:', r3.body.substring(0, 200)); }

  console.log('\n=== 4. 错误密码 ===');
  const r4 = await post('/api/auth/client/login', { phone: '13800138001', password: 'wrong' });
  console.log('Status:', r4.status);
  try { const j = JSON.parse(r4.body); console.log('error:', j.error); } catch { console.log('Body:', r4.body.substring(0, 200)); }

  console.log('\n=== 5. 接单人登录 ===');
  const r5 = await post('/api/auth/courier/login', { phone: '13900139001', password: '123456' });
  console.log('Status:', r5.status);
  try { const j = JSON.parse(r5.body); console.log('success:', j.success, 'token:', j.token ? 'YES' : 'NO', 'courier:', j.courier ? j.courier.name : '-'); } catch { console.log('Body:', r5.body.substring(0, 200)); }

  console.log('\n=== 6. 前端代理测试 ===');
  const r6 = await new Promise((resolve, reject) => {
    const body = JSON.stringify({ admin_id: 'admin', secret_key: 'admin123' });
    const req = http.request({
      hostname: '127.0.0.1', port: 48822, path: '/api/auth/admin/login', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', reject); req.write(body); req.end();
  });
  console.log('Status:', r6.status);
  try { const j = JSON.parse(r6.body); console.log('success:', j.success, 'token:', j.token ? 'YES' : 'NO'); } catch { console.log('Body:', r6.body.substring(0, 300)); }
}
test().catch(e => console.error(e));
