const http = require('http');

function post(path, data) {
  return new Promise((resolve, reject) => {
    const str = JSON.stringify(data);
    const req = http.request({
      hostname: '127.0.0.1',
      port: 58940,
      path: '/api/auth' + path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(str)
      }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
    });
    req.on('error', reject);
    req.write(str);
    req.end();
  });
}

async function test() {
  console.log('\n=== 1. admin 正确登录 ===');
  let r = await post('/login', { username: 'admin', password: 'Admin@123' });
  console.log('status:', r.status, 'success:', r.body.success, 'role:', r.body.data?.user?.role, 'redirect:', r.body.data?.redirect_path);

  console.log('\n=== 2. platform 正确登录 ===');
  r = await post('/login', { username: 'platform', password: 'Admin@123' });
  console.log('status:', r.status, 'success:', r.body.success, 'role:', r.body.data?.user?.role, 'redirect:', r.body.data?.redirect_path);

  console.log('\n=== 3. ops 正确登录 ===');
  r = await post('/login', { username: 'ops', password: 'Admin@123' });
  console.log('status:', r.status, 'success:', r.body.success, 'role:', r.body.data?.user?.role, 'redirect:', r.body.data?.redirect_path);

  console.log('\n=== 4. 错误密码 ===');
  r = await post('/login', { username: 'admin', password: 'wrong' });
  console.log('status:', r.status, 'code:', r.body.error?.code, 'msg:', r.body.error?.message, 'remaining:', r.body.error?.remaining_attempts);

  console.log('\n=== 5. lockeduser 已锁定 ===');
  r = await post('/login', { username: 'lockeduser', password: 'Admin@123' });
  console.log('status:', r.status, 'code:', r.body.error?.code, 'msg:', r.body.error?.message?.substring(0, 50));

  console.log('\n=== 6. 不存在账号 ===');
  r = await post('/login', { username: 'nonexistent', password: 'test' });
  console.log('status:', r.status, 'code:', r.body.error?.code, 'msg:', r.body.error?.message?.substring(0, 50));

  console.log('\n=== 7. 空密码 ===');
  r = await post('/login', { username: 'admin', password: '' });
  console.log('status:', r.status, 'code:', r.body.error?.code, 'msg:', r.body.error?.message);
}

test().catch(console.error);
