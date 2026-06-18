const axios = require('axios');

async function test() {
  console.log('=== 1. 直接请求后端 (59231) ===');
  try {
    const r1 = await axios.post('http://127.0.0.1:59231/api/auth/login', { username: 'admin', password: 'admin123' });
    console.log('  ✅ 成功 | token_len:', r1.data.token?.length, '| user.role:', r1.data.user?.role);
  } catch (e) {
    console.log('  ❌ 失败:', e.message);
  }

  console.log('\n=== 2. 通过前端Vite代理 (49231) ===');
  try {
    const r2 = await axios.post('http://127.0.0.1:49231/api/auth/login', { username: 'admin', password: 'admin123' });
    console.log('  ✅ 成功 | token_len:', r2.data.token?.length, '| user.role:', r2.data.user?.role);
  } catch (e) {
    console.log('  ❌ 失败:', e.response?.status, e.response?.data || e.message);
  }

  console.log('\n=== 3. 错误密码通过前端代理 ===');
  try {
    await axios.post('http://127.0.0.1:49231/api/auth/login', { username: 'admin', password: 'wrong' });
  } catch (e) {
    console.log('  ✅ 正确返回401 | status:', e.response?.status, '| msg:', e.response?.data?.error);
  }
}

test();
