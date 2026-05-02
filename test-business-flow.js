const http = require('http');

const BASE_URL = 'http://localhost:11321';

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 11321,
      path: options.path,
      method: options.method,
      headers: options.headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function testBusinessFlow() {
  console.log('========================================');
  console.log('  停车场管理系统 - 业务流程测试');
  console.log('========================================\n');

  console.log('【步骤1】登录系统...');
  const loginRes = await request(
    {
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    { username: 'admin', password: 'admin123' }
  );
  
  if (!loginRes.success) {
    console.log('❌ 登录失败:', loginRes.message);
    return;
  }
  console.log('✅ 登录成功');
  const token = loginRes.data.token;
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  console.log('\n【步骤2】创建车牌入场订单 (京A88888)...');
  const entryRes = await request(
    {
      path: '/api/orders/entry',
      method: 'POST',
      headers: authHeaders
    },
    {
      plateNumber: '京A88888',
      vehicleType: 'car',
      gateId: 'main_gate'
    }
  );

  if (!entryRes.success) {
    console.log('❌ 入场失败:', entryRes.message);
    return;
  }
  console.log('✅ 入场成功');
  console.log('   - 订单号:', entryRes.data.order.order_no);
  console.log('   - 当前状态:', entryRes.data.order.status);
  const orderId = entryRes.data.order.id;

  console.log('\n【步骤3】确认车位停放...');
  const parkingRes = await request(
    {
      path: '/api/orders/parking',
      method: 'POST',
      headers: authHeaders
    },
    {
      orderId: orderId,
      parkingSpaceId: 1
    }
  );

  if (!parkingRes.success) {
    console.log('❌ 停放确认失败:', parkingRes.message);
    return;
  }
  console.log('✅ 停放确认成功');
  console.log('   - 车位号:', parkingRes.data.parkingSpace?.space_no);
  console.log('   - 当前状态:', parkingRes.data.order.status);

  console.log('\n【步骤4】计费审核通过...');
  const billingRes = await request(
    {
      path: '/api/orders/billing',
      method: 'POST',
      headers: authHeaders
    },
    {
      orderId: orderId,
      action: 'approve'
    }
  );

  if (!billingRes.success) {
    console.log('❌ 计费审核失败:', billingRes.message);
    return;
  }
  console.log('✅ 计费审核通过');
  console.log('   - 应付金额:', billingRes.data.billingDetails?.totalAmount || '¥0.00');
  console.log('   - 当前状态:', billingRes.data.order.status);

  console.log('\n【步骤5】支付抬杆...');
  const paymentRes = await request(
    {
      path: '/api/orders/payment',
      method: 'POST',
      headers: authHeaders
    },
    {
      orderId: orderId,
      paymentMethod: 'wechat',
      transactionId: 'TXN' + Date.now()
    }
  );

  if (!paymentRes.success) {
    console.log('❌ 支付失败:', paymentRes.message);
    return;
  }
  console.log('✅ 支付成功，已抬杆');
  console.log('   - 实付金额:', paymentRes.data.order?.paid_amount || '¥0.00');
  console.log('   - 当前状态:', paymentRes.data.order.status);

  console.log('\n【步骤6】完成对账...');
  const reconcileRes = await request(
    {
      path: '/api/orders/reconcile',
      method: 'POST',
      headers: authHeaders
    },
    {
      orderId: orderId
    }
  );

  if (!reconcileRes.success) {
    console.log('❌ 对账失败:', reconcileRes.message);
    return;
  }
  console.log('✅ 对账完成');
  console.log('   - 最终状态:', reconcileRes.data.order.status);

  console.log('\n【步骤7】获取订单详情验证...');
  const detailRes = await request(
    {
      path: `/api/orders/${orderId}`,
      method: 'GET',
      headers: authHeaders
    }
  );

  if (!detailRes.success) {
    console.log('❌ 获取详情失败:', detailRes.message);
    return;
  }
  console.log('✅ 订单详情');
  console.log('   - 订单号:', detailRes.data.order.order_no);
  console.log('   - 车牌号:', detailRes.data.order.plate_number);
  console.log('   - 最终状态:', detailRes.data.order.status);
  console.log('   - 时间轴记录数:', detailRes.data.timeline?.length || 0);

  console.log('\n========================================');
  console.log('  ✅ 完整业务流程测试通过！');
  console.log('========================================');
  console.log('\n服务地址:');
  console.log('  - 后端: http://localhost:11321');
  console.log('  - 前端: http://localhost:11322');
  console.log('\n测试账号:');
  console.log('  - 管理员: admin / admin123');
  console.log('  - 收费员: toll / admin123');
  console.log('========================================');
}

testBusinessFlow().catch(console.error);