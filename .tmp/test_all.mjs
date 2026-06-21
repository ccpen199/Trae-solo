import fs from 'node:fs';

const BASE = 'http://127.0.0.1:3002';

function pretty(name, data) {
  const code = data.code;
  const d = data.data;
  let info = `code=${code}`;
  if (d && typeof d === 'object') {
    if (Array.isArray(d)) info += ` arr_len=${d.length}`;
    else if (d.list !== undefined) info += ` list=${d.list.length}/${d.total} page=${d.page}/${d.totalPages}`;
    else if (d.balance !== undefined) info += ` balance=${d.balance} frozen=${d.frozenAmount}`;
    else if (d.kpi) info += ` KPI.gmv=${d.kpi.gmv || '?'} emptyRate=${d.kpi.emptyRate || '?'}%`;
    else if (d.gmv !== undefined) info += ` gmv=${d.gmv}`;
    else if (d.summary) {
      const s = d.summary;
      if (s.driverTotalBalance !== undefined) info += ` 司机余额=${s.driverTotalBalance} 货主余额=${s.shipperTotalBalance}`;
    }
  }
  if (code !== 0) info += ` msg=${data.msg || ''}`;
  const icon = code === 0 ? '✅' : '❌';
  console.log(`  ${icon} [${name}] ${info}`);
  return code === 0;
}

async function req(path, method = 'GET', token, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (token) opts.headers.Authorization = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  return await res.json();
}

