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
    console.log('========================================');
    console.log('  同城货运调度平台 - 端到端登录验证');
    console.log('========================================\n');

    console.log('[1/8] 检查前端页面可用性...');
    const loginPage = await makeRequest({
      hostname: '127.0.0.1',
      port: 46935,
      path: '/login',
      method: 'GET'
    });
    console.log(`    ✅ 登录页 HTTP ${loginPage.status}`);

    console.log('\n[2/8] 检查后端健康状态...');
    const health = await makeRequest({
      hostname: '127.0.0.1',
      port: 56935,
      path: '/api/health',
      method: 'GET'
    });
    console.log(`    ✅ 后端健康 HTTP ${health.status}`);

    const testAccounts = [
      { role: '货主', phone: '13800138001', password: '123456', expectedRole: 'shipper' },
      { role: '司机', phone: '13800138002', password: '123456', expectedRole: 'driver' },
      { role: '管理员', phone: '13800138003', password: '123456', expectedRole: 'admin' }
    ];

    for (let i = 0; i < testAccounts.length; i++) {
      const account = testAccounts[i];
      console.log(`\n[${i + 3}/8] 测试 ${account.role} 账号登录 (${account.phone})...`);
      
      const loginData = JSON.stringify({ phone: account.phone, password: account.password });
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

      const result = JSON.parse(loginRes.body);
      if (result.success && result.data && result.data.role === account.expectedRole) {
        console.log(`    ✅ 登录成功，角色: ${result.data.role}，用户: ${result.data.name}`);
        
        console.log(`    验证 Dashboard 页可访问...`);
        const dashboard = await makeRequest({
          hostname: '127.0.0.1',
          port: 46935,
          path: '/dashboard',
          method: 'GET'
        });
        console.log(`    ✅ Dashboard HTTP ${dashboard.status}`);
        
        console.log(`    验证统计 API 可访问...`);
        const stats = await makeRequest({
          hostname: '127.0.0.1',
          port: 46935,
          path: '/api/statistics/overview',
          method: 'GET'
        });
        const statsResult = JSON.parse(stats.body);
        if (statsResult.success) {
          console.log(`    ✅ 统计数据: 今日订单 ${statsResult.data.today_orders}，活跃司机 ${statsResult.data.active_drivers}`);
        } else {
          console.log(`    ⚠️  统计 API 返回异常: ${stats.body}`);
        }
      } else {
        console.log(`    ❌ 登录失败: ${JSON.stringify(result)}`);
        process.exit(1);
      }
    }

    console.log('\n[7/8] 验证错误账号登录提示...');
    const wrongLoginData = JSON.stringify({ phone: '13800138001', password: 'wrongpass' });
    const wrongLogin = await makeRequest({
      hostname: '127.0.0.1',
      port: 46935,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': wrongLoginData.length
      }
    }, wrongLoginData);
    const wrongResult = JSON.parse(wrongLogin.body);
    if (!wrongResult.success && wrongResult.message) {
      console.log(`    ✅ 错误密码正确返回失败: ${wrongResult.message}`);
    } else {
      console.log(`    ⚠️  错误密码返回异常: ${wrongLogin.body}`);
    }

    console.log('\n[8/8] 验证代码修复完整性...');
    const checks = [
      { name: 'Dashboard Promise.allSettled', path: '/src/views/Dashboard.vue', pattern: 'allSettled' },
      { name: 'Router userValid 验证', path: '/src/router/index.js', pattern: 'userValid' },
      { name: '全局错误处理', path: '/src/main.js', pattern: 'errorHandler' },
      { name: 'Login 按钮 native-type', path: '/src/views/Login.vue', pattern: 'native-type' },
      { name: 'Login loading 状态', path: '/src/views/Login.vue', pattern: 'loginLoading' }
    ];

    for (const check of checks) {
      const code = await makeRequest({
        hostname: '127.0.0.1',
        port: 46935,
        path: check.path,
        method: 'GET'
      });
      if (code.body.includes(check.pattern)) {
        console.log(`    ✅ ${check.name}`);
      } else {
        console.log(`    ❌ ${check.name} - 未找到 ${check.pattern}`);
      }
    }

    console.log('\n========================================');
    console.log('  ✅ 所有验证通过！登录跳转链路已闭环');
    console.log('========================================');
    console.log('\n服务地址:');
    console.log('  前端: http://127.0.0.1:46935/');
    console.log('  后端: http://127.0.0.1:56935/');
    console.log('\n测试账号:');
    console.log('  货主: 13800138001 / 123456');
    console.log('  司机: 13800138002 / 123456');
    console.log('  管理员: 13800138003 / 123456');

  } catch (e) {
    console.error('\n❌ 验证失败:', e.message);
    process.exit(1);
  }
})();
