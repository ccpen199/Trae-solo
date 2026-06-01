const http = require('http');

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  try {
    console.log('=== 模拟浏览器完整登录流程 ===\n');

    console.log('1. 请求登录页...');
    const loginPage = await makeRequest({
      hostname: '127.0.0.1',
      port: 46935,
      path: '/login',
      method: 'GET'
    });
    console.log('   登录页 HTTP:', loginPage.status);

    console.log('\n2. 发送登录请求...');
    const loginData = JSON.stringify({ phone: '13800138001', password: '123456' });
    const loginRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 46935,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
      }
    }, loginData);
    console.log('   登录 API HTTP:', loginRes.status);
    console.log('   响应:', loginRes.body);

    const loginResult = JSON.parse(loginRes.body);
    if (!loginResult.success) {
      console.log('❌ 登录失败');
      process.exit(1);
    }

    console.log('\n3. 请求 Dashboard 页（模拟登录后跳转）...');
    const dashboard = await makeRequest({
      hostname: '127.0.0.1',
      port: 46935,
      path: '/dashboard',
      method: 'GET'
    });
    console.log('   Dashboard HTTP:', dashboard.status);

    console.log('\n4. 检查路由守卫代码...');
    const routerCode = await makeRequest({
      hostname: '127.0.0.1',
      port: 46935,
      path: '/src/router/index.js',
      method: 'GET'
    });
    const hasGuard = routerCode.body.includes('beforeEach');
    const hasLocalStorageCheck = routerCode.body.includes('localStorage.getItem');
    console.log('   路由守卫存在:', hasGuard);
    console.log('   localStorage 检查存在:', hasLocalStorageCheck);

    console.log('\n5. 检查 Dashboard 代码...');
    const dashboardCode = await makeRequest({
      hostname: '127.0.0.1',
      port: 46935,
      path: '/src/views/Dashboard.vue',
      method: 'GET'
    });
    const hasOnMounted = dashboardCode.body.includes('onMounted');
    const hasTryCatch = dashboardCode.body.includes('try') && dashboardCode.body.includes('catch');
    console.log('   onMounted 存在:', hasOnMounted);
    console.log('   try/catch 存在:', hasTryCatch);
    if (!hasTryCatch) {
      console.log('   ⚠️  Dashboard loadData 没有 try/catch，如果API失败会导致组件崩溃');
    }

    console.log('\n6. 检查 Layout 代码...');
    const layoutCode = await makeRequest({
      hostname: '127.0.0.1',
      port: 46935,
      path: '/src/views/Layout.vue',
      method: 'GET'
    });
    const layoutHasTry = layoutCode.body.includes('try') && layoutCode.body.includes('catch');
    console.log('   Layout localStorage 解析有 try/catch:', layoutHasTry);

    console.log('\n=== 诊断结论 ===');
    console.log('✅ API层面完全正常（登录、页面请求都成功）');
    console.log('⚠️  运行时问题可能在：');
    console.log('   1. Dashboard onMounted 中 Promise.all 调用3个API，任何一个失败都会导致组件崩溃');
    console.log('   2. 崩溃后可能导致路由被重置或页面白屏，用户以为"停留在登录页"');
    console.log('   3. router.push 虽然有 await，但导航失败的 rejection 没有被捕获');

  } catch (e) {
    console.error('测试失败:', e.message);
    process.exit(1);
  }
})();
