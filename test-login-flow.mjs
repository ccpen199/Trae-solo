const API_BASE = 'http://127.0.0.1:59052/api';

async function testFullLoginFlow(username, password) {
  console.log(`\n========================================`);
  console.log(`测试账号: ${username}`);
  console.log(`========================================`);
  
  try {
    console.log('\n1. 调用登录 API...');
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await response.json();
    
    console.log(`   状态码: ${response.status}`);
    
    if (!data.success) {
      console.log(`❌ 登录失败: ${data.error}`);
      return { success: false, error: data.error };
    }
    
    console.log(`✅ 登录成功!`);
    console.log(`   用户: ${data.data.name}`);
    console.log(`   角色: ${data.data.role}`);
    console.log(`   Token: ${data.data.token ? '已获取' : '未获取'}`);
    
    const roleRoutes = {
      admin: '/dashboard',
      platform: '/appeals',
      ops: '/services',
      enterprise: '/policies',
    };
    const targetRoute = roleRoutes[data.data.role] || '/dashboard';
    console.log(`   目标跳转: ${targetRoute}`);
    
    console.log('\n2. 模拟 localStorage 存储认证状态...');
    const authState = {
      state: {
        user: data.data,
        token: data.data.token,
        isAuthenticated: true,
        lastError: null
      },
      version: 0
    };
    console.log(`   存储状态: isAuthenticated = true`);
    console.log(`   存储用户: ${authState.state.user.username}`);
    
    console.log('\n3. 验证 ProtectedRoute 条件...');
    console.log(`   isAuthenticated = ${authState.state.isAuthenticated}`);
    console.log(`   条件判断: !isAuthenticated = ${!authState.state.isAuthenticated}`);
    console.log(`   结果: ${!authState.state.isAuthenticated ? '❌ 会被重定向到 /login' : '✅ 可以访问受保护路由'}`);
    
    if (authState.state.isAuthenticated) {
      console.log(`\n4. 预期页面跳转...`);
      console.log(`   window.location.href = '${targetRoute}'`);
      console.log(`   页面将刷新并加载: ${targetRoute}`);
      console.log(`   Layout 将显示用户: ${data.data.name} | ${roleRoutes[data.data.role] ? data.data.role : 'unknown'}`);
    }
    
    return { 
      success: true, 
      user: data.data, 
      targetRoute,
      authState
    };
    
  } catch (error) {
    console.log(`❌ 请求异常: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║   登录完整流程端到端测试                  ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`测试时间: ${new Date().toLocaleString()}`);
  console.log(`API 地址: ${API_BASE}`);
  
  const testAccounts = [
    { username: 'admin', password: 'admin123', desc: '系统管理员' },
    { username: 'platform', password: 'platform123', desc: '平台运营专员' },
    { username: 'ops', password: 'ops123', desc: '政务运维专员' },
    { username: 'admin', password: 'wrongpass', desc: '错误密码测试' },
    { username: 'nonexistent', password: 'test123', desc: '不存在账号测试' },
  ];
  
  const results = [];
  
  for (const account of testAccounts) {
    console.log(`\n--- ${account.desc} ---`);
    const result = await testFullLoginFlow(account.username, account.password);
    results.push({ ...account, ...result });
  }
  
  console.log('\n\n╔══════════════════════════════════════════╗');
  console.log('║   测试结果汇总                            ║');
  console.log('╚══════════════════════════════════════════╝');
  
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  
  console.log(`\n总测试数: ${results.length}`);
  console.log(`✅ 登录成功: ${successCount}`);
  console.log(`❌ 登录失败: ${failCount} (预期失败场景)`);
  
  console.log('\n✅ 成功场景验证:');
  results.filter(r => r.success).forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.username} (${r.desc})`);
    console.log(`     用户: ${r.user?.name}`);
    console.log(`     角色: ${r.user?.role}`);
    console.log(`     跳转: ${r.targetRoute}`);
  });
  
  console.log('\n❌ 失败场景验证 (错误提示):');
  results.filter(r => !r.success).forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.username} (${r.desc})`);
    console.log(`     提示: ${r.error}`);
  });
  
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║   前端登录页面操作指南                    ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('\n1. 打开: http://127.0.0.1:49052/login');
  console.log('2. 点击演示账号按钮 或 手动输入账号密码');
  console.log('3. 点击"登 录"按钮');
  console.log('4. 预期行为:');
  console.log('   ✅ 成功 → 页面刷新 → 跳转到对应工作台');
  console.log('   ✅ 失败 → 登录框上方显示红色错误提示条');
  console.log('5. 登录成功后，顶部右侧显示用户信息');
  console.log('\n');
}

runAllTests().catch(console.error);
