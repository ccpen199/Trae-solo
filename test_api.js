const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:59212/api';
let token = '';

async function test() {
  try {
    console.log('=== 1. Login ===');
    const loginRes = await axios.post(`${BASE_URL}/auth/admin-login`, {
      username: 'admin',
      password: 'admin123'
    });
    token = loginRes.data.data.token;
    console.log('Token obtained');

    const headers = { Authorization: `Bearer ${token}` };

    console.log('\n=== 2. Dashboard ===');
    const dashRes = await axios.get(`${BASE_URL}/admin/dashboard`, { headers });
    console.log(JSON.stringify(dashRes.data, null, 2).substring(0, 3000));

    console.log('\n=== 3. Orders ===');
    const ordersRes = await axios.get(`${BASE_URL}/admin/orders?page=1&pageSize=10`, { headers });
    console.log(JSON.stringify(ordersRes.data, null, 2).substring(0, 2000));

    console.log('\n=== 4. Suppliers ===');
    const suppRes = await axios.get(`${BASE_URL}/admin/suppliers`, { headers });
    console.log(JSON.stringify(suppRes.data, null, 2).substring(0, 2000));

    console.log('\n=== 5. Card Pool Stats ===');
    const cardRes = await axios.get(`${BASE_URL}/admin/card-pool/stats`, { headers });
    console.log(JSON.stringify(cardRes.data, null, 2));

    console.log('\n=== 6. Risk Logs ===');
    const riskRes = await axios.get(`${BASE_URL}/admin/risk/logs?limit=10`, { headers });
    console.log(JSON.stringify(riskRes.data, null, 2).substring(0, 2000));

  } catch (e) {
    console.error('Error:', e.response?.data || e.message);
  }
}

test();
