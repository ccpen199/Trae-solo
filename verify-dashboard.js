const http = require('http');

function apiGet(path) {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:59291' + path, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
    }).on('error', reject);
  });
}

async function main() {
  console.log('=== 验证 Dashboard 数据解析逻辑 ===\n');

  try {
    // 1. 模拟 API 调用
    const [summaryRes, stationsRes, ordersRes, dailyRes] = await Promise.all([
      apiGet('/api/revenue/summary'),
      apiGet('/api/stations'),
      apiGet('/api/orders?limit=10'),
      apiGet('/api/revenue/daily?days=7')
    ]);

    // 2. 模拟前端的数据提取
    const summaryData = summaryRes.data || {};
    const stationsList = stationsRes.data || [];
    const ordersList = ordersRes.data || [];
    const trendData = dailyRes.data?.chart_data || dailyRes.data?.list || [];

    console.log('1. Summary 数据:');
    console.log('   total_stations:', summaryData.total_stations);
    console.log('   online_chargers:', summaryData.online_chargers);
    console.log('   charging_now:', summaryData.charging_now);
    console.log('   online_rate:', summaryData.online_rate);
    console.log('   today (类型):', typeof summaryData.today);
    console.log('   today.total_orders:', summaryData.today?.total_orders);
    console.log('   today.total_energy:', summaryData.today?.total_energy);

    console.log('\n2. Stations 数据:');
    console.log('   总数:', stationsList.length);
    console.log('   城市数量:', new Set(stationsList.map(s => s.city).filter(Boolean)).size);
    console.log('   前6个显示:', stationsList.slice(0, 6).length);
    if (stationsList.length > 0) {
      const s = stationsList[0];
      console.log('   第一个站:', s.name);
      console.log('     total_piles:', s.total_piles);
      console.log('     available_piles:', s.available_piles);
      console.log('     charging_piles:', s.charging_piles);
    }

    console.log('\n3. Orders 数据:');
    console.log('   总数:', ordersList.length);
    if (ordersList.length > 0) {
      const o = ordersList[0];
      console.log('   第一个订单:', o.order_no);
      console.log('     energy:', o.energy);
      console.log('     total_energy:', o.total_energy);
      console.log('     total_amount:', o.total_amount);
      console.log('     station_name:', o.station_name);
      console.log('     charger_code:', o.charger_code);
      console.log('     status:', o.status);
      console.log('     created_at:', o.created_at);
      console.log('     start_time:', o.start_time);
    }

    console.log('\n4. Daily 数据:');
    console.log('   daily.data 键:', Object.keys(dailyRes.data || {}));
    console.log('   chart_data 长度:', dailyRes.data?.chart_data?.length);
    console.log('   list 长度:', dailyRes.data?.list?.length);
    if (dailyRes.data?.chart_data?.length > 0) {
      const d = dailyRes.data.chart_data[0];
      console.log('   chart_data[0]:', JSON.stringify(d));
    }

    // 5. 验证关键计算
    console.log('\n5. 计算验证:');
    
    // 今日订单数
    const todayOrders = summaryData.today?.total_orders ?? 0;
    console.log('   今日订单数 (from summary.today.total_orders):', todayOrders);
    
    // 今日充电量
    const todayEnergy = summaryData.today?.total_energy ?? 0;
    console.log('   今日充电量 (from summary.today.total_energy):', todayEnergy, 'kWh');
    
    // 城市数量
    const cityCount = new Set(stationsList.map(s => s.city).filter(Boolean)).size;
    console.log('   覆盖城市数:', cityCount);
    
    // 趋势图数据
    const chartData = trendData.slice(-7).map(d => ({
      date: d.date ? d.date.slice(5) : (d.report_date ? d.report_date.slice(5) : ''),
      energy: d.total_energy || 0
    }));
    console.log('   近7日趋势数据点:', chartData.length);
    if (chartData.length > 0) {
      console.log('   最近一天:', chartData[chartData.length - 1]);
    }

    console.log('\n✅ 数据解析验证完成！');
    
  } catch (err) {
    console.error('验证失败:', err.message);
    console.error(err.stack);
  }
}

main();
