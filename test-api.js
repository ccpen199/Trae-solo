const http = require('http');

function makeRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } 
        catch (e) { resolve(data); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function testAPI() {
  console.log('=== 火车购票系统 API 测试 ===\n');

  // 1. 健康检查
  console.log('1. 健康检查:');
  const health = await makeRequest({
    hostname: 'localhost',
    port: 12217,
    path: '/api/health',
    method: 'GET'
  });
  console.log('   状态:', health.status);
  console.log('   数据库类型:', health.databaseType);
  console.log('   Redis:', health.redis);
  console.log('');

  // 2. 查询车次
  console.log('2. 查询车次列表:');
  const trains = await makeRequest({
    hostname: 'localhost',
    port: 12217,
    path: '/api/trains',
    method: 'GET'
  });
  console.log('   查询到车次数量:', trains.total);
  trains.data.forEach(t => {
    console.log('   -', t.train_number, t.from_station, '->', t.to_station, 
                '可用:', t.total_available, '张');
  });
  console.log('');

  // 3. 查询库存
  console.log('3. 查询库存概要:');
  const inventory = await makeRequest({
    hostname: 'localhost',
    port: 12217,
    path: '/api/tickets/inventory/summary',
    method: 'GET'
  });
  console.log('   库存记录数:', inventory.data ? inventory.data.length : 0);
  console.log('');

  // 4. 尝试订票
  console.log('4. 尝试订票 (G1 二等座):');
  const bookingBody = JSON.stringify({
    trainId: 1,
    fromStation: '北京',
    toStation: '上海',
    travelDate: '2026-05-03',
    seatType: '二等座',
    passengerName: '测试用户',
    passengerPhone: '13800138001',
    passengerIdCard: '110101199001011235',
    saleChannel: 'online'
  });

  const booking = await makeRequest({
    hostname: 'localhost',
    port: 12217,
    path: '/api/orders/book',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(bookingBody)
    }
  }, bookingBody);
  
  console.log('   订票结果:', booking.success ? '成功' : '失败');
  if (booking.success) {
    console.log('   订单号:', booking.data.order_no);
    console.log('   座位:', booking.data.seat_type, booking.data.carriage_number, booking.data.seat_number);
    console.log('   票价: ¥' + booking.data.price);
  } else {
    console.log('   失败原因:', booking.message);
  }
  console.log('');

  // 5. 查询订单
  console.log('5. 查询订单列表:');
  const orders = await makeRequest({
    hostname: 'localhost',
    port: 12217,
    path: '/api/orders',
    method: 'GET'
  });
  console.log('   订单总数:', orders.total || orders.data?.length);
  if (orders.data && orders.data.length > 0) {
    orders.data.forEach(o => {
      console.log('   -', o.order_no, o.passenger_name, 
                  o.train_number, o.seat_type, 
                  '状态:', o.status);
    });
  }
  console.log('');

  console.log('=== 测试完成 ===');
}

testAPI().catch(console.error);
