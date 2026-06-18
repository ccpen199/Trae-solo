const axios = require('axios');

const API = 'http://127.0.0.1:59231/api';

async function test() {
  const accounts = [
    { username: 'admin', password: 'admin123' },
    { username: 'worker1', password: 'worker123' },
    { username: 'employer1', password: 'employer123' },
    { username: 'admin', password: 'wrongpass' },
  ];

  for (const acc of accounts) {
    try {
      const res = await axios.post(`${API}/auth/login`, acc);
      console.log(`[${acc.username}] ✅ 成功 | role=${res.data.role} | name=${res.data.name} | token_len=${res.data.token?.length || 0}`);
    } catch (e) {
      console.log(`[${acc.username}] ❌ 失败 | HTTP=${e.response?.status} | msg=${e.response?.data?.error || e.message}`);
    }
  }
}

test();
