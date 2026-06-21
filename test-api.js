const http = require('http');

function apiGet(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:59291${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function apiPost(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: '127.0.0.1',
      port: 59291,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('=== API 数据格式验证 ===\n');
  
  try {
    // 1. 充电站
    const stations = await apiGet('/api/stations');
    console.log('1. /api/stations');
    console.log('   success:', stations.success);
    console.log('   count:', stations.data?.length || 0);
    if (stations.data?.length > 0) {
      console.log('   字段:', Object.keys(stations.data[0]).join(', '));
      console.log('   示例:', stations.data[0].name, stations.data[0].city,
        '总桩:', stations.data[0].total_piles,
        '空闲:', stations.data[0].available_piles,
        '充电中:', stations.data[0].charging_piles,
        '离线:', stations.data[0].offline_piles);
    }
    console.log('');

    // 2. 充电桩
    const chargers = await apiGet('/api/chargers');
    console.log('2. /api/chargers');
    console.log('   success:', chargers.success);
    console.log('   count:', chargers.data?.length || 0);
    if (chargers.data?.length > 0) {
      console.log('   字段:', Object.keys(chargers.data[0]).join(', '));
      console.log('   示例:', chargers.data[0].charger_code,
        '类型:', chargers.data[0].type,
        '功率:', chargers.data[0].power_rating,
        '状态:', chargers.data[0].status);
    }
    console.log('');

    // 3. 订单
    const orders = await apiGet('/api/orders');
    console.log('3. /api/orders');
    console.log('   success:', orders.success);
    console.log('   count:', orders.data?.length || 0);
    if (orders.data?.length > 0) {
      console.log('   字段:', Object.keys(orders.data[0]).join(', '));
      console.log('   示例:', orders.data[0].order_no,
        '状态:', orders.data[0].status,
        '电量:', orders.data[0].total_energy,
        '金额:', orders.data[0].total_amount);
    }
    console.log('');

    // 4. 收益统计
    const summary = await apiGet('/api/revenue/summary');
    console.log('4. /api/revenue/summary');
    console.log('   success:', summary.success);
    if (summary.data) {
      console.log('   字段:', Object.keys(summary.data).join(', '));
    }
    console.log('');

    // 5. 日收益
    const daily = await apiGet('/api/revenue/daily?days=7');
    console.log('5. /api/revenue/daily');
    console.log('   success:', daily.success);
    console.log('   count:', daily.data?.length || 0);
    if (daily.data?.length > 0) {
      console.log('   字段:', Object.keys(daily.data[0]).join(', '));
    }
    console.log('');

    // 6. 告警
    const alarms = await apiGet('/api/alarms');
    console.log('6. /api/alarms');
    console.log('   success:', alarms.success);
    console.log('   count:', alarms.data?.length || 0);
    if (alarms.data?.length > 0) {
      console.log('   字段:', Object.keys(alarms.data[0]).join(', '));
    }
    console.log('');

    // 7. 电价策略
    const pricing = await apiGet('/api/pricing');
    console.log('7. /api/pricing');
    console.log('   success:', pricing.success);
    console.log('   count:', pricing.data?.length || 0);
    if (pricing.data?.length > 0) {
      console.log('   字段:', Object.keys(pricing.data[0]).join(', '));
    }
    console.log('');

    // 8. 智能推荐
    const rec = await apiPost('/api/recommendation', {
      latitude: 39.9087,
      longitude: 116.4123,
      batteryCapacity: 60,
      currentSoc: 30,
      targetSoc: 80,
      preferFast: true,
      preferLowPrice: true,
      maxDistance: 10
    });
    console.log('8. POST /api/recommendation');
    console.log('   success:', rec.success);
    console.log('   message:', rec.message || '');
    console.log('   count:', rec.data?.length || 0);
    if (rec.data?.length > 0) {
      console.log('   字段:', Object.keys(rec.data[0]).join(', '));
      const r = rec.data[0];
      console.log('   示例站:', r.station?.name, '评分:', r.score);
    }
    console.log('');

    // 9. 充电站详情
    const stationDetail = await apiGet('/api/stations/1');
    console.log('9. /api/stations/1 (详情)');
    console.log('   success:', stationDetail.success);
    if (stationDetail.data) {
      console.log('   字段:', Object.keys(stationDetail.data).join(', '));
    }
    console.log('');

    // 10. 充电桩详情
    const chargerDetail = await apiGet('/api/chargers/1');
    console.log('10. /api/chargers/1 (详情)');
    console.log('    success:', chargerDetail.success);
    if (chargerDetail.data) {
      console.log('    字段:', Object.keys(chargerDetail.data).join(', '));
    }
    console.log('');

    // 11. 设备健康列表
    let healthList;
    try {
      healthList = await apiGet('/api/chargers/health/list');
      console.log('11. /api/chargers/health/list');
      console.log('    success:', healthList.success);
      console.log('    count:', healthList.data?.length || 0);
      if (healthList.data?.length > 0) {
        console.log('    字段:', Object.keys(healthList.data[0]).join(', '));
      }
    } catch(e) {
      console.log('11. /api/chargers/health/list - 失败', e.message);
    }
    
  } catch (err) {
    console.error('验证失败:', err.message);
  }
}

main();
