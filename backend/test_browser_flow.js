const http = require('http');

function makeRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test() {
  console.log('=== 模拟浏览器端完整登录流程 ===\n');
  
  const accounts = [
    { username: 'admin', role: 'admin', path: '/admin/parcels' },
    { username: 'platform', role: 'platform', path: '/admin/stats' },
    { username: 'ops', role: 'ops', path: '/admin/stats' },
    { username: 'stationmaster', role: 'station_master', path: '/community/stations' },
    { username: 'zhangsan', role: 'user', path: '/dashboard' },
  ];

  for (const acc of accounts) {
    console.log(`🔑 ${acc.username} (${acc.role})`);
    
    try {
      const loginRes = await makeRequest({
        hostname: '127.0.0.1',
        port: 56793,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Origin': 'http://127.0.0.1:46793' },
        timeout: 15000,
      }, { username: acc.username, password: '123456' });

      if (loginRes.status !== 200) {
        console.log(`  ❌ HTTP ${loginRes.status}: ${JSON.stringify(loginRes.data)}`);
        continue;
      }

      const { token, user } = loginRes.data;
      if (!token || !user || user.role !== acc.role) {
        console.log(`  ❌ 数据异常: token=${!!token} role=${user?.role}`);
        continue;
      }

      console.log(`  ✅ 登录成功: ${user.username} role=${user.role}`);
      console.log(`  📍 跳转: ${acc.path}`);

      const meRes = await makeRequest({
        hostname: '127.0.0.1',
        port: 56793,
        path: '/api/auth/me',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Origin': 'http://127.0.0.1:46793' },
        timeout: 10000,
      });

      if (meRes.status === 200 && meRes.data.username === acc.username) {
        console.log(`  ✅ /me 验证通过`);
      } else {
        console.log(`  ❌ /me 验证失败: HTTP ${meRes.status}`);
      }

      if (['admin', 'platform', 'ops'].includes(acc.role)) {
        const statsRes = await makeRequest({
          hostname: '127.0.0.1',
          port: 56793,
          path: '/api/admin/stats',
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 10000,
        });
        console.log(`  ${statsRes.status === 200 ? '✅' : '❌'} 管理后台: HTTP ${statsRes.status}`);
      }

      if (acc.role === 'user') {
        const parcelsRes = await makeRequest({
          hostname: '127.0.0.1',
          port: 56793,
          path: '/api/parcels',
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 10000,
        });
        console.log(`  ${parcelsRes.status === 200 ? '✅' : '❌'} 包裹列表: HTTP ${parcelsRes.status}`);

        const trackRes = await makeRequest({
          hostname: '127.0.0.1',
          port: 56793,
          path: '/api/parcels/track',
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          timeout: 10000,
        }, { trackingNos: ['SF1234567890001'] });
        console.log(`  ${trackRes.status === 200 ? '✅' : '❌'} 包裹查询: HTTP ${trackRes.status}`);

        const priceRes = await makeRequest({
          hostname: '127.0.0.1',
          port: 56793,
          path: '/api/shipping/calculate',
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          timeout: 10000,
        }, { weight: 5, volume: 0.1, timeline: 'standard', insured_value: 1000 });
        console.log(`  ${priceRes.status === 200 ? '✅' : '❌'} 报价引擎: HTTP ${priceRes.status}`);
      }

      if (acc.role === 'station_master') {
        const stationsRes = await makeRequest({
          hostname: '127.0.0.1',
          port: 56793,
          path: '/api/community/stations',
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 10000,
        });
        console.log(`  ${stationsRes.status === 200 ? '✅' : '❌'} 驿站管理: HTTP ${stationsRes.status}`);
      }

      console.log('');

    } catch (err) {
      console.log(`  ❌ 错误: ${err.message}\n`);
    }
  }

  console.log('=== 验证完成 ===');
}

test();
