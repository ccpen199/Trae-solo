const API_BASE = 'http://127.0.0.1:59052/api';

async function testLogin(username, password, description) {
  console.log(`\n=== 测试: ${description} ===`);
  console.log(`账号: ${username}, 密码: ${password}`);
  
  try {
    const startTime = Date.now();
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const duration = Date.now() - startTime;
    
    const data = await response.json();
    console.log(`状态码: ${response.status}`);
    console.log(`响应时间: ${duration}ms`);
    console.log(`响应数据:`, JSON.stringify(data, null, 2));
    
    if (data.success && data.data) {
      console.log(`✅ 登录成功!`);
      console.log(`   用户: ${data.data.name} (${data.data.username})`);
      console.log(`   角色: ${data.data.role}`);
      console.log(`   Token: ${data.data.token ? '已获取' : '未获取'}`);
      
      const expectedRoutes = {
        admin: '/dashboard',
        platform: '/appeals',
        ops: '/services',
        enterprise: '/policies',
      };
      const expectedRoute = expectedRoutes[data.data.role] || '/dashboard';
      console.log(`   预期跳转: ${expectedRoute}`);
      
      return { success: true, user: data.data, expectedRoute };
    } else {
      console.log(`❌ 登录失败!`);
      console.log(`   错误信息: ${data.error}`);
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.log(`❌ 请求异常!`);
    console.log(`   错误: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  console.log('========================================');
  console.log('  广东省涉企政务服务平台 - 登录功能测试');
  console.log('========================================');
  console.log(`测试时间: ${new Date().toLocaleString()}`);
  console.log(`API 地址: ${API_BASE}`);
  
  const results = [];
  
  results.push(await testLogin('admin', 'admin123', 'admin 账号 - 正确密码'));
  results.push(await testLogin('platform', 'platform123', 'platform 账号 - 正确密码'));
  results.push(await testLogin('ops', 'ops123', 'ops 账号 - 正确密码'));
  results.push(await testLogin('admin', 'wrongpassword', 'admin 账号 - 错误密码'));
  results.push(await testLogin('nonexistent', 'test123', '不存在的账号'));
  results.push(await testLogin('huawei_user', 'huawei123', '企业用户 - 正确密码'));
  
  console.log('\n========================================');
  console.log('  测试结果汇总');
  console.log('========================================');
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`总测试数: ${results.length}`);
  console.log(`✅ 通过: ${passed}`);
  console.log(`❌ 失败: ${failed}`);
  
  const successTests = results.filter(r => r.success);
  if (successTests.length > 0) {
    console.log('\n✅ 登录成功场景验证:');
    successTests.forEach((r, i) => {
      if (r.user) {
        console.log(`  ${i + 1}. ${r.user.name} (${r.user.role}) → 跳转 ${r.expectedRoute}`);
      }
    });
  }
  
  const failTests = results.filter(r => !r.success);
  if (failTests.length > 0) {
    console.log('\n❌ 登录失败场景验证 (错误提示):');
    failTests.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.error}`);
    });
  }
  
  console.log('\n========================================');
  if (failed === 0) {
    console.log('🎉 所有测试通过! 登录功能正常!');
  } else {
    console.log(`⚠️  有 ${failed} 个测试失败, 请检查!`);
  }
  console.log('========================================\n');
}

runAllTests().catch(console.error);
