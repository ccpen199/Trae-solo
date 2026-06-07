const http = require('http');

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

(async () => {
  try {
    const loginRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 59018,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { phone: 'admin', password: '123456' });
    
    const token = loginRes.token;
    console.log('✅ 登录成功');
    
    const stats = await makeRequest({
      hostname: '127.0.0.1',
      port: 59018,
      path: '/api/admin/stats',
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    
    console.log('\n=== 概览数据 ===');
    console.log(JSON.stringify(stats.overview, null, 2));
    
    console.log('\n=== 热门工种需求 ===');
    stats.skillStats.forEach(s => console.log('  ' + s.skill + ': ' + s.count + ' 个岗位'));
    
    console.log('\n=== 区域薪资水平 ===');
    stats.regionStats.forEach(r => console.log('  ' + r.location + ': ' + r.count + ' 岗, 均价 ¥' + Math.round(r.avg_salary) + '/天'));
    
    console.log('\n=== 全部字段 ===');
    Object.keys(stats).forEach(k => console.log('  ✓ ' + k + ': ' + (Array.isArray(stats[k]) ? stats[k].length + ' 条' : typeof stats[k])));
    
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
