import axios from 'axios';

const request = axios.create({
  baseURL: 'http://127.0.0.1:49291/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

request.interceptors.response.use(
  (response) => {
    console.log('[API]', response.config.method?.toUpperCase(), response.config.url, '→', response.status);
    console.log('[API] Response data:', JSON.stringify(response.data).substring(0, 500));
    
    const data = response.data;
    
    if (data && data.success === true && data.data !== undefined) {
      console.log('[API] Case 1: return data directly');
      return data;
    }
    
    if (Array.isArray(data)) {
      console.log('[API] Case 2: wrap array');
      return { success: true, data: data };
    }
    
    if (data && typeof data === 'object' && !data.success) {
      console.log('[API] Case 3: error object');
      return { success: false, data: null, message: data.message || '请求失败' };
    }
    
    console.log('[API] Case 4: default wrap');
    return { success: true, data: data };
  },
  (error) => {
    console.error('[API Error]', error.config?.method?.toUpperCase(), error.config?.url, '→', error.message);
    console.error('[API Error] Response:', error.response?.data);
    return Promise.reject(error);
  }
);

async function testAPI() {
  console.log('=== 开始测试前端 API 调用 ===\n');

  try {
    console.log('1. 测试 /api/revenue/summary');
    const res1 = await request.get('/revenue/summary');
    console.log('   返回结构:', Object.keys(res1));
    console.log('   res1.success:', res1.success);
    console.log('   res1.data:', JSON.stringify(res1.data).substring(0, 300));
    console.log('   ✓ 测试通过\n');
  } catch (err) {
    console.error('   ✗ 测试失败:', err.message, '\n');
  }

  try {
    console.log('2. 测试 /api/stations');
    const res2 = await request.get('/stations');
    console.log('   返回结构:', Object.keys(res2));
    console.log('   res2.success:', res2.success);
    console.log('   res2.data.length:', res2.data?.length || 0);
    if (res2.data?.length > 0) {
      console.log('   第一个充电站:', JSON.stringify(res2.data[0]).substring(0, 200));
    }
    console.log('   ✓ 测试通过\n');
  } catch (err) {
    console.error('   ✗ 测试失败:', err.message, '\n');
  }

  try {
    console.log('3. 测试 /api/orders?limit=5');
    const res3 = await request.get('/orders', { params: { limit: 5 } });
    console.log('   返回结构:', Object.keys(res3));
    console.log('   res3.success:', res3.success);
    console.log('   res3.data.length:', res3.data?.length || 0);
    if (res3.data?.length > 0) {
      console.log('   第一个订单:', JSON.stringify(res3.data[0]).substring(0, 200));
    }
    console.log('   ✓ 测试通过\n');
  } catch (err) {
    console.error('   ✗ 测试失败:', err.message, '\n');
  }

  try {
    console.log('4. 测试 /api/revenue/daily?days=7');
    const res4 = await request.get('/revenue/daily', { params: { days: 7 } });
    console.log('   返回结构:', Object.keys(res4));
    console.log('   res4.success:', res4.success);
    console.log('   res4.data keys:', Object.keys(res4.data || {}));
    console.log('   res4.data.chart_data length:', res4.data?.chart_data?.length || 0);
    console.log('   ✓ 测试通过\n');
  } catch (err) {
    console.error('   ✗ 测试失败:', err.message, '\n');
  }

  console.log('=== 测试完成 ===');
}

testAPI();
