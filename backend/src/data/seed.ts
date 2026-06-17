import type Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

function randomOffset(base: number, range: number): number {
  return base + (Math.random() - 0.5) * range;
}

function randomInArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function hoursAgo(hours: number): string {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

function hoursLater(hours: number): string {
  const d = new Date();
  d.setHours(d.getHours() + hours);
  return d.toISOString();
}

function generateOrderNo(): string {
  return 'SP' + Date.now() + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
}

export function seedDatabase(db: Database.Database): void {
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
  if (userCount > 0) {
    return;
  }

  const hash = bcrypt.hashSync('123456', 10);
  const now = new Date().toISOString();

  const cityData = [
    { id: uuidv4(), name: '北京', province: '北京市', tier: '一线', center_lat: 39.9042, center_lng: 116.4074 },
    { id: uuidv4(), name: '上海', province: '上海市', tier: '一线', center_lat: 31.2304, center_lng: 121.4737 },
    { id: uuidv4(), name: '广州', province: '广东省', tier: '一线', center_lat: 23.1291, center_lng: 113.2644 },
    { id: uuidv4(), name: '深圳', province: '广东省', tier: '一线', center_lat: 22.5431, center_lng: 114.0579 },
    { id: uuidv4(), name: '杭州', province: '浙江省', tier: '新一线', center_lat: 30.2741, center_lng: 120.1551 },
    { id: uuidv4(), name: '成都', province: '四川省', tier: '新一线', center_lat: 30.5728, center_lng: 104.0668 },
    { id: uuidv4(), name: '武汉', province: '湖北省', tier: '新一线', center_lat: 30.5928, center_lng: 114.3055 },
    { id: uuidv4(), name: '南京', province: '江苏省', tier: '新一线', center_lat: 32.0603, center_lng: 118.7969 },
    { id: uuidv4(), name: '西安', province: '陕西省', tier: '新一线', center_lat: 34.3416, center_lng: 108.9398 },
    { id: uuidv4(), name: '重庆', province: '重庆市', tier: '新一线', center_lat: 29.5630, center_lng: 106.5516 }
  ];

  const insertCity = db.prepare(`
    INSERT INTO cities (id, name, province, tier, center_lat, center_lng, pricing_config, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const txCities = db.transaction(() => {
    for (const c of cityData) {
      insertCity.run(
        c.id, c.name, c.province, c.tier, c.center_lat, c.center_lng,
        JSON.stringify({ baseFee: 3, perKm: 1.5, perKg: 0.5 }),
        'active'
      );
    }
  });
  txCities();

  const beijingId = cityData[0].id;

  const insertGeofence = db.prepare(`
    INSERT INTO city_geofences (id, city_id, name, type, polygon, config)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const geofenceNames = ['朝阳区配送区', '海淀区禁停区', '东城区商务区', '西城区配送区', '丰台区商业区'];
  const geofenceTypes = ['delivery', 'forbidden', 'business', 'delivery', 'business'];
  const txGeofences = db.transaction(() => {
    for (let i = 0; i < 5; i++) {
      const polygon = JSON.stringify([
        [randomOffset(cityData[0].center_lat, 0.1), randomOffset(cityData[0].center_lng, 0.1)],
        [randomOffset(cityData[0].center_lat, 0.1), randomOffset(cityData[0].center_lng, 0.1)],
        [randomOffset(cityData[0].center_lat, 0.1), randomOffset(cityData[0].center_lng, 0.1)],
        [randomOffset(cityData[0].center_lat, 0.1), randomOffset(cityData[0].center_lng, 0.1)]
      ]);
      insertGeofence.run(
        uuidv4(), beijingId, geofenceNames[i], geofenceTypes[i], polygon,
        JSON.stringify({ priority: i + 1 })
      );
    }
  });
  txGeofences();

  const users: Array<{
    id: string;
    phone: string;
    passwordHash: string;
    nickname: string;
    avatar: string;
    role: string;
    realName: string;
    idCard: string;
    balance: number;
    cityId: string;
    status: string;
  }> = [];

  users.push({
    id: uuidv4(), phone: '13800000001', passwordHash: hash, nickname: '王小明',
    avatar: '', role: 'user', realName: '王小明', idCard: '110101199501011234',
    balance: 588.5, cityId: beijingId, status: 'normal'
  });

  users.push({
    id: uuidv4(), phone: '13800000002', passwordHash: hash, nickname: '青铜骑手-李',
    avatar: '', role: 'rider', realName: '李青铜', idCard: '110101199302022345',
    balance: 1250.0, cityId: beijingId, status: 'normal'
  });

  users.push({
    id: uuidv4(), phone: '13800000003', passwordHash: hash, nickname: '黄金骑手-张',
    avatar: '', role: 'rider', realName: '张黄金', idCard: '110101199203033456',
    balance: 3580.5, cityId: beijingId, status: 'normal'
  });

  users.push({
    id: uuidv4(), phone: '13800000004', passwordHash: hash, nickname: '钻石骑手-赵',
    avatar: '', role: 'rider', realName: '赵钻石', idCard: '110101199004044567',
    balance: 8890.0, cityId: beijingId, status: 'normal'
  });

  users.push({
    id: uuidv4(), phone: '13800000005', passwordHash: hash, nickname: '美味小厨',
    avatar: '', role: 'merchant', realName: '陈老板', idCard: '110101198805055678',
    balance: 12580.0, cityId: beijingId, status: 'normal'
  });

  users.push({
    id: uuidv4(), phone: '13800000006', passwordHash: hash, nickname: '鲜花坊',
    avatar: '', role: 'merchant', realName: '刘经理', idCard: '110101198906066789',
    balance: 6320.0, cityId: beijingId, status: 'normal'
  });

  users.push({
    id: uuidv4(), phone: '13800000000', passwordHash: hash, nickname: '平台管理员',
    avatar: '', role: 'admin', realName: '管理员', idCard: '110101199000000000',
    balance: 0, cityId: beijingId, status: 'normal'
  });

  const insertUser = db.prepare(`
    INSERT INTO users (id, phone, nickname, avatar, real_name, id_card, role, password_hash, balance, city_id, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const txUsers = db.transaction(() => {
    for (const u of users) {
      insertUser.run(u.id, u.phone, u.nickname, u.avatar, u.realName, u.idCard, u.role, u.passwordHash, u.balance, u.cityId, u.status, now);
    }
  });
  txUsers();

  const normalUserId = users[0].id;
  const rider1UserId = users[1].id;
  const rider2UserId = users[2].id;
  const rider3UserId = users[3].id;
  const merchant1UserId = users[4].id;
  const merchant2UserId = users[5].id;
  const adminUserId = users[6].id;

  const riderLevels = ['bronze', 'gold', 'diamond'];
  const riderRecords = [
    {
      id: uuidv4(), userId: rider1UserId, level: 'bronze', totalOrders: 128,
      creditScore: 95, fulfillmentRate: 92.5, avgRating: 4.6, currentOrders: 0,
      onlineStatus: 'online', acceptMode: 'hybrid',
      currentLat: randomOffset(cityData[0].center_lat, 0.05),
      currentLng: randomOffset(cityData[0].center_lng, 0.05),
      onlineAt: hoursAgo(4)
    },
    {
      id: uuidv4(), userId: rider2UserId, level: 'gold', totalOrders: 586,
      creditScore: 98, fulfillmentRate: 97.2, avgRating: 4.8, currentOrders: 1,
      onlineStatus: 'busy', acceptMode: 'dispatch',
      currentLat: randomOffset(cityData[0].center_lat, 0.05),
      currentLng: randomOffset(cityData[0].center_lng, 0.05),
      onlineAt: hoursAgo(6)
    },
    {
      id: uuidv4(), userId: rider3UserId, level: 'diamond', totalOrders: 1892,
      creditScore: 99, fulfillmentRate: 99.1, avgRating: 4.95, currentOrders: 0,
      onlineStatus: 'online', acceptMode: 'dispatch',
      currentLat: randomOffset(cityData[0].center_lat, 0.05),
      currentLng: randomOffset(cityData[0].center_lng, 0.05),
      onlineAt: hoursAgo(2)
    }
  ];

  const insertRider = db.prepare(`
    INSERT INTO riders (id, user_id, level, total_orders, credit_score, fulfillment_rate, avg_rating, current_orders, online_status, accept_mode, current_lat, current_lng, online_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const txRiders = db.transaction(() => {
    for (const r of riderRecords) {
      insertRider.run(
        r.id, r.userId, r.level, r.totalOrders, r.creditScore, r.fulfillmentRate,
        r.avgRating, r.currentOrders, r.onlineStatus, r.acceptMode,
        r.currentLat, r.currentLng, r.onlineAt, now
      );
    }
  });
  txRiders();

  const rider1Id = riderRecords[0].id;
  const rider2Id = riderRecords[1].id;
  const rider3Id = riderRecords[2].id;

  const vehicleTypes = ['ebike', 'motorcycle', 'car'];
  const plateNos = ['京A·E12345', '京B·M67890', '京C·C11223'];
  const insertVehicle = db.prepare(`
    INSERT INTO vehicles (id, rider_id, type, plate_number, vehicle_image, insurance_expire)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const txVehicles = db.transaction(() => {
    for (let i = 0; i < 3; i++) {
      insertVehicle.run(
        uuidv4(),
        riderRecords[i].id,
        vehicleTypes[i],
        plateNos[i],
        '',
        '2026-12-31T00:00:00.000Z'
      );
    }
  });
  txVehicles();

  const serviceAreaNames = ['朝阳区全境', '海淀区东部', '东城区核心区'];
  const insertServiceArea = db.prepare(`
    INSERT INTO rider_service_areas (id, rider_id, name, polygon)
    VALUES (?, ?, ?, ?)
  `);
  const txServiceAreas = db.transaction(() => {
    for (let i = 0; i < 3; i++) {
      const polygon = JSON.stringify([
        [randomOffset(cityData[0].center_lat, 0.08), randomOffset(cityData[0].center_lng, 0.08)],
        [randomOffset(cityData[0].center_lat, 0.08), randomOffset(cityData[0].center_lng, 0.08)],
        [randomOffset(cityData[0].center_lat, 0.08), randomOffset(cityData[0].center_lng, 0.08)],
        [randomOffset(cityData[0].center_lat, 0.08), randomOffset(cityData[0].center_lng, 0.08)]
      ]);
      insertServiceArea.run(uuidv4(), riderRecords[i].id, serviceAreaNames[i], polygon);
    }
  });
  txServiceAreas();

  const merchants = [
    {
      id: uuidv4(), userId: merchant1UserId, shopName: '美味小厨·家常菜',
      licenseNo: 'JY11101050012345', legalPerson: '陈老板', idCard: '110101198805055678',
      category: '餐饮美食', auditStatus: 'approved', commissionRate: 0.12, balance: 12580.0
    },
    {
      id: uuidv4(), userId: merchant2UserId, shopName: '花语鲜花坊',
      licenseNo: 'JY11101050067890', legalPerson: '刘经理', idCard: '110101198906066789',
      category: '鲜花礼品', auditStatus: 'approved', commissionRate: 0.10, balance: 6320.0
    }
  ];

  const insertMerchant = db.prepare(`
    INSERT INTO merchants (id, user_id, shop_name, license_no, legal_person, id_card, category, audit_status, commission_rate, balance)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const txMerchants = db.transaction(() => {
    for (const m of merchants) {
      insertMerchant.run(
        m.id, m.userId, m.shopName, m.licenseNo, m.legalPerson, m.idCard,
        m.category, m.auditStatus, m.commissionRate, m.balance
      );
    }
  });
  txMerchants();

  const merchant1Id = merchants[0].id;
  const merchant2Id = merchants[1].id;

  const stores = [
    {
      id: uuidv4(), merchantId: merchant1Id, name: '美味小厨（朝阳店）',
      address: '北京市朝阳区建国路88号SOHO现代城底商',
      lat: randomOffset(cityData[0].center_lat, 0.05),
      lng: randomOffset(cityData[0].center_lng, 0.05),
      businessHours: '10:00-22:00', deliveryRadius: 5, deliveryFee: 3, status: 'open'
    },
    {
      id: uuidv4(), merchantId: merchant2Id, name: '花语鲜花坊（三里屯店）',
      address: '北京市朝阳区三里屯太古里北区',
      lat: randomOffset(cityData[0].center_lat, 0.05),
      lng: randomOffset(cityData[0].center_lng, 0.05),
      businessHours: '09:00-21:00', deliveryRadius: 8, deliveryFee: 5, status: 'open'
    }
  ];

  const insertStore = db.prepare(`
    INSERT INTO merchant_stores (id, merchant_id, name, address, lat, lng, business_hours, delivery_radius, delivery_fee, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const txStores = db.transaction(() => {
    for (const s of stores) {
      insertStore.run(
        s.id, s.merchantId, s.name, s.address, s.lat, s.lng,
        s.businessHours, s.deliveryRadius, s.deliveryFee, s.status
      );
    }
  });
  txStores();

  const store1Id = stores[0].id;
  const store2Id = stores[1].id;

  const productData = [
    { storeId: store1Id, name: '宫保鸡丁', category: '热菜', price: 32, stock: 100 },
    { storeId: store1Id, name: '鱼香肉丝', category: '热菜', price: 28, stock: 100 },
    { storeId: store1Id, name: '麻婆豆腐', category: '热菜', price: 18, stock: 150 },
    { storeId: store1Id, name: '米饭', category: '主食', price: 2, stock: 500 },
    { storeId: store1Id, name: '番茄鸡蛋汤', category: '汤类', price: 12, stock: 80 },
    { storeId: store2Id, name: '红玫瑰11枝', category: '鲜花', price: 168, stock: 50 },
    { storeId: store2Id, name: '向日葵花束', category: '鲜花', price: 128, stock: 40 },
    { storeId: store2Id, name: '混合花篮', category: '鲜花', price: 298, stock: 20 },
    { storeId: store2Id, name: '康乃馨花束', category: '鲜花', price: 98, stock: 60 },
    { storeId: store2Id, name: '永生花礼盒', category: '礼品', price: 388, stock: 15 }
  ];

  const insertProduct = db.prepare(`
    INSERT INTO merchant_products (id, store_id, name, category, price, image, stock, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const txProducts = db.transaction(() => {
    for (const p of productData) {
      insertProduct.run(uuidv4(), p.storeId, p.name, p.category, p.price, '', p.stock, 'on');
    }
  });
  txProducts();

  const orderCategories = ['buy', 'send', 'fetch', 'errand'];
  const orderStatuses = ['pending', 'accepted', 'picked_up', 'delivering', 'completed', 'cancelled', 'disputed'];
  const payMethods = ['wechat', 'alipay', 'balance'];

  const orders: Array<Record<string, unknown>> = [];
  for (let i = 0; i < 30; i++) {
    const category = orderCategories[i % 4];
    const status = orderStatuses[i % 7];
    const riderAssigned = status !== 'pending' && status !== 'cancelled' ? riderRecords[i % 3].id : null;
    const merchantId = i % 2 === 0 ? merchant1Id : merchant2Id;
    const goodsAmount = 20 + Math.random() * 200;
    const deliveryFee = 3 + Math.random() * 10;
    const distance = 0.5 + Math.random() * 8;
    const weight = category === 'send' ? 0.5 + Math.random() * 10 : 0;

    const createdAt = daysAgo(Math.floor(i / 3));
    let acceptedAt: string | null = null;
    let pickedUpAt: string | null = null;
    let completedAt: string | null = null;
    let cancelledAt: string | null = null;

    if (status !== 'pending' && status !== 'cancelled') {
      acceptedAt = hoursAgo(20 - i);
    }
    if (status === 'picked_up' || status === 'delivering' || status === 'completed' || status === 'disputed') {
      pickedUpAt = hoursAgo(15 - i);
    }
    if (status === 'completed' || status === 'disputed') {
      completedAt = hoursAgo(10 - i);
    }
    if (status === 'cancelled') {
      cancelledAt = hoursAgo(5 - i);
    }

    orders.push({
      id: uuidv4(),
      orderNo: generateOrderNo(),
      category,
      cityId: beijingId,
      userId: normalUserId,
      merchantId: category === 'buy' ? merchantId : null,
      riderId: riderAssigned,
      status,
      amount: Number((goodsAmount + deliveryFee).toFixed(2)),
      goodsAmount: Number(goodsAmount.toFixed(2)),
      deliveryFee: Number(deliveryFee.toFixed(2)),
      distance: Number(distance.toFixed(2)),
      weight: Number(weight.toFixed(2)),
      premium: 0,
      couponId: null,
      payMethod: payMethods[i % 3],
      payStatus: status === 'cancelled' ? (i % 2 === 0 ? 'refunded' : 'unpaid') : 'paid',
      pickupName: category === 'buy' ? (i % 2 === 0 ? '美味小厨' : '花语鲜花坊') : '王小明',
      pickupPhone: '13800000000',
      pickupAddress: category === 'buy'
        ? (i % 2 === 0 ? '北京市朝阳区建国路88号SOHO现代城底商' : '北京市朝阳区三里屯太古里北区')
        : '北京市朝阳区望京SOHO T1',
      pickupLat: randomOffset(cityData[0].center_lat, 0.05),
      pickupLng: randomOffset(cityData[0].center_lng, 0.05),
      deliverName: '王小明',
      deliverPhone: '13800000001',
      deliverAddress: '北京市海淀区中关村大街1号搜狐大厦',
      deliverLat: randomOffset(cityData[0].center_lat, 0.08),
      deliverLng: randomOffset(cityData[0].center_lng, 0.08),
      goodsDescription: category === 'buy' ? '购买商品' : category === 'send' ? '寄送文件' : category === 'fetch' ? '取快递' : '代办事项',
      goodsImages: JSON.stringify([]),
      remark: '请尽快送达，谢谢！',
      expectedAt: hoursLater(1),
      acceptedAt,
      pickedUpAt,
      completedAt,
      cancelledAt,
      cancelReason: status === 'cancelled' ? (i % 2 === 0 ? '用户取消' : '超时未接单') : null,
      createdAt
    });
  }

  const insertOrder = db.prepare(`
    INSERT INTO orders (id, order_no, category, city_id, user_id, merchant_id, rider_id, status, amount, goods_amount, delivery_fee, distance, weight, premium, coupon_id, pay_method, pay_status, pickup_name, pickup_phone, pickup_address, pickup_lat, pickup_lng, deliver_name, deliver_phone, deliver_address, deliver_lat, deliver_lng, goods_description, goods_images, remark, expected_at, accepted_at, picked_up_at, completed_at, cancelled_at, cancel_reason, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const txOrders = db.transaction(() => {
    for (const o of orders) {
      insertOrder.run(
        o.id, o.orderNo, o.category, o.cityId, o.userId, o.merchantId, o.riderId,
        o.status, o.amount, o.goodsAmount, o.deliveryFee, o.distance, o.weight, o.premium,
        o.couponId, o.payMethod, o.payStatus, o.pickupName, o.pickupPhone, o.pickupAddress,
        o.pickupLat, o.pickupLng, o.deliverName, o.deliverPhone, o.deliverAddress,
        o.deliverLat, o.deliverLng, o.goodsDescription, o.goodsImages, o.remark,
        o.expectedAt, o.acceptedAt, o.pickedUpAt, o.completedAt, o.cancelledAt,
        o.cancelReason, o.createdAt
      );
    }
  });
  txOrders();

  const insertGpsTrack = db.prepare(`
    INSERT INTO gps_tracks (order_id, rider_id, timestamp, lat, lng, speed, accuracy)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const txGps = db.transaction(() => {
    for (const order of orders) {
      if (!order.riderId) continue;
      const startLat = order.pickupLat as number;
      const startLng = order.pickupLng as number;
      const endLat = order.deliverLat as number;
      const endLng = order.deliverLng as number;
      for (let j = 0; j < 20; j++) {
        const ratio = j / 19;
        const lat = startLat + (endLat - startLat) * ratio + (Math.random() - 0.5) * 0.002;
        const lng = startLng + (endLng - startLng) * ratio + (Math.random() - 0.5) * 0.002;
        insertGpsTrack.run(
          order.id as string,
          order.riderId as string,
          hoursAgo(j),
          lat,
          lng,
          5 + Math.random() * 25,
          3 + Math.random() * 10
        );
      }
    }
  });
  txGps();

  const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'disputed');
  const insertSettlement = db.prepare(`
    INSERT INTO settlements (id, order_id, rider_id, rider_income, merchant_id, merchant_income, platform_income, insurance_fee, tax, settled_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const txSettlements = db.transaction(() => {
    for (let i = 0; i < Math.min(10, completedOrders.length); i++) {
      const o = completedOrders[i];
      const amount = o.amount as number;
      const riderIncome = Number((amount * 0.7).toFixed(2));
      const merchantIncome = o.merchantId ? Number((amount * 0.2).toFixed(2)) : 0;
      const platformIncome = Number((amount * 0.1).toFixed(2));
      insertSettlement.run(
        uuidv4(), o.id as string, o.riderId as string, riderIncome,
        o.merchantId as string | null, merchantIncome, platformIncome,
        0.5, Number((platformIncome * 0.06).toFixed(2)),
        daysAgo(i)
      );
    }
  });
  txSettlements();

  const insertWithdrawal = db.prepare(`
    INSERT INTO withdrawals (id, user_id, amount, fee, bank_card, bank_name, holder_name, status, audit_note, created_at, paid_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const withdrawalStatuses = ['pending', 'approved', 'rejected', 'paid'];
  const withdrawalUsers = [rider1UserId, rider2UserId, rider3UserId, merchant1UserId, merchant2UserId];
  const txWithdrawals = db.transaction(() => {
    for (let i = 0; i < 5; i++) {
      const amount = 100 + i * 200;
      const status = withdrawalStatuses[i % 4];
      insertWithdrawal.run(
        uuidv4(), withdrawalUsers[i], amount, Number((amount * 0.01).toFixed(2)),
        '622202**********' + (1000 + i),
        i % 2 === 0 ? '中国工商银行' : '中国建设银行',
        users[i + 1].realName, status,
        status === 'rejected' ? '银行卡信息有误' : (status === 'approved' ? '审核通过' : ''),
        daysAgo(i),
        status === 'paid' ? daysAgo(i - 1) : null
      );
    }
  });
  txWithdrawals();

  const disputedOrders = orders.filter(o => o.status === 'disputed' || o.status === 'completed');
  const disputeTypes = ['timeout', 'cancel', 'complaint', 'damage', 'other'];
  const responsibleParties = ['rider', 'merchant', 'user', 'shared', 'system', 'force_majeure'];
  const insertDispute = db.prepare(`
    INSERT INTO dispute_tickets (id, order_id, initiator, type, description, evidences, status, responsible_party, compensation, assignee, created_at, resolved_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const txDisputes = db.transaction(() => {
    for (let i = 0; i < 3; i++) {
      const o = disputedOrders[i % disputedOrders.length];
      const status = i === 0 ? 'resolved' : (i === 1 ? 'investigating' : 'pending');
      insertDispute.run(
        uuidv4(), o.id as string, 'user', disputeTypes[i % 5],
        `纠纷描述：${disputeTypes[i % 5]}问题，需要平台介入处理`,
        JSON.stringify(['evidence1.jpg', 'evidence2.jpg']),
        status,
        status === 'resolved' ? responsibleParties[i % 6] : null,
        status === 'resolved' ? 20 + i * 30 : 0,
        status !== 'pending' ? adminUserId : null,
        daysAgo(3 - i),
        status === 'resolved' ? daysAgo(2 - i) : null
      );
    }
  });
  txDisputes();

  const reviewedOrders = orders.filter(o => o.status === 'completed');
  const reviewTags = [
    JSON.stringify(['准时', '服务好']),
    JSON.stringify(['速度快', '态度好']),
    JSON.stringify(['包装完整', '专业']),
    JSON.stringify(['准时', '态度好', '专业']),
    JSON.stringify(['速度快'])
  ];
  const reviewContents = [
    '骑手非常准时，服务态度很好，推荐！',
    '配送速度很快，物品完好无损，好评！',
    '师傅很专业，小心轻放，下次还找他！',
    '态度热情，沟通顺畅，值得信赖！',
    '整体体验不错，配送效率很高！'
  ];
  const insertReview = db.prepare(`
    INSERT INTO reviews (id, order_id, user_id, rating, tags, content, images, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const txReviews = db.transaction(() => {
    for (let i = 0; i < 10; i++) {
      const o = reviewedOrders[i % reviewedOrders.length];
      insertReview.run(
        uuidv4(), o.id as string, o.userId as string,
        4 + (i % 2),
        reviewTags[i % 5],
        reviewContents[i % 5],
        JSON.stringify([]),
        daysAgo(i)
      );
    }
  });
  txReviews();

  const medalTypes = [
    { type: 'order', name: '百单骑士' },
    { type: 'order', name: '千单王者' },
    { type: 'rating', name: '五星好评' },
    { type: 'streak', name: '连续在线7天' },
    { type: 'streak', name: '连续在线30天' },
    { type: 'speed', name: '闪电骑士' },
    { type: 'service', name: '服务之星' },
    { type: 'newbie', name: '新手入门' },
    { type: 'anniversary', name: '入职一周年' },
    { type: 'special', name: '年度优秀骑手' }
  ];
  const insertMedal = db.prepare(`
    INSERT INTO rider_medals (id, rider_id, type, name, awarded_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  const txMedals = db.transaction(() => {
    for (let i = 0; i < 10; i++) {
      insertMedal.run(
        uuidv4(), riderRecords[i % 3].id,
        medalTypes[i].type, medalTypes[i].name,
        daysAgo(i * 3)
      );
    }
  });
  txMedals();

  const insertCoupon = db.prepare(`
    INSERT INTO coupons (id, user_id, name, type, value, min_amount, valid_from, valid_to, used_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const couponNames = ['新人立减券', '满20减5', '满50减10', '配送费减免券', '限时折扣券'];
  const couponUsers = [normalUserId, normalUserId, normalUserId, rider1UserId, merchant1UserId, normalUserId, normalUserId, normalUserId, rider2UserId, normalUserId];
  const txCoupons = db.transaction(() => {
    for (let i = 0; i < 10; i++) {
      const isPercent = i % 3 === 0;
      insertCoupon.run(
        uuidv4(), couponUsers[i], couponNames[i % 5],
        isPercent ? 'percent' : 'fixed',
        isPercent ? 10 + i : 3 + i * 2,
        20 + i * 5,
        daysAgo(i),
        hoursLater(24 * 30),
        i < 3 ? daysAgo(i) : null
      );
    }
  });
  txCoupons();

  const addressTags = ['家', '公司', '学校', '父母家', '常用'];
  const insertAddress = db.prepare(`
    INSERT INTO user_addresses (id, user_id, tag, name, phone, address, lat, lng, is_default)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const addresses = [
    { tag: '家', name: '王小明', phone: '13800000001', address: '北京市海淀区中关村大街1号', isDefault: 1 },
    { tag: '公司', name: '王小明', phone: '13800000001', address: '北京市朝阳区望京SOHO T3', isDefault: 0 },
    { tag: '学校', name: '王小明', phone: '13800000001', address: '北京市海淀区清华园1号', isDefault: 0 },
    { tag: '父母家', name: '王大明', phone: '13900000001', address: '北京市西城区西单北大街1号', isDefault: 0 },
    { tag: '常用', name: '王小明', phone: '13800000001', address: '北京市东城区东长安街1号', isDefault: 0 }
  ];
  const txAddresses = db.transaction(() => {
    for (let i = 0; i < 5; i++) {
      insertAddress.run(
        uuidv4(), normalUserId, addresses[i].tag, addresses[i].name, addresses[i].phone,
        addresses[i].address,
        randomOffset(cityData[0].center_lat, 0.1),
        randomOffset(cityData[0].center_lng, 0.1),
        addresses[i].isDefault
      );
    }
  });
  txAddresses();

  const logActions = ['登录系统', '处理工单', '封禁骑手', '审核提现', '修改城市配置'];
  const targetTypes = ['admin', 'ticket', 'rider', 'withdrawal', 'city'];
  const insertLog = db.prepare(`
    INSERT INTO operation_logs (id, admin_id, action, target_type, target_id, detail, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const txLogs = db.transaction(() => {
    for (let i = 0; i < 5; i++) {
      insertLog.run(
        uuidv4(), adminUserId, logActions[i], targetTypes[i],
        uuidv4(),
        JSON.stringify({ action: logActions[i], operator: 'admin' }),
        hoursAgo(i * 5)
      );
    }
  });
  txLogs();
}

export const CITIES = [
  { id: '1', name: '北京', province: '北京市', tier: '一线', center_lat: 39.9042, center_lng: 116.4074 },
  { id: '2', name: '上海', province: '上海市', tier: '一线', center_lat: 31.2304, center_lng: 121.4737 },
  { id: '3', name: '广州', province: '广东省', tier: '一线', center_lat: 23.1291, center_lng: 113.2644 },
  { id: '4', name: '深圳', province: '广东省', tier: '一线', center_lat: 22.5431, center_lng: 114.0579 },
  { id: '5', name: '杭州', province: '浙江省', tier: '新一线', center_lat: 30.2741, center_lng: 120.1551 },
  { id: '6', name: '成都', province: '四川省', tier: '新一线', center_lat: 30.5728, center_lng: 104.0668 },
  { id: '7', name: '武汉', province: '湖北省', tier: '新一线', center_lat: 30.5928, center_lng: 114.3055 },
  { id: '8', name: '南京', province: '江苏省', tier: '新一线', center_lat: 32.0603, center_lng: 118.7969 },
  { id: '9', name: '西安', province: '陕西省', tier: '新一线', center_lat: 34.3416, center_lng: 108.9398 },
  { id: '10', name: '重庆', province: '重庆市', tier: '新一线', center_lat: 29.5630, center_lng: 106.5516 }
];

export const VEHICLE_TYPES = [
  { id: 'ebike', name: '电动车', capacity: '20kg', speed: '25km/h' },
  { id: 'motorcycle', name: '摩托车', capacity: '50kg', speed: '60km/h' },
  { id: 'car', name: '汽车', capacity: '200kg', speed: '80km/h' }
];

export const ORDER_CATEGORIES = [
  { id: 'buy', name: '帮买', description: '帮您购买指定商品' },
  { id: 'send', name: '帮送', description: '帮您送文件/物品' },
  { id: 'fetch', name: '帮取', description: '帮您取快递/物品' },
  { id: 'errand', name: '代办', description: '帮您代办各种事项' }
];

export const LEVELS = [
  { id: 'bronze', name: '青铜骑士', minOrders: 0, minRating: 0, commissionRate: 0.7, icon: '🥉' },
  { id: 'silver', name: '白银骑士', minOrders: 100, minRating: 4.5, commissionRate: 0.72, icon: '🥈' },
  { id: 'gold', name: '黄金骑士', minOrders: 500, minRating: 4.7, commissionRate: 0.75, icon: '🥇' },
  { id: 'platinum', name: '铂金骑士', minOrders: 1000, minRating: 4.8, commissionRate: 0.78, icon: '💎' },
  { id: 'diamond', name: '钻石骑士', minOrders: 1500, minRating: 4.9, commissionRate: 0.8, icon: '👑' }
];
