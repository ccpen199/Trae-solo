import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:59055';

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
  
  Object.keys(d).forEach(k => {
    console.log(`\n--- ${k} ---`);
    console.log(JSON.stringify(d[k], null, 2));
  });

  console.log('\n=== 检查缺失的字段 ===');
  const required = [
    'stats.knights.online',
    'stats.knights.total', 
    'stats.knights.avg_credit',
    'stats.today_waybills.total',
    'stats.today_waybills.pending',
    'stats.today_waybills.completed',
  ];
  
  required.forEach(r => {
    const parts = r.split('.');
    let val = d;
    for (const p of parts.slice(1)) {
      val = val?.[p];
    }
    console.log(`${r}: ${val === undefined ? '❌ 缺失' : '✅ ' + val}`);
  });
}

main().catch(console.error);
