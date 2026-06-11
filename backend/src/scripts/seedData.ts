import { initDb, getDb } from '../db/database';
import { v4 as uuidv4 } from 'uuid';

const operators = [
  { id: 'op-001', name: '国网电动', contact_person: '张经理', contact_phone: '13800138001', share_ratio: 0.3 },
  { id: 'op-002', name: '特来电', contact_person: '李主管', contact_phone: '13800138002', share_ratio: 0.25 },
  { id: 'op-003', name: '星星充电', contact_person: '王总监', contact_phone: '13800138003', share_ratio: 0.28 },
  { id: 'op-004', name: '小桔充电', contact_person: '赵经理', contact_phone: '13800138004', share_ratio: 0.32 },
  { id: 'op-005', name: '云快充', contact_person: '陈总', contact_phone: '13800138005', share_ratio: 0.27 },
];

const cities = [
  { city: '北京', province: '北京', lat: 39.9042, lng: 116.4074 },
  { city: '上海', province: '上海', lat: 31.2304, lng: 121.4737 },
  { city: '广州', province: '广东', lat: 23.1291, lng: 113.2644 },
  { city: '深圳', province: '广东', lat: 22.5431, lng: 114.0579 },
  { city: '杭州', province: '浙江', lat: 30.2741, lng: 120.1551 },
  { city: '成都', province: '四川', lat: 30.5728, lng: 104.0668 },
  { city: '武汉', province: '湖北', lat: 30.5928, lng: 114.3055 },
  { city: '西安', province: '陕西', lat: 34.3416, lng: 108.9398 },
  { city: '南京', province: '江苏', lat: 32.0603, lng: 118.7969 },
  { city: '重庆', province: '重庆', lat: 29.5630, lng: 106.5516 },
];

const stationNames = [
  '朝阳公园充电站', '国贸地下充电站', '中关村产业园站', '望京SOHO站',
  '浦东机场充电站', '人民广场站', '虹桥高铁站', '陆家嘴金融中心站',
  '天河城充电站', '白云机场站', '珠江新城站', '深圳湾充电站',
  '南山科技园站', '福田中心站', '西湖文化广场站', '阿里巴巴园区站',
  '春熙路充电站', '天府软件园站', '光谷广场站', '西安咸阳机场站',
  '新街口充电站', '解放碑充电站', '观音桥站', '大悦城充电站',
];

function randomInRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number) {
  return Math.floor(randomInRange(min, max + 1));
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function seed() {
  initDb();
  const db = getDb();

  console.log('Seeding operators...');
  const insertOp = db.prepare(`
    INSERT OR REPLACE INTO operators (id, name, contact_person, contact_phone, share_ratio)
    VALUES (?, ?, ?, ?, ?)
  `);
  operators.forEach(op => insertOp.run(op.id, op.name, op.contact_person, op.contact_phone, op.share_ratio));

  console.log('Seeding stations and piles...');
  const insertStation = db.prepare(`
    INSERT OR REPLACE INTO charging_stations (id, name, address, city, province, latitude, longitude, operator_id, total_piles, available_piles, rating, review_count, payment_methods)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, ?)
  `);

  const insertPile = db.prepare(`
    INSERT OR REPLACE INTO charging_piles (id, station_id, pile_code, power_level, status, connector_type, current_power, total_energy, firmware_version)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)
  `);

  let stationIndex = 0;
  cities.forEach((cityInfo, cityIdx) => {
    const stationCount = randomInt(3, 6);
    for (let i = 0; i < stationCount && stationIndex < stationNames.length; i++) {
      const stationId = uuidv4();
      const op = randomPick(operators);
      const latOffset = randomInRange(-0.05, 0.05);
      const lngOffset = randomInRange(-0.05, 0.05);

      const payments = JSON.stringify(
        ['微信支付', '支付宝', '刷卡', '余额支付'].filter(() => Math.random() > 0.3)
      );

      insertStation.run(
        stationId,
        stationNames[stationIndex % stationNames.length] + ` (${cityInfo.city}${i + 1}号站)`,
        `${cityInfo.city}市${['朝阳', '海淀', '浦东', '天河', '南山'][cityIdx % 5]}区某某路${randomInt(1, 200)}号`,
        cityInfo.city,
        cityInfo.province,
        cityInfo.lat + latOffset,
        cityInfo.lng + lngOffset,
        op.id,
        payments
      );

      const pileCount = randomInt(4, 12);
      for (let j = 0; j < pileCount; j++) {
        const pileId = uuidv4();
        const powerLevels = [7, 22, 60, 120, 180, 240];
        const powerLevel = randomPick(powerLevels);
        const statuses: string[] = ['available', 'available', 'available', 'charging', 'charging', 'fault', 'offline'];
        const status = randomPick(statuses);
        const connectorTypes = ['CCS2', 'GB/T', 'CHAdeMO', 'Type 2'];

        insertPile.run(
          pileId,
          stationId,
          `PILE-${cityInfo.city.toUpperCase()}-${String(stationIndex).padStart(3, '0')}-${String(j + 1).padStart(2, '0')}`,
          powerLevel,
          status,
          randomPick(connectorTypes),
          randomInt(1000, 50000),
          'v2.3.1'
        );
      }

      stationIndex++;
    }
  });

  const stations = db.prepare('SELECT id FROM charging_stations').all() as { id: string }[];
  stations.forEach(s => {
    const result = db.prepare(`
      SELECT COUNT(*) as available FROM charging_piles WHERE station_id = ? AND status = 'available'
    `).get(s.id) as { available: number };

    const total = db.prepare(`
      SELECT COUNT(*) as total FROM charging_piles WHERE station_id = ?
    `).get(s.id) as { total: number };

    const avgRating = randomInRange(3.5, 5.0).toFixed(1);

    db.prepare(`
      UPDATE charging_stations SET total_piles = ?, available_piles = ?, rating = ?, review_count = ?
      WHERE id = ?
    `).run(total.total, result.available, parseFloat(avgRating), randomInt(10, 200), s.id);
  });

  console.log('Seeding users and vehicles...');
  const insertUser = db.prepare(`
    INSERT OR REPLACE INTO users (id, phone, nickname, balance)
    VALUES (?, ?, ?, ?)
  `);

  const insertVehicle = db.prepare(`
    INSERT OR REPLACE INTO vehicles (id, user_id, plate_number, brand, model, battery_capacity, current_soc, current_mileage, energy_consumption, fault_codes, is_default)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const carBrands = [
    { brand: '特斯拉', model: 'Model 3', battery: 60 },
    { brand: '比亚迪', model: '汉EV', battery: 76.9 },
    { brand: '蔚来', model: 'ES6', battery: 75 },
    { brand: '小鹏', model: 'P7', battery: 80.9 },
    { brand: '理想', model: 'L9', battery: 44.5 },
    { brand: '特斯拉', model: 'Model Y', battery: 78.4 },
    { brand: '比亚迪', model: '海豹', battery: 82.5 },
    { brand: '极氪', model: '001', battery: 100 },
    { brand: '问界', model: 'M5', battery: 40 },
    { brand: '埃安', model: 'S Plus', battery: 69.9 },
  ];

  const users: string[] = [];
  for (let i = 0; i < 50; i++) {
    const userId = uuidv4();
    const phone = `138${String(randomInt(10000000, 99999999))}`;
    insertUser.run(userId, phone, `用户${i + 1}`, randomInRange(50, 2000));
    users.push(userId);

    const vehicleCount = randomInt(1, 3);
    for (let v = 0; v < vehicleCount; v++) {
      const car = randomPick(carBrands);
      const plate = `京A${String.fromCharCode(65 + randomInt(0, 25))}${String(randomInt(10000, 99999))}`;
      const faultCodes = JSON.stringify(
        Math.random() > 0.7
          ? [{ code: `P${randomInt(100, 999)}`, desc: '电池温度传感器异常', level: 'warning' }]
          : []
      );

      insertVehicle.run(
        uuidv4(),
        userId,
        plate,
        car.brand,
        car.model,
        car.battery,
        randomInRange(10, 95),
        randomInRange(5000, 80000),
        randomInRange(12, 20),
        faultCodes,
        v === 0 ? 1 : 0
      );
    }
  }

  console.log('Seeding charging sessions...');
  const insertSession = db.prepare(`
    INSERT OR REPLACE INTO charging_sessions (id, user_id, pile_id, station_id, vehicle_id, start_time, end_time, start_soc, end_soc, energy_charged, amount, status, payment_method)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const allPiles = db.prepare('SELECT id, station_id FROM charging_piles').all() as { id: string; station_id: string }[];
  const allVehicles = db.prepare('SELECT id, user_id FROM vehicles').all() as { id: string; user_id: string }[];

  for (let i = 0; i < 200; i++) {
    const sessionId = uuidv4();
    const user = randomPick(users);
    const userVehicles = allVehicles.filter(v => v.user_id === user);
    const vehicle = userVehicles.length > 0 ? randomPick(userVehicles) : null;
    const pile = randomPick(allPiles);
    const energy = randomInRange(10, 80);
    const amount = energy * 1.5 + randomInRange(2, 10);

    const daysAgo = randomInt(0, 30);
    const hoursAgo = randomInt(0, 23);
    const startTime = new Date(Date.now() - daysAgo * 86400000 - hoursAgo * 3600000).toISOString();

    const isCompleted = Math.random() > 0.1;
    const duration = randomInt(20, 120);
    const endTime = isCompleted ? new Date(Date.now() - daysAgo * 86400000 - hoursAgo * 3600000 + duration * 60000).toISOString() : null;

    const statuses: string[] = ['completed', 'completed', 'completed', 'stopped', 'failed'];
    const status = isCompleted ? randomPick(statuses) : 'charging';

    insertSession.run(
      sessionId,
      user,
      pile.id,
      pile.station_id,
      vehicle?.id || null,
      startTime,
      endTime,
      randomInRange(10, 50),
      isCompleted ? randomInRange(50, 95) : null,
      energy,
      amount,
      status,
      randomPick(['wechat', 'alipay', 'balance', 'card'])
    );
  }

  console.log('Seeding settlements...');
  const insertSettlement = db.prepare(`
    INSERT OR REPLACE INTO settlements (id, session_id, station_id, operator_id, total_amount, platform_fee, operator_share, settle_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const completedSessions = db.prepare(`
    SELECT s.id, s.station_id, s.amount, st.operator_id, s.created_at
    FROM charging_sessions s
    JOIN charging_stations st ON s.station_id = st.id
    WHERE s.status != 'charging'
  `).all() as any[];

  completedSessions.forEach(session => {
    const platformFee = session.amount * 0.1;
    const operatorShare = session.amount - platformFee;

    insertSettlement.run(
      uuidv4(),
      session.id,
      session.station_id,
      session.operator_id,
      session.amount,
      platformFee,
      operatorShare,
      session.created_at
    );
  });

  console.log('Seeding reviews...');
  const insertReview = db.prepare(`
    INSERT OR REPLACE INTO reviews (id, user_id, station_id, session_id, rating, content, sentiment, sentiment_score, is_approved)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);

  const reviewContents = [
    '充电速度很快，位置也很好找，服务不错',
    '场站干净整洁，充电桩功率大，充满很快',
    '价格便宜，充电速度也可以，下次还来',
    '位置有点偏，不过充电价格很实惠',
    '排队的人有点多，等了半小时才充上',
    '充电桩有几个坏的，体验一般',
    '非常棒的充电站，推荐给大家',
    '服务态度很好，有问题能及时解决',
    '环境不错，充电过程很顺畅',
    '价格有点贵，但是速度确实快',
  ];

  for (let i = 0; i < 150; i++) {
    const session = randomPick(completedSessions);
    const rating = randomInRange(3, 5);
    const content = Math.random() > 0.3 ? randomPick(reviewContents) : null;

    let sentiment = 'neutral';
    let sentimentScore = 0.5;
    if (rating >= 4.5) {
      sentiment = 'positive';
      sentimentScore = randomInRange(0.7, 0.95);
    } else if (rating >= 3.5) {
      sentiment = 'positive';
      sentimentScore = randomInRange(0.55, 0.7);
    } else {
      sentiment = 'negative';
      sentimentScore = randomInRange(0.2, 0.4);
    }

    insertReview.run(
      uuidv4(),
      session.user_id,
      session.station_id,
      session.id,
      parseFloat(rating.toFixed(1)),
      content,
      sentiment,
      parseFloat(sentimentScore.toFixed(2))
    );
  }

  console.log('Seeding work orders...');
  const insertOrder = db.prepare(`
    INSERT OR REPLACE INTO work_orders (id, station_id, pile_id, type, priority, title, description, status, assignee)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const faultPiles = db.prepare(`
    SELECT p.id, p.station_id, p.pile_code
    FROM charging_piles p
    WHERE p.status = 'fault'
  `).all() as any[];

  const orderTypes = [
    { type: 'maintenance', title: '例行巡检', priority: 'low' },
    { type: 'cleaning', title: '场站清洁', priority: 'low' },
    { type: 'upgrade', title: '固件升级', priority: 'medium' },
  ];

  faultPiles.forEach(pile => {
    insertOrder.run(
      uuidv4(),
      pile.station_id,
      pile.id,
      'fault',
      'high',
      `故障维修 - ${pile.pile_code}`,
      '充电桩报故障，需要尽快维修处理',
      randomPick(['pending', 'assigned', 'in_progress']),
      Math.random() > 0.3 ? `维修工${randomInt(1, 10)}` : null
    );
  });

  const stationList = db.prepare('SELECT id FROM charging_stations LIMIT 20').all() as { id: string }[];
  for (let i = 0; i < 20; i++) {
    const orderInfo = randomPick(orderTypes);
    const station = randomPick(stationList);
    insertOrder.run(
      uuidv4(),
      station.id,
      null,
      orderInfo.type,
      orderInfo.priority,
      orderInfo.title,
      `定期${orderInfo.title}工作`,
      randomPick(['pending', 'assigned', 'completed']),
      Math.random() > 0.5 ? `巡检员${randomInt(1, 5)}` : null
    );
  }

  console.log('Seeding completed!');
  console.log(`Operators: ${operators.length}`);
  console.log(`Stations: ${stations.length}`);
  console.log(`Users: ${users.length}`);
  console.log(`Charging sessions: ${completedSessions.length}`);
}

seed();