async function main() {
  console.log('========================================');
  console.log('  货运平台 API 核心端点验证 (Node ESM)');
  console.log('========================================\n');

  // 登录 - 司机
  const driverLogin = await req('/api/auth/login', 'POST', null, { phone: '13912345678', code: '000000' });
  pretty('司机登录', driverLogin);
  const TOKEN_D = driverLogin.data?.token;
  if (!TOKEN_D) { console.log('司机登录失败，退出'); return; }

  // 登录 - 管理员
  const adminLogin = await req('/api/auth/login', 'POST', null, { phone: '18010000000', code: '000000' });
  pretty('管理员登录', adminLogin);
  const TOKEN_A = adminLogin.data?.token;
  if (!TOKEN_A) { console.log('管理员登录失败，退出'); return; }

  console.log('\n--- 司机端 API (共12项) ---');
  let orderId = null;

  pretty('1.运单列表(分页)',      await req('/api/orders?page=1&pageSize=5', 'GET', TOKEN_D));
  const orders = await req('/api/orders?page=1&pageSize=5', 'GET', TOKEN_D);
  if (orders.data?.list?.length) {
    const first = orders.data.list.find(o => o.status === 'in_transit') || orders.data.list[0];
    orderId = first.id;
  }
  pretty('2.推荐运单(位置分页)',   await req('/api/matching/recommend/orders?page=1&pageSize=3&lng=116.4&lat=39.9', 'GET', TOKEN_D));
  pretty('3.钱包详情',            await req('/api/fund/wallet', 'GET', TOKEN_D));
  pretty('4.资金流水(分页)',      await req('/api/fund/transactions?page=1&pageSize=5', 'GET', TOKEN_D));
  pretty('5.预支申请列表',        await req('/api/fund/prepay?page=1&pageSize=5', 'GET', TOKEN_D));
  pretty('6.附近油站(北京)',      await req('/api/stations/nearby?lng=116.4074&lat=39.9042&radiusKm=100&fuelType=diesel_0', 'GET', TOKEN_D));
  pretty('7.结算批次列表',        await req('/api/settlement/batch?page=1&pageSize=5', 'GET', TOKEN_D));
  pretty('8.轨迹告警列表',        await req('/api/track/alerts/list?page=1&pageSize=5', 'GET', TOKEN_D));
  pretty('9.当前用户信息(me)',    await req('/api/auth/me', 'GET', TOKEN_D));

  if (orderId) {
    pretty(`10.轨迹回放(${orderId.slice(0,8)}...)`, await req(`/api/track/${orderId}/playback`, 'GET', TOKEN_D));
    pretty(`11.运单详情(${orderId.slice(0,8)}...)`, await req(`/api/orders/${orderId}`, 'GET', TOKEN_D));
    pretty(`12.加油方案推荐`,      await req(`/api/stations/recommend-for-order?orderId=${orderId}`, 'GET', TOKEN_D));
  }

  pretty('13.我的结算汇总',       await req('/api/settlement/my-settlements', 'GET', TOKEN_D));

  console.log('\n--- 管理员端 API (共7项) ---');
  pretty('1.KPI驾驶舱(30天)',     await req('/api/admin/dashboard/kpi?range=30', 'GET', TOKEN_A));
  pretty('2.认证审核台',          await req('/api/admin/risk/auth-review?page=1&pageSize=5', 'GET', TOKEN_A));
  pretty('3.预支审核台',          await req('/api/admin/risk/prepay-review?page=1&pageSize=5', 'GET', TOKEN_A));
  pretty('4.用户管理(分页)',      await req('/api/admin/users?page=1&pageSize=5', 'GET', TOKEN_A));
  pretty('5.资金监控总览',        await req('/api/admin/fund/monitor', 'GET', TOKEN_A));
  pretty('6.匹配日志(分页)',      await req('/api/matching/logs?page=1&pageSize=5', 'GET', TOKEN_A));
  pretty('7.油站管理CRUD',        await req('/api/admin/fuel-stations?page=1&pageSize=5', 'GET', TOKEN_A));
  pretty('8.对账明细导出',        await req('/api/settlement/details/export', 'GET', TOKEN_A));

  // 测试登录-货主
  const shipperLogin = await req('/api/auth/login', 'POST', null, { phone: '18612345678', code: '000000' });
  pretty('货主登录(自动注册)', shipperLogin);
  const TOKEN_S = shipperLogin.data?.token;
  if (TOKEN_S && orders.data?.list?.[0]) {
    console.log('\n--- 货主端 API ---');
    const oid = orders.data.list[0].id;
    pretty(`1.匹配司机推荐`,       await req(`/api/matching/recommend/drivers/${oid}`, 'GET', TOKEN_S));
    pretty('2.货主运单',            await req('/api/orders?page=1&pageSize=5', 'GET', TOKEN_S));
  }

  // 测试业务流程：创建运单 -> 发布 -> 接单
  if (TOKEN_S) {
    console.log('\n--- 业务流程测试 (创建→发布→接单) ---');
    try {
      const created = await req('/api/orders', 'POST', TOKEN_S, {
        title: '测试运单-上海→杭州',
        cargoType: '电子产品',
        cargoWeight: 3,
        cargoVolume: 12,
        vehicleTypeRequired: 'truck_4_2',
        pickupPoint: { city: '上海', district: '浦东新区', address: '张江高科技园区100号', longitude: 121.55, latitude: 31.2 },
        deliveryPoint: { city: '杭州', district: '西湖区', address: '文三路259号', longitude: 120.13, latitude: 30.27 },
        pickupStartTime: new Date(Date.now() + 86400000).toISOString(),
        pickupEndTime: new Date(Date.now() + 86400000 * 2).toISOString(),
        deliveryDeadline: new Date(Date.now() + 86400000 * 3).toISOString(),
        freightAmount: 580,
        prepayRatio: 0.3,
        prepayMaxAmount: 174,
        insuranceRequired: true,
        insuranceAmount: 2,
        distanceKm: 180,
        estimatedDurationHours: 3,
      });
      pretty('创建运单草稿', created);
      const newId = created.data?.id;
      if (newId) {
        const pub = await req(`/api/orders/${newId}/publish`, 'POST', TOKEN_S);
        pretty('发布运单', pub);
      }
    } catch (e) {
      console.log('  ❌ [业务流程] 异常:', e.message);
    }
  }

  console.log('\n========================================');
  console.log('  ✅ 所有端点测试执行完毕');
  console.log('  📡 HTTP服务:  http://localhost:3002');
  console.log('  🔌 Socket.io: ws://localhost:3002/socket.io');
  console.log('  🧪 健康检查:  GET /api/health');
  console.log('');
  console.log('  测试账号 (验证码 000000 / 123456)');
  console.log('   🚚 司机:   任意手机号(自动注册)');
  console.log('   📦 货主:   任意手机号(自动注册)');
  console.log('   👑 管理员: 18010000000 / 18010012345');
  console.log('========================================');
}

main().catch(e => console.error('FATAL:', e));
