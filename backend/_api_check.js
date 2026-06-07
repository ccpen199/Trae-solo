const http = require('http');

function request(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 59026,
      path: '/api' + path,
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { resolve(data); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

(async () => {
  try {
    // Login as admin
    const adminLogin = await request('POST', '/auth/login', {}, { phone: '13800000000', password: '123456' });
    const adminToken = adminLogin.token;
    const authHeaders = { Authorization: 'Bearer ' + adminToken };
    
    console.log('=== 1. 管理员仪表盘 ===');
    const dashboard = await request('GET', '/admin/dashboard', authHeaders);
    console.log('总订单:', dashboard.stats?.totalOrders);
    console.log('今日订单:', dashboard.stats?.todayOrders);
    console.log('总营收:', dashboard.stats?.totalRevenue);
    console.log('待结算:', dashboard.stats?.pendingSettlement);
    console.log('用户数:', dashboard.stats?.totalUsers);
    console.log('服务商数:', dashboard.stats?.totalProviders);

    console.log('\n=== 2. 待审核服务商 ===');
    const pendingProviders = await request('GET', '/admin/providers/pending', authHeaders);
    console.log('待审核数量:', pendingProviders.providers?.length);
    if (pendingProviders.providers?.[0]) {
      const p = pendingProviders.providers[0];
      console.log('第一个:', p.companyName, '| 执照:', p.businessLicense, '| 身份证前:', p.idCardFront);
    }

    console.log('\n=== 3. 后台订单列表 ===');
    const adminOrders = await request('GET', '/admin/orders', authHeaders);
    console.log('订单数量:', adminOrders.orders?.length);
    if (adminOrders.orders?.[0]) {
      const o = adminOrders.orders[0];
      console.log('第一个:', o.orderNo, '| 状态:', o.status, '| 金额:', o.totalAmount, '| 项目:', o.items?.[0]?.name);
    }

    console.log('\n=== 4. 结算记录 ===');
    const settlements = await request('GET', '/admin/settlements', authHeaders);
    console.log('结算数量:', settlements.settlements?.length);
    if (settlements.settlements?.[0]) {
      const s = settlements.settlements[0];
      console.log('第一个:', s.settlementNo, '| 金额:', s.settlementAmount, '| 状态:', s.status);
    }

    console.log('\n=== 5. 服务分类 ===');
    const categories = await request('GET', '/categories');
    console.log('分类数量:', categories.categories?.length);
    
    console.log('\n=== 6. 服务SKU (搬家服务 cat=4) ===');
    const moveSkus = await request('GET', '/services?categoryId=4');
    console.log('搬家服务数量:', moveSkus.skus?.length);
    if (moveSkus.skus?.[0]) console.log('第一个:', moveSkus.skus[0].name, '¥' + moveSkus.skus[0].price);

    console.log('\n=== 7. 客户登录并获取订单 ===');
    const customerLogin = await request('POST', '/auth/login', {}, { phone: '13600000000', password: '123456' });
    const customerToken = customerLogin.token;
    const customerHeaders = { Authorization: 'Bearer ' + customerToken };
    const myOrders = await request('GET', '/orders/my', customerHeaders);
    console.log('客户订单数:', myOrders.orders?.length);
    if (myOrders.orders?.[0]) {
      const o = myOrders.orders[0];
      console.log('第一个:', o.orderNo, '| 状态:', o.status, '| 金额:', o.totalAmount);
    }

    console.log('\n=== 8. 争议列表 ===');
    const disputes = await request('GET', '/disputes', customerHeaders);
    console.log('争议数量:', disputes.disputes?.length);
    if (disputes.disputes?.[0]) {
      const d = disputes.disputes[0];
      console.log('第一个:', d.type, '| 状态:', d.status, '| 描述:', d.description?.substring(0, 20));
    }
  } catch(e) {
    console.error('ERROR:', e.message);
  }
})();
