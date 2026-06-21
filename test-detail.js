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
  const summary = await apiGet('/api/revenue/summary');
  console.log('=== Summary Data ===');
  console.log('summary.data.today:', JSON.stringify(summary.data.today, null, 2));
  console.log('summary.data.total_stations:', summary.data.total_stations);
  console.log('summary.data.online_chargers:', summary.data.online_chargers);
  console.log('summary.data.charging_now:', summary.data.charging_now);
  console.log('summary.data.online_rate:', summary.data.online_rate);
  
  const daily = await apiGet('/api/revenue/daily?days=7');
  console.log('\n=== Daily Data ===');
  console.log('daily keys:', Object.keys(daily));
  console.log('daily.data keys:', Object.keys(daily.data || {}));
  console.log('daily.data.list.length:', daily.data?.list?.length);
  console.log('daily.data.chart_data.length:', daily.data?.chart_data?.length);
  if (daily.data?.chart_data?.length > 0) {
    console.log('chart_data[0]:', JSON.stringify(daily.data.chart_data[0]));
  }
  if (daily.data?.list?.length > 0) {
    console.log('list[0]:', JSON.stringify(daily.data.list[0]));
  }
}
main();
