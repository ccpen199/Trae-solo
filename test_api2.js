const axios = require('axios');
const BASE = 'http://127.0.0.1:59023';

async function test() {
  try {
    const login = await axios.post(`${BASE}/api/auth/login`, { username: 'admin', password: 'admin123' });
    const token = login.data.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    
    console.log('=== Dashboard ===');
    const dash = await axios.get(`${BASE}/api/admin/dashboard`, { headers });
    console.log(JSON.stringify(dash.data, null, 2));
    
    console.log('\n=== Analytics ===');
    const analytics = await axios.get(`${BASE}/api/admin/analytics?period=daily`, { headers });
    console.log(JSON.stringify(analytics.data, null, 2));
    
    console.log('\n=== Sensitive Words ===');
    const words = await axios.get(`${BASE}/api/admin/sensitive-words`, { headers });
    console.log(`Count: ${words.data.data.length}, First: ${words.data.data[0]?.word}`);
    
    console.log('\n=== Review Pending ===');
    const pending = await axios.get(`${BASE}/api/review/pending`, { headers });
    console.log(JSON.stringify(pending.data, null, 2));
    
    console.log('\n=== Users ===');
    const users = await axios.get(`${BASE}/api/admin/users`, { headers });
    console.log(`Users: ${users.data.data.list.length}`);
    
    console.log('\n=== Frontend ===');
    const fe = await axios.get('http://127.0.0.1:49023/');
    console.log(`Frontend status: ${fe.status}, length: ${fe.data.length}`);
    
    console.log('\n=== ALL TESTS PASSED ===');
  } catch (e) {
    console.error('Error:', e.response?.data || e.message);
  }
}

test();
