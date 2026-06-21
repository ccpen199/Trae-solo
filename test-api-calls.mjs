import axios from 'axios';

const request = axios.create({
  baseURL: 'http://127.0.0.1:49291/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

request.interceptors.response.use(
  (response) => response.data,
  (error) => { console.error('API Error:', error.message); return Promise.reject(error); }
);

async function test() {
  console.log('=== 测试 API 调用 ===\n');
  
  try {
    const summaryRes = await request.get('/revenue/summary');
    console.log('1. summaryRes:', typeof summaryRes);
    console.log('   keys:', Object.keys(summaryRes));
    console.log('   success:', summaryRes.success);
    console.log('   data.total_stations:', summaryRes.data?.total_stations);
  } catch(e) {
    console.log('summary 错误:', e.message);
  }
  
  console.log('');
  
  try {
    const stationsRes = await request.get('/stations');
    console.log('2. stationsRes:', typeof stationsRes);
    console.log('   keys:', Object.keys(stationsRes));
    console.log('   success:', stationsRes.success);
    console.log('   data is array:', Array.isArray(stationsRes.data));
    console.log('   data.length:', stationsRes.data?.length);
  } catch(e) {
    console.log('stations 错误:', e.message);
  }
  
  console.log('');
  
  try {
    const ordersRes = await request.get('/orders', { params: { limit: 10 } });
    console.log('3. ordersRes:', typeof ordersRes);
    console.log('   keys:', Object.keys(ordersRes));
    console.log('   success:', ordersRes.success);
    console.log('   data is array:', Array.isArray(ordersRes.data));
    console.log('   data.length:', ordersRes.data?.length);
  } catch(e) {
    console.log('orders 错误:', e.message);
  }
  
  console.log('');
  
  try {
    const dailyRes = await request.get('/revenue/daily', { params: { days: 7 } });
    console.log('4. dailyRes:', typeof dailyRes);
    console.log('   keys:', Object.keys(dailyRes));
    console.log('   success:', dailyRes.success);
    console.log('   data keys:', Object.keys(dailyRes.data || {}));
    console.log('   chart_data.length:', dailyRes.data?.chart_data?.length);
  } catch(e) {
    console.log('daily 错误:', e.message);
  }
}

test();
