const http = require('http');

function makeRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function test() {
  console.log('=== API 接口测试 ===\n');

  // 1. 登录获取token
  console.log('1. 登录获取token...');
  const loginResult = await makeRequest({
    hostname: '127.0.0.1',
    port: 59218,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { username: 'employer1', password: '123456' });

  if (!loginResult.data || !loginResult.data.token) {
    console.log('   ❌ 登录失败:', loginResult.data);
    return;
  }
  const token = loginResult.data.token;
  console.log('   ✅ 登录成功\n');

  // 2. 测试GPS接口 - GET /gps/gps-tracks
  console.log('2. 测试 GET /api/gps/gps-tracks 接口 (query参数方式)...');
  const db = require('better-sqlite3')('data/app.sqlite');
  const testOrder = db.prepare('SELECT id, status FROM labor_orders WHERE status IN (\'in_progress\', \'completed\') LIMIT 1').get();
  
  if (testOrder) {
    const gpsResult = await makeRequest({
      hostname: '127.0.0.1',
      port: 59218,
      path: `/api/gps/gps-tracks?order_id=${testOrder.id}&order_type=labor`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log(`   HTTP状态: ${gpsResult.statusCode}`);
    if (gpsResult.data.tracks) {
      console.log(`   ✅ GPS接口正常，返回 ${gpsResult.data.tracks.length} 条轨迹`);
    } else if (gpsResult.data.error) {
      console.log(`   ⚠️  接口返回错误: ${gpsResult.data.error}`);
    } else {
      console.log('   ✅ GPS接口正常工作');
    }
  } else {
    console.log('   ⚠️  无测试订单');
  }
  console.log('');

  // 3. 测试GPS接口 - 路径参数方式 (兼容性测试)
  console.log('3. 测试 GET /api/gps/:order_id/:order_type 接口 (路径参数方式)...');
  if (testOrder) {
    const gpsResult = await makeRequest({
      hostname: '127.0.0.1',
      port: 59218,
      path: `/api/gps/${testOrder.id}/labor`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log(`   HTTP状态: ${gpsResult.statusCode}`);
    if (gpsResult.data.tracks) {
      console.log(`   ✅ GPS接口正常，返回 ${gpsResult.data.tracks.length} 条轨迹`);
    } else {
      console.log('   ❌ 接口异常:', gpsResult.data);
    }
  }
  console.log('');

  // 4. 测试搬家订单列表接口
  console.log('4. 测试 GET /api/moving-orders 列表接口...');
  const movingListResult = await makeRequest({
    hostname: '127.0.0.1',
    port: 59218,
    path: '/api/moving-orders?limit=3',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  console.log(`   HTTP状态: ${movingListResult.statusCode}`);
  if (movingListResult.data.orders && movingListResult.data.orders.length > 0) {
    const order = movingListResult.data.orders[0];
    console.log(`   ✅ 返回 ${movingListResult.data.orders.length} 条订单，共 ${movingListResult.data.total} 条`);
    console.log(`      订单ID: ${order.id.substring(0, 8)}...`);
    console.log(`      package_type: ${order.package_type || '未设置'}`);
    console.log(`      包含package_type字段: ${'package_type' in order ? '✅' : '❌'}`);
    console.log(`      service_packages: ${Array.isArray(order.service_packages) ? `数组 (${order.service_packages.length}个)` : '格式错误'}`);
    console.log(`      worker_ids: ${Array.isArray(order.worker_ids) ? `数组 (${order.worker_ids.length}个)` : '格式错误'}`);
  } else {
    console.log('   ⚠️  无订单数据或接口错误:', movingListResult.data);
  }
  console.log('');

  // 5. 测试搬家订单详情接口
  console.log('5. 测试 GET /api/moving-orders/:id 详情接口...');
  if (movingListResult.data.orders && movingListResult.data.orders.length > 0) {
    const orderId = movingListResult.data.orders[0].id;
    const movingDetailResult = await makeRequest({
      hostname: '127.0.0.1',
      port: 59218,
      path: `/api/moving-orders/${orderId}`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log(`   HTTP状态: ${movingDetailResult.statusCode}`);
    if (movingDetailResult.data.id) {
      console.log(`   ✅ 详情接口正常`);
      console.log(`      package_type: ${movingDetailResult.data.package_type || '未设置'}`);
      console.log(`      包含package_type字段: ${'package_type' in movingDetailResult.data ? '✅' : '❌'}`);
      console.log(`      service_packages: ${Array.isArray(movingDetailResult.data.service_packages) ? `数组 (${movingDetailResult.data.service_packages.length}个)` : '格式错误'}`);
    } else {
      console.log('   ❌ 详情接口异常:', movingDetailResult.data);
    }
  }
  console.log('');

  db.close();
  console.log('=== API 测试完成 ===');
}

test().catch(console.error);
