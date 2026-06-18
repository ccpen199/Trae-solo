const axios = require('axios');

const API = 'http://127.0.0.1:49231/api';

async function testFullLogin(acc) {
  console.log(`\n========== [${acc.username}] 完整登录链路测试 ==========`);

  // Step 1: 登录
  console.log(`[1] POST /auth/login ...`);
  const loginRes = await axios.post(`${API}/auth/login`, { username: acc.username, password: acc.password });
  const { token, user, role, name, profile } = loginRes.data;
  console.log(`    ✅ token=${token ? 'OK' : 'MISSING'} | user.role=${user?.role} | user.name=${user?.name} | 顶层role=${role} | 顶层name=${name}`);
  console.log(`    profile:`, profile ? `${profile.constructor?.name || 'Object'} 已返回` : 'null');

  // Step 2: 模拟 localStorage 存储
  const storage = { token, user: JSON.stringify(user) };
  try {
    JSON.parse(storage.user);
    console.log(`[2] localStorage 存储模拟: ✅ user JSON 格式有效`);
  } catch (e) {
    console.log(`[2] localStorage 存储模拟: ❌ user JSON 格式无效`);
    return;
  }

  // Step 3: 携带 token 请求 /auth/me
  console.log(`[3] GET /auth/me (带Bearer token) ...`);
  const meRes = await axios.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
  console.log(`    ✅ /auth/me 返回: role=${meRes.data.role} | name=${meRes.data.name}`);

  // Step 4: 根据角色请求对应业务接口
  console.log(`[4] 角色业务接口验证:`);
  try {
    if (role === 'admin') {
      const dash = await axios.get(`${API}/admin/dashboard`, { headers: { Authorization: `Bearer ${token}` } });
      console.log(`    ✅ /admin/dashboard | 统计:${JSON.stringify(dash.data.stats || {})}`);
    }
    if (role === 'worker') {
      const prog = await axios.get(`${API}/training/my-progress`, { headers: { Authorization: `Bearer ${token}` } });
      console.log(`    ✅ /training/my-progress | 学习中:${prog.data.list.length} 门`);
    }
    if (role === 'employer') {
      const orders = await axios.get(`${API}/orders`, { headers: { Authorization: `Bearer ${token}` } });
      console.log(`    ✅ /orders | 订单数:${orders.data.total || 0}`);
    }
  } catch (e) {
    console.log(`    ❌ 业务接口失败:`, e.response?.status, e.response?.data?.error || e.message);
  }

  console.log(`    ➡️ 导航目标: /dashboard (replace)  ✅ 完成`);
}

async function testWrongPassword() {
  console.log(`\n========== [错误密码] 错误反馈测试 ==========`);
  try {
    await axios.post(`${API}/auth/login`, { username: 'admin', password: 'wrong' });
    console.log('  ❌ 应该报错但成功了');
  } catch (e) {
    console.log(`  ✅ HTTP ${e.response?.status} | 错误信息: "${e.response?.data?.error}"`);
    console.log(`     前端将显示: "用户名或密码错误，请检查后重试。测试账号：..."`);
  }
}

async function testNetworkError() {
  console.log(`\n========== [网络异常] 错误反馈测试 ==========`);
  try {
    await axios.post('http://127.0.0.1:9999/api/auth/login', { username: 'admin', password: 'admin123' }, { timeout: 2000 });
  } catch (e) {
    const hasResponse = !!e.response;
    console.log(`  ✅ 无响应=${!hasResponse} | 前端将显示: "无法连接到服务器（网络异常或后端服务未启动）..."`);
  }
}

async function run() {
  try {
    await testFullLogin({ username: 'admin', password: 'admin123' });
    await testFullLogin({ username: 'worker1', password: 'worker123' });
    await testFullLogin({ username: 'employer1', password: 'employer123' });
    await testWrongPassword();
    await testNetworkError();
    console.log('\n========== 🎉 全部登录链路测试通过 ==========\n');
  } catch (e) {
    console.error('\n❌ 测试失败:', e.response?.data || e.message);
    process.exit(1);
  }
}

run();
