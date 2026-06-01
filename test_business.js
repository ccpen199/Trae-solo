const http = require('http');

function post(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const options = {
      hostname: '127.0.0.1',
      port: 56935,
      path: '/api' + path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch(e) { resolve({ success: false, raw: body }); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:56935/api' + path, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch(e) { resolve({ success: false, raw: body }); }
      });
    }).on('error', reject);
  });
}

(async function() {
  try {
    console.log('=== 1. 货主登录 ===');
    const login = await post('/auth/login', { phone: '13800138001', password: '123456' });
    console.log('登录结果:', login.success ? '成功' : '失败', login.data?.name);
    const shipperId = login.data?.id;

    console.log('\n=== 2. 创建订单 ===');
    const order = await post('/orders', {
      shipper_id: shipperId,
      order_type: 'instant',
      cargo_type: '电子产品',
      cargo_weight: 0.8,
      cargo_volume: 2.5,
      loading_address: '北京市朝阳区建国路88号',
      unloading_address: '北京市海淀区中关村大街1号',
      vehicle_type_required: '厢货',
      vehicle_length_required: 4.2,
      loading_requirements: '轻拿轻放',
      remark: '测试订单'
    });
    console.log('创建订单:', order.success ? '成功' : '失败', '订单号:', order.data?.order_no, '价格:', order.data?.price);
    const orderId = order.data?.id;

    console.log('\n=== 3. 司机登录 ===');
    const driverLogin = await post('/auth/login', { phone: '13800138002', password: '123456' });
    console.log('司机登录:', driverLogin.success ? '成功' : '失败');

    console.log('\n=== 4. 获取司机车辆 ===');
    const vehicles = await get('/vehicles/driver/1');
    console.log('车辆数量:', vehicles.data?.length);
    const vehicleId = vehicles.data?.[0]?.id;

    console.log('\n=== 5. 司机接单 ===');
    const accept = await post('/orders/' + orderId + '/accept', { driver_id: 1, vehicle_id: vehicleId });
    console.log('接单结果:', accept.success ? '成功' : '失败', accept.message || '');

    console.log('\n=== 6. 司机到达装货点 ===');
    const arrive = await post('/orders/' + orderId + '/arrive', {});
    console.log('到达结果:', arrive.success ? '成功' : '失败', arrive.message || '');

    console.log('\n=== 7. 完成订单 ===');
    const complete = await post('/orders/' + orderId + '/complete', {});
    console.log('完成结果:', complete.success ? '成功' : '失败', complete.message || '');

    console.log('\n=== 8. 订单详情 ===');
    const detail = await get('/orders/' + orderId);
    console.log('订单状态:', detail.data?.status, '运费:', detail.data?.price, '平台抽佣:', detail.data?.platform_fee, '司机收入:', detail.data?.driver_income);

    console.log('\n=== 9. 统计概览 ===');
    const stats = await get('/statistics/overview');
    console.log('今日订单:', stats.data?.today_orders, '待处理:', stats.data?.pending_orders, '活跃司机:', stats.data?.active_drivers);

    console.log('\n=== 10. SLA统计 ===');
    const sla = await get('/statistics/sla');
    console.log('SLA接单达标率:', sla.data?.accept_rate + '%', '上门达标率:', sla.data?.arrive_rate + '%');

    console.log('\n✅ 核心业务链路验证完成!');
  } catch (e) {
    console.error('测试失败:', e.message);
  }
})();
