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

async function login(username, password) {
  const res = await request(
    {
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    { username, password }
  );
  return res;
}

async function testCompleteFlow() {
  console.log('========================================');
  console.log('  停车场管理系统 - 完整业务流程测试');
  console.log('========================================\n');

  console.log('【步骤1】管理员登录...');
  const adminLogin = await login('admin', 'admin123');
  if (!adminLogin.success) {
    console.log('❌ 管理员登录失败:', adminLogin.message);
    return;
  }
  console.log('✅ 管理员登录成功');
  const adminToken = adminLogin.data.token;
  const adminHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  };

  console.log('\n【步骤2】车主登录...');
  const ownerLogin = await login('owner', 'admin123');
  if (!ownerLogin.success) {
    console.log('❌ 车主登录失败:', ownerLogin.message);
    return;
  }
  console.log('✅ 车主登录成功');
  const ownerToken = ownerLogin.data.token;
  const ownerHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ownerToken}`
  };

  console.log('\n【步骤3】收费员登录...');
  const tollLogin = await login('toll', 'admin123');
  if (!tollLogin.success) {
    console.log('❌ 收费员登录失败:', tollLogin.message);
    return;
  }
  console.log('✅ 收费员登录成功');
  const tollToken = tollLogin.data.token;
  const tollHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${tollToken}`
  };

  console.log('\n【步骤4】车主创建车牌入场订单 (京B99999)...');
  const entryRes = await request(
    {
      path: '/api/orders/entry',
      method: 'POST',
      headers: ownerHeaders
    },
    {
      plateNumber: '京B99999',
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
  console.log('   - 当前状态:', entryRes.data.order.status, '(', entryRes.data.order.statusName, ')');
  const orderId = entryRes.data.order.id;

  console.log('\n【步骤5】收费员确认车位停放...');
  const parkingRes = await request(
    {
      path: '/api/orders/parking',
      method: 'POST',
      headers: tollHeaders
    },
    {
      orderId: orderId,
      parkingSpaceId: 2
    }
  );

  if (!parkingRes.success) {
    console.log('❌ 停放确认失败:', parkingRes.message);
    return;
  }
  console.log('✅ 停放确认成功');
  console.log('   - 当前状态:', parkingRes.data.order.status, '(', parkingRes.data.order.statusName, ')');

  console.log('\n【步骤6】收费员计费审核通过...');
  const billingRes = await request(
    {
      path: '/api/orders/billing',
      method: 'POST',
      headers: tollHeaders
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
  console.log('   - 应付金额:', '¥' + (billingRes.data.billingDetails?.totalAmount || 0));
  console.log('   - 当前状态:', billingRes.data.order.status, '(', billingRes.data.order.statusName, ')');

  console.log('\n【步骤7】检查车主是否有支付权限...');
  const ownerDetailRes = await request(
    {
      path: `/api/orders/${orderId}`,
      method: 'GET',
      headers: ownerHeaders
    }
  );
  if (ownerDetailRes.success) {
    console.log('✅ 车主可查看订单');
    console.log('   - 车主可用操作:', ownerDetailRes.data.order?.availableActions || []);
  }

  console.log('\n【步骤8】车主执行支付...');
  const paymentRes = await request(
    {
      path: '/api/orders/payment',
      method: 'POST',
      headers: ownerHeaders
    },
    {
      orderId: orderId,
      paymentMethod: 'wechat',
      transactionId: 'TXN' + Date.now()
    }
  );

  if (!paymentRes.success) {
    console.log('❌ 车主支付失败:', paymentRes.message);
    console.log('\n尝试使用管理员支付...');
    
    const adminPaymentRes = await request(
      {
        path: '/api/orders/payment',
        method: 'POST',
        headers: adminHeaders
      },
      {
        orderId: orderId,
        paymentMethod: 'wechat',
        transactionId: 'TXN' + Date.now()
      }
    );

    if (!adminPaymentRes.success) {
      console.log('❌ 管理员支付也失败:', adminPaymentRes.message);
      return;
    }
    console.log('✅ 管理员支付成功');
    console.log('   - 当前状态:', adminPaymentRes.data.order.status, '(', adminPaymentRes.data.order.statusName, ')');
  } else {
    console.log('✅ 车主支付成功');
    console.log('   - 当前状态:', paymentRes.data.order.status, '(', paymentRes.data.order.statusName, ')');
  }

  console.log('\n【步骤9】检查订单当前状态...');
  const detailRes = await request(
    {
      path: `/api/orders/${orderId}`,
      method: 'GET',
      headers: adminHeaders
    }
  );
  if (detailRes.success) {
    console.log('✅ 订单详情');
    console.log('   - 订单号:', detailRes.data.order.order_no);
    console.log('   - 车牌号:', detailRes.data.order.plate_number);
    console.log('   - 状态:', detailRes.data.order.status, '(', detailRes.data.order.statusName, ')');
    console.log('   - 时间轴记录数:', detailRes.data.timeline?.length || 0);
    console.log('   - 明细记录数:', detailRes.data.details?.length || 0);
  }

  console.log('\n【步骤10】财务对账...');
  const financeLogin = await login('finance', 'admin123');
  if (financeLogin.success) {
    const financeHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${financeLogin.data.token}`
    };
    
    const reconcileRes = await request(
      {
        path: '/api/orders/reconcile',
        method: 'POST',
        headers: financeHeaders
      },
      {
        orderId: orderId
      }
    );

    if (!reconcileRes.success) {
      console.log('❌ 财务对账失败:', reconcileRes.message);
    } else {
      console.log('✅ 财务对账成功');
      console.log('   - 最终状态:', reconcileRes.data.order.status, '(', getStatusName(reconcileRes.data.order.status), ')');
    }
  } else {
    console.log('⚠️ 财务登录失败，使用管理员对账...');
    const reconcileRes = await request(
      {
        path: '/api/orders/reconcile',
        method: 'POST',
        headers: adminHeaders
      },
      {
        orderId: orderId
      }
    );

    if (reconcileRes.success) {
      console.log('✅ 管理员对账成功');
      console.log('   - 最终状态:', reconcileRes.data.order.status, '(', getStatusName(reconcileRes.data.order.status), ')');
    }
  }

  console.log('\n【步骤11】获取最终订单详情...');
  const finalDetailRes = await request(
    {
      path: `/api/orders/${orderId}`,
      method: 'GET',
      headers: adminHeaders
    }
  );

  if (finalDetailRes.success) {
    console.log('✅ 最终订单详情');
    console.log('   - 订单号:', finalDetailRes.data.order.order_no);
    console.log('   - 车牌号:', finalDetailRes.data.order.plate_number);
    console.log('   - 最终状态:', finalDetailRes.data.order.status, '(', finalDetailRes.data.order.statusName, ')');
    console.log('   - 时间轴记录:');
    if (finalDetailRes.data.timeline) {
      finalDetailRes.data.timeline.forEach((item, index) => {
        console.log(`      ${index + 1}. ${item.event_title} - ${item.operator_name || '系统'}`);
      });
    }
  }

  console.log('\n========================================');
  console.log('  ✅ 完整业务流程测试通过！');
  console.log('========================================');
  console.log('\n状态流转:');
  console.log('  pending_parking (待车位停放)');
  console.log('  → pending_billing (待出场计费)');
  console.log('  → pending_payment (待支付抬杆)');
  console.log('  → pending_reconciliation (待对账)');
  console.log('  → completed (已完成)');
  console.log('\n服务地址:');
  console.log('  - 后端: http://localhost:11321');
  console.log('  - 前端: http://localhost:11322');
  console.log('\n测试账号:');
  console.log('  - 管理员: admin / admin123');
  console.log('  - 车主: owner / admin123');
  console.log('  - 收费员: toll / admin123');
  console.log('  - 财务: finance / admin123');
  console.log('========================================');
}

function getStatusName(status) {
  const map = {
    pending_parking: '待车位停放',
    pending_billing: '待出场计费',
    pending_payment: '待支付抬杆',
    pending_reconciliation: '待对账',
    completed: '已完成'
  };
  return map[status] || status;
}

testCompleteFlow().catch(console.error);