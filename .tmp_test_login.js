const http = require('http');
const BASE = 'http://localhost:3051/api/auth/login';
function login(phone, password = '123456') {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ phone, password });
    const url = new URL(BASE);
    const req = http.request({
      hostname: url.hostname, port: url.port, path: url.pathname,
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
    }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}
(async () => {
  const tests = [
    ['admin', '', '超级管理员'], ['platform', '', '平台运营'], ['ops', '', '运维'],
    ['13800000001', '', '宠主张小明'], ['13900000001', '', '医生王建国'], ['13700000001', '', '医院爱宠'], ['13600000001', '', '商家优选'],
    ['13900000009', '', '待审医生(应失败)'], ['13500000001', '', '禁用账号(应失败)'], ['13500000002', '', '待审医院(应失败)'],
    ['no_such_user', '', '不存在账号(应失败)'], ['admin', 'wrongpass', '错误密码(应失败)'],
  ];
  const ROLE_HOME = { owner: '/', admin: '/admin/dashboard', platform: '/platform/dashboard', ops: '/ops/dashboard', doctor: '/doctor/dashboard', hospital: '/hospital/dashboard', merchant: '/merchant/dashboard' };
  for (const [p, pw, name] of tests) {
    const d = await login(p, pw || '123456');
    if (d.success) {
      const u = d.data.user;
      console.log(`${name.padEnd(18)} ✅ SUCCESS role=${u.role.padEnd(8)} status=${u.status} lic=${u.licenseVerified}  跳转→${ROLE_HOME[u.role] || '/'}`);
    } else {
      console.log(`${name.padEnd(18)} ❌ FAIL code=${(d.errorCode||'').padEnd(18)} msg=${d.error}`);
    }
  }
})();
