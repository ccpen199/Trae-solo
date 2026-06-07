const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:59064/api';

async function test() {
  console.log('=== 1. Login as hr1 ===');
  const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
    username: 'hr1',
    password: '123456'
  });
  const token = loginRes.data.token;
  console.log('Login response:', JSON.stringify(loginRes.data, null, 2));
  console.log('Token:', token);
  console.log('');

  const headers = { Authorization: `Bearer ${token}` };

  console.log('=== 2. Get Enterprise Profile ===');
  try {
    const res = await axios.get(`${BASE_URL}/enterprises/profile`, { headers });
    console.log('Status:', res.status);
    console.log('Response:', JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.log('Error:', e.response?.data || e.message);
  }
  console.log('');

  console.log('=== 3. Get Application Funnel ===');
  try {
    const res = await axios.get(`${BASE_URL}/dashboard/application-funnel`, { headers });
    console.log('Status:', res.status);
    console.log('Response:', JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.log('Error:', e.response?.data || e.message);
  }
  console.log('');

  console.log('=== 4. Get Applications for Enterprise ===');
  try {
    const res = await axios.get(`${BASE_URL}/applications/for-enterprise`, { headers, params: { pageSize: 10 } });
    console.log('Status:', res.status);
    console.log('Response keys:', Object.keys(res.data));
    console.log('Applications count:', res.data.applications?.length || res.data.length || 0);
    if (res.data.applications?.length > 0) {
      console.log('First app:', JSON.stringify(res.data.applications[0], null, 2));
    }
  } catch (e) {
    console.log('Error:', e.response?.data || e.message);
  }
}

test().catch(console.error);
