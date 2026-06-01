const http = require('http');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch { resolve(body); }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function main() {
  console.log('=== AI招投标标书助手 - API测试 ===\n');

  console.log('1. 健康检查:');
  const health = await request({ hostname: '127.0.0.1', port: 53360, path: '/api/health', method: 'GET' });
  console.log('  ', health);

  console.log('\n2. 用户登录:');
  const login = await request({
    hostname: '127.0.0.1', port: 53360, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { username: 'user', password: '123456' });
  console.log('   用户名:', login.user.real_name);
  console.log('   角色:', login.user.role_description);
  const token = login.token;

  console.log('\n3. 创建标书:');
  const bid = await request({
    hostname: '127.0.0.1', port: 53360, path: '/api/bids', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
  }, { project_name: '智慧城市建设项目', purchaser: '市政府', budget_amount: 5000000 });
  console.log('   标书ID:', bid.id);
  console.log('   标书编号:', bid.bid_no);
  const bidId = bid.id;

  console.log('\n4. 获取标书列表:');
  const bids = await request({
    hostname: '127.0.0.1', port: 53360, path: '/api/bids?pageSize=3', method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('   总数:', bids.total);
  bids.list.forEach(b => console.log(`   - ${b.project_name} (${b.status})`));

  console.log('\n5. 获取资质列表:');
  const quals = await request({
    hostname: '127.0.0.1', port: 53360, path: '/api/qualifications', method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('   总数:', quals.total);
  quals.list.forEach(q => console.log(`   - ${q.name} (${q.status})`));

  console.log('\n6. 业务台账统计:');
  const stats = await request({
    hostname: '127.0.0.1', port: 53360, path: '/api/ledger/stats/summary', method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('   总操作数:', stats.total);
  console.log('   成功:', stats.success);
  console.log('   失败:', stats.failed);

  console.log('\n7. 模拟PDF解析失败测试:');
  const parseFail = await request({
    hostname: '127.0.0.1', port: 53360, path: `/api/bids/${bidId}/parse`, method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
  }, { simulate_error: 'pdf_parse_failure' });
  console.log('   结果:', parseFail.error || '成功');

  console.log('\n=== 测试完成 ===');
  console.log('\n前端地址: http://127.0.0.1:43360');
  console.log('后端地址: http://127.0.0.1:53360');
}

main().catch(console.error);
