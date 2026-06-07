import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:49055';

async function main() {
  const login = await axios.post(`${BASE_URL}/api/auth/login`, {
    username: 'admin',
    password: 'admin123'
  });
  const token = login.data.data.token;
  const h = { Authorization: `Bearer ${token}` };

  const dash = await axios.get(`${BASE_URL}/api/dashboard/admin`, { headers: h });
  const d = dash.data.data;

  console.log('=== Dashboard API 返回结构 ===');
  console.log('\n根字段:', Object.keys(d));
  console.log('\n--- sla ---');
  console.log(JSON.stringify(d.sla, null, 2));
  console.log('\n--- knights ---');
  console.log(JSON.stringify(d.knights, null, 2));
  console.log('\n--- capacity_gaps ---');
  console.log(JSON.stringify(d.capacity_gaps, null, 2));
  console.log('\n--- 其他可能的字段 ---');
  Object.keys(d).forEach(k => {
    if (!['sla', 'knights', 'capacity_gaps'].includes(k)) {
      console.log(`${k}:`, JSON.stringify(d[k], null, 2));
    }
  });

  console.log('\n=== Dashboard 期望的字段 ===');
  console.log('需要: stats.knights.online, stats.knights.total, stats.knights.avg_credit');
  console.log('需要: stats.today_waybills.total, stats.today_waybills.pending, stats.today_waybills.completed');
}

main().catch(console.error);
