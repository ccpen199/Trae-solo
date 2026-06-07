const http = require('http');

const tests = [
  { name: '登录API-admin', url: '/api/auth/login', method: 'POST', data: {username:'admin', password:'admin123'} },
  { name: '登录API-user', url: '/api/auth/login', method: 'POST', data: {username:'user', password:'user123'} },
  { name: '登录API-host', url: '/api/auth/login', method: 'POST', data: {username:'host', password:'host123'} },
  { name: '登录API-designer', url: '/api/auth/login', method: 'POST', data: {username:'designer', password:'designer123'} },
  { name: '登录API-agent', url: '/api/auth/login', method: 'POST', data: {username:'agent', password:'agent123'} },
  { name: '登录API-expert', url: '/api/auth/login', method: 'POST', data: {username:'expert', password:'expert123'} },
  { name: '登录失败测试', url: '/api/auth/login', method: 'POST', data: {username:'wrong', password:'wrong'}, expectFail: true },
  { name: '搜索API-精装', url: '/api/search?q=' + encodeURIComponent('精装') },
  { name: '搜索API-日式', url: '/api/search?q=' + encodeURIComponent('日式') },
  { name: '搜索API-工业风', url: '/api/search?q=' + encodeURIComponent('工业风') },
  { name: '装修案例API', url: '/api/renovation/cases?pageSize=6' },
  { name: '装修案例API-日式筛选', url: '/api/renovation/cases?style=' + encodeURIComponent('日式') },
  { name: '装修公司API', url: '/api/renovation/companies?pageSize=3' },
  { name: '房源API', url: '/api/properties?pageSize=3' },
  { name: '直播API', url: '/api/lives?pageSize=3' },
];

let passed = 0, failed = 0;

async function runTests() {
  console.log('🧪 开始API测试...\n');
  for (const test of tests) {
    try {
      const postData = test.data ? JSON.stringify(test.data) : null;
      const options = {
        hostname: '127.0.0.1',
        port: 59058,
        path: test.url,
        method: test.method || 'GET',
        headers: postData ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) } : {}
      };
      const result = await new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve({ status: res.statusCode, data }));
        });
        req.on('error', reject);
        if (postData) req.write(postData);
        req.end();
      });
      const json = JSON.parse(result.data);
      const isSuccess = test.expectFail ? !json.success : json.success;
      if (isSuccess) {
        console.log('✅', test.name);
        passed++;
        if (test.name.includes('登录') && json.success && !test.expectFail) {
          console.log('   角色:', json.data?.user?.role, '| 昵称:', json.data?.user?.nickname);
        }
        if (test.name.startsWith('搜索')) {
          console.log('   结果数:', json.data?.count, '| 房源:', json.data?.breakdown?.properties, '| 直播:', json.data?.breakdown?.lives, '| 案例:', json.data?.breakdown?.cases);
        }
        if (test.name.startsWith('装修案例API')) {
          console.log('   案例数:', json.data?.count, '| 首图:', json.data?.list?.[0]?.images?.[0]?.substring(0, 50) + '...');
        }
      } else {
        console.log('❌', test.name, '-', result.status, '-', json.error || 'success=false');
        failed++;
      }
    } catch (e) {
      console.log('❌', test.name, '- 错误:', e.message);
      failed++;
    }
  }
  console.log('\n' + '='.repeat(40));
  console.log(`总计: ${passed} 通过, ${failed} 失败`);
  console.log('='.repeat(40));
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
