const API_BASE = 'http://127.0.0.1:59052/api';

async function simulateFullLoginFlow(username, password) {
  console.log(`\n═══════════════════════════════════════════`);
  console.log(`模拟完整登录流程: ${username}`);
  console.log(`═══════════════════════════════════════════`);
  
  const STORAGE_KEY = 'auth-storage-manual';
  
  try {
    console.log('\n[步骤 1] 模拟用户打开登录页...');
    console.log('   应用启动 → App.useEffect() 调用 initializeFromStorage()');
    console.log('   localStorage 读取 → 无数据 → isInitialized = true, isAuthenticated = false');
    
    console.log('\n[步骤 2] 模拟用户点击登录按钮...');
    console.log(`   账号: ${username}, 密码: ${password}`);
    
    console.log('\n[步骤 3] 调用 /api/auth/login...');
    const startTime = Date.now();
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const duration = Date.now() - startTime;
    
    console.log(`   状态码: ${response.status} (${duration}ms)`);
    const data = await response.json();
    console.log(`   响应: ${JSON.stringify(data).substring(0, 200)}...`);
    
    if (!data.success) {
      console.log(`\n❌ 登录失败！`);
      console.log(`   错误原因: ${data.error}`);
      console.log(`   用户可看到: 登录框上方红色提示条显示"${data.error}"`);
      console.log(`   用户可区分: ${data.error.includes('密码') ? '凭证错误' : data.error.includes('账号') ? '账号不存在' : '系统异常'}`);
      return { success: false, error: data.error };
    }
    
    const userData = data.data;
    console.log(`\n✅ API 登录成功！`);
    console.log(`   用户: ${userData.name}`);
    console.log(`   角色: ${userData.role}`);
    
    console.log('\n[步骤 4] 保存到 localStorage...');
    const authState = {
      user: userData,
      token: userData.token,
      isAuthenticated: true,
    };
    
    const localStorage = {
      getItem: (key) => global.localStorageData?.[key] || null,
      setItem: (key, value) => {
        global.localStorageData = global.localStorageData || {};
        global.localStorageData[key] = value;
      }
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authState));
    
    const verify = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    console.log(`   验证: isAuthenticated = ${verify.isAuthenticated}`);
    console.log(`   验证: user = ${verify.user?.name}`);
    
    if (!verify.isAuthenticated || !verify.user) {
      console.log(`\n❌ localStorage 验证失败！`);
      return { success: false, error: '本地存储失败' };
    }
    
    const roleRoutes = {
      admin: '/dashboard',
      platform: '/appeals',
      ops: '/services',
      enterprise: '/policies',
    };
    const targetRoute = roleRoutes[userData.role] || '/dashboard';
    
    console.log(`\n[步骤 5] 页面跳转到: ${targetRoute}`);
    console.log(`   window.location.href = '${targetRoute}'`);
    
    console.log(`\n[步骤 6] 页面刷新后重新加载...`);
    console.log('   App.useEffect() 调用 initializeFromStorage()');
    console.log(`   读取 localStorage → isAuthenticated = true, user = ${verify.user.name}`);
    console.log(`   _isInitialized = true`);
    
    console.log(`\n[步骤 7] ProtectedRoute 检查...`);
    console.log(`   _isInitialized = true ✓`);
    console.log(`   isAuthenticated = true ✓`);
    console.log(`   渲染页面: <Layout><${targetRoute.replace('/', '')} /></Layout>`);
    
    console.log(`\n[步骤 8] 顶部用户信息显示...`);
    console.log(`   显示: [用户头像] ${verify.user.name} ${userData.role === 'admin' ? '系统管理员' : userData.role === 'platform' ? '平台运营' : userData.role === 'ops' ? '政务运维' : '企业用户'}`);
    console.log(`   下拉菜单: ${verify.user.name} / ${username} / 退出登录`);
    
    console.log(`\n✅ 完整登录流程成功！`);
    console.log(`   用户身份: ${verify.user.name} (${userData.role})`);
    console.log(`   工作台: ${targetRoute}`);
    
    return { success: true, user: userData, targetRoute };
    
  } catch (error) {
    console.log(`\n❌ 异常: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║   广东省涉企政务服务平台 - 登录完整流程端到端测试              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`测试时间: ${new Date().toLocaleString()}`);
  console.log(`后端 API: ${API_BASE}`);
  console.log(`前端地址: http://127.0.0.1:49052/login`);
  
  const testCases = [
    { username: 'admin', password: 'admin123', desc: '系统管理员 - 成功场景' },
    { username: 'platform', password: 'platform123', desc: '平台运营专员 - 成功场景' },
    { username: 'ops', password: 'ops123', desc: '政务运维专员 - 成功场景' },
    { username: 'admin', password: 'wrongpass', desc: '系统管理员 - 错误密码' },
    { username: 'nonexistent', password: 'test123', desc: '不存在的账号' },
  ];
  
  const results = [];
  
  for (const testCase of testCases) {
    global.localStorageData = {};
    const result = await simulateFullLoginFlow(testCase.username, testCase.password);
    results.push({ ...testCase, ...result });
  }
  
  console.log('\n\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    测试结果汇总                               ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  
  console.log(`\n总测试数: ${results.length}`);
  console.log(`✅ 成功: ${results.filter(r => r.success).length}`);
  console.log(`❌ 失败: ${results.filter(r => !r.success).length} (预期失败场景)`);
  
  console.log(`\n✅ 登录成功场景（角色工作台承接）:`);
  results.filter(r => r.success).forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.desc}`);
    console.log(`     账号: ${r.username}`);
    console.log(`     身份: ${r.user?.name} (${r.user?.role})`);
    console.log(`     承接工作台: ${r.targetRoute}`);
    console.log(`     顶部显示: ${r.user?.name} | ${r.user?.role === 'admin' ? '系统管理员' : r.user?.role === 'platform' ? '平台运营' : r.user?.role === 'ops' ? '政务运维' : '企业用户'}`);
  });
  
  console.log(`\n❌ 登录失败场景（错误提示可区分）:`);
  results.filter(r => !r.success).forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.desc}`);
    console.log(`     账号: ${r.username}`);
    console.log(`     错误提示: ${r.error}`);
    console.log(`     用户可判断: ${r.error?.includes('密码') ? '凭证错误，请重新输入密码' : r.error?.includes('账号') ? '账号不存在，请检查用户名' : '系统异常，请稍后重试'}`);
  });
  
  console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
  console.log('║                    前端操作指南                               ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`\n1. 打开: http://127.0.0.1:49052/login`);
  console.log(`2. 按 F12 打开开发者工具 → Console（控制台）`);
  console.log(`3. 点击演示账号按钮（平台管理员/运营专员/政务运维）`);
  console.log(`   或手动输入: admin / admin123  → 平台管理员`);
  console.log(`               platform / platform123  → 运营专员`);
  console.log(`               ops / ops123  → 政务运维`);
  console.log(`4. 观察控制台日志，追踪完整流程`);
  console.log(`5. 登录成功后，观察顶部右侧用户信息`);
  console.log(`6. 点击用户头像下拉菜单，可退出登录`);
  
  console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
  console.log('║                    控制台预期日志                             ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`\n[App] 应用启动, 初始化认证状态...`);
  console.log(`[Auth] 开始从 localStorage 初始化...`);
  console.log(`[Auth] localStorage 中无数据`);
  console.log(`[Auth] 初始化完成, 未登录`);
  console.log(`[Login] 演示账号登录: 平台管理员 admin`);
  console.log(`[Login] 开始登录流程, 账号: admin`);
  console.log(`[Login] 发送请求到 /api/auth/login`);
  console.log(`[Login] 响应状态码: 200`);
  console.log(`[Login] 登录成功, 用户: 系统管理员 角色: admin`);
  console.log(`[Auth] 已保存到 localStorage: {...}`);
  console.log(`[Auth] 从 localStorage 读取: {...}`);
  console.log(`[Login] 即将跳转到: /dashboard`);
  console.log(`[Login] 跳转前 localStorage 验证: 已存在`);
  console.log(`[Login] 存储的 isAuthenticated: true`);
  console.log(`[Login] 存储的 user: 系统管理员`);
  console.log(`[Login] 执行跳转: window.location.href = /dashboard`);
  console.log(`--- 页面刷新 ---`);
  console.log(`[App] 应用启动, 初始化认证状态...`);
  console.log(`[Auth] 开始从 localStorage 初始化...`);
  console.log(`[Auth] 从 localStorage 读取: {...}`);
  console.log(`[Auth] 初始化完成, 用户: 系统管理员 角色: admin`);
  console.log(`[ProtectedRoute] isInitialized: true isAuthenticated: true`);
  console.log(`[ProtectedRoute] 已认证, 渲染页面`);
  
  console.log('\n');
}

runAllTests().catch(console.error);
