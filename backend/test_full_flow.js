const axios = require('axios');

async function testFullFlow() {
  console.log('=== 模拟前端完整登录流程 ===\n');
  
  const client = axios.create({
    baseURL: 'http://127.0.0.1:56793/api',
    timeout: 5000,
  });

  client.interceptors.response.use(
    (response) => response.data,
    (error) => Promise.reject(error)
  );

  const testAccounts = ['admin', 'platform', 'ops', 'stationmaster', 'zhangsan'];
  
  for (const username of testAccounts) {
    console.log(`[${username}] 尝试登录...`);
    try {
      const data = await client.post('/auth/login', { username, password: '123456' });
      
      if (!data.token) {
        console.log(`  ❌ 失败: 没有 token`);
        continue;
      }
      if (!data.user) {
        console.log(`  ❌ 失败: 没有 user 数据`);
        continue;
      }
      
      const role = data.user.role;
      console.log(`  ✅ 登录成功: role=${role}, username=${data.user.username}`);
      console.log(`  token 前30位: ${data.token.substring(0, 30)}...`);
      
      console.log(`  🔐 保存到 localStorage (模拟)`);
      
      const redirectMap = {
        platform: '/admin/stats',
        ops: '/admin/stats',
        admin: '/admin/parcels',
        station_master: '/dashboard',
        user: '/dashboard',
      };
      
      const redirect = redirectMap[role] || '/dashboard';
      console.log(`  📍 跳转至: ${redirect}`);
      
      console.log(`  🧪 验证 /api/auth/me 接口...`);
      client.defaults.headers.Authorization = `Bearer ${data.token}`;
      const meData = await client.get('/auth/me');
      console.log(`  ✅ /me 验证通过: ${meData.username}, role=${meData.role}`);
      
    } catch (error) {
      if (error.response) {
        console.log(`  ❌ 失败: HTTP ${error.response.status}, ${JSON.stringify(error.response.data)}`);
      } else {
        console.log(`  ❌ 失败: ${error.message}`);
      }
    }
    console.log('');
  }
}

testFullFlow();
