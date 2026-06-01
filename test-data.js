const http = require('http');

const BACKEND_PORT = 58858;

function post(path, data) {
  return new Promise((resolve, reject) => {
    const jsonData = JSON.stringify(data);
    const options = {
      hostname: '127.0.0.1',
      port: BACKEND_PORT,
      path: `/api${path}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(jsonData)
      }
    };
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
    req.write(jsonData);
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${BACKEND_PORT}/api${path}`, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    }).on('error', reject);
  });
}

async function main() {
  console.log('=== 插入抄表数据 ===');
  const readings = [
    { meter_id: 1, reading_date: '2024-01-01', reading_value: 1000 },
    { meter_id: 1, reading_date: '2024-01-31', reading_value: 1500 },
    { meter_id: 3, reading_date: '2024-01-01', reading_value: 100 },
    { meter_id: 3, reading_date: '2024-01-31', reading_value: 200 },
    { meter_id: 5, reading_date: '2024-01-01', reading_value: 50 },
    { meter_id: 5, reading_date: '2024-01-31', reading_value: 150 },
    { meter_id: 2, reading_date: '2024-01-01', reading_value: 1000 },
    { meter_id: 2, reading_date: '2024-01-31', reading_value: 1300 },
    { meter_id: 4, reading_date: '2024-01-01', reading_value: 100 },
    { meter_id: 4, reading_date: '2024-01-31', reading_value: 150 },
    { meter_id: 6, reading_date: '2024-01-01', reading_value: 50 },
    { meter_id: 6, reading_date: '2024-01-31', reading_value: 120 }
  ];
  
  for (const r of readings) {
    await post('/meter-readings', r);
    console.log(`  插入: 表${r.meter_id}, 日期${r.reading_date}, 读数${r.reading_value}`);
  }
  
  console.log('\n=== 生成账单 ===');
  const result = await post('/bills/generate', { billing_period: '202401' });
  console.log(`  生成了 ${result.generated} 张账单`);
  
  console.log('\n=== 账单列表 ===');
  const bills = await get('/bills');
  bills.forEach(b => {
    console.log(`  ${b.bill_no} | ${b.enterprise_name} | ${b.energy_type} | 用量:${b.total_usage?.toFixed(2)} | 金额:¥${b.total_amount?.toFixed(2)}`);
  });
  
  console.log('\n=== 测试异常检测 ===');
  const anomaly1 = await post('/meter-readings', { meter_id: 1, reading_date: '2024-02-15', reading_value: 1400 });
  console.log(`  读数倒挂测试: ${anomaly1[0].anomaly?.message || '无异常'}`);
  
  const anomaly2 = await post('/meter-readings', { meter_id: 1, reading_date: '2024-02-28', reading_value: 5000 });
  console.log(`  读数突增测试: ${anomaly2[0].anomaly?.message || '无异常'}`);
  
  console.log('\n=== 待复核列表 ===');
  const pending = await get('/meter-readings?status=pending_review');
  console.log(`  待复核数量: ${pending.length}`);
  
  console.log('\n✓ 业务链路验证完成!');
}

main().catch(console.error);
