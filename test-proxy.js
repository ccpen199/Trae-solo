const axios = require('axios');

async function testLogin() {
  try {
    const res = await axios.post('http://127.0.0.1:49099/api/auth/login', {
      email: 'hr@zhilian.com',
      password: '123456'
    });
    console.log('=== Via Vite Proxy ===');
    console.log('HTTP Status:', res.status);
    console.log('API Code:', res.data.code);
    console.log('Message:', res.data.message);
    console.log('Has token:', !!res.data.data?.token);
    console.log('User name:', res.data.data?.user?.name);
    console.log('User role:', res.data.data?.user?.role);
    console.log('Token (first 30):', res.data.data?.token?.substring(0, 30));
  } catch (err) {
    console.log('Error:', err.message);
    if (err.response) {
      console.log('Response status:', err.response.status);
      console.log('Response data:', JSON.stringify(err.response.data).substring(0, 200));
    }
  }
}

testLogin();
