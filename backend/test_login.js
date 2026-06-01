const axios = require('axios');

async function testLogin(username) {
  try {
    console.log(`\n=== 测试前端模拟登录: ${username} ===`);
    const response = await axios.post('http://127.0.0.1:56793/api/auth/login', 
      { username, password: '123456' },
      { timeout: 5000 }
    );
    console.log('Response data keys:', Object.keys(response.data));
    console.log('Has token:', !!response.data.token);
    console.log('Has user:', !!response.data.user);
    if (response.data.user) {
      console.log('User role:', response.data.user.role);
      console.log('User username:', response.data.user.username);
    }
    return response.data;
  } catch (error) {
    console.log('Error:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    }
    return null;
  }
}

(async () => {
  for (const u of ['admin', 'platform', 'ops', 'stationmaster', 'zhangsan']) {
    await testLogin(u);
  }
})();
