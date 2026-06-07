const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('./init');

function seedDB() {
  const db = getDB();
  const now = new Date().toISOString();

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) return;

  const insertUser = db.prepare(`
    INSERT INTO users (id, phone, password_hash, name, role, credit_score, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertCourierProfile = db.prepare(`
    INSERT INTO courier_profiles (id, user_id, real_name, id_number, id_card_photo, status, latitude, longitude, is_online, total_orders, completed_orders, avg_rating, fulfillment_rate, current_order_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertOrder = db.prepare(`
    INSERT INTO orders (id, order_no, type, requester_id, courier_id, priority, status, title, description,
      pickup_address, pickup_latitude, pickup_longitude, delivery_address, delivery_latitude, delivery_longitude,
      purchase_items, estimated_duration, deadline, fee, reward, require_photo, require_signature,
      assigned_at, accepted_at, arrived_at, started_at, completed_at, cancelled_at, cancel_reason, timeout_at,
      created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertServiceArea = db.prepare(`
    INSERT INTO service_areas (id, city, district, grid_code, center_latitude, center_longitude, heat_level, active_couriers, pending_orders, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertCreditRule = db.prepare(`
    INSERT INTO credit_rules (id, action, score_change, description, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertQualityRule = db.prepare(`
    INSERT INTO quality_rules (id, order_type, rule_name, rule_key, required, description, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertEnterprise = db.prepare(`
    INSERT INTO enterprise_clients (id, name, contact_name, contact_phone, api_key, api_secret, status, monthly_quota, used_quota, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertReview = db.prepare(`
    INSERT INTO reviews (id, order_id, from_user_id, to_user_id, rating, comment, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertNotification = db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, content, related_id, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const salt = bcrypt.genSaltSync(10);
  const adminHash = bcrypt.hashSync('admin123', salt);
  const userHash = bcrypt.hashSync('user123', salt);
  const courierHash = bcrypt.hashSync('courier123', salt);

  const adminId = uuidv4();
  insertUser.run(adminId, '13800000001', adminHash, '系统管理员', 'admin', 100, 'active', now, now);

  const requesterIds = [];
  for (let i = 0; i < 3; i++) {
    const id = uuidv4();
    requesterIds.push(id);
    insertUser.run(id, `1380000001${i}`, userHash, `用户${i + 1}`, 'requester', 100, 'active', now, now);
  }

  const courierData = [
    { name: '骑手张三', realName: '张三', idNum: '440305199001011234', lat: 22.5431, lng: 114.0579 },
    { name: '骑手李四', realName: '李四', idNum: '440304199202022345', lat: 22.5325, lng: 114.0338 },
    { name: '骑手王五', realName: '王五', idNum: '440303199303033456', lat: 22.5555, lng: 114.1001 },
    { name: '骑手赵六', realName: '赵六', idNum: '440306199404044567', lat: 22.5700, lng: 113.8800 },
    { name: '骑手钱七', realName: '钱七', idNum: '440307199505055678', lat: 22.7200, lng: 114.2500 },
  ];

  const courierIds = [];
  for (let i = 0; i < 5; i++) {
    const id = uuidv4();
    courierIds.push(id);
    insertUser.run(id, `1380000002${i}`, courierHash, courierData[i].name, 'courier', 100, 'active', now, now);
    insertCourierProfile.run(
      uuidv4(), id, courierData[i].realName, courierData[i].idNum, null,
      'approved', courierData[i].lat, courierData[i].lng,
      i < 3 ? 1 : 0,
      i === 0 ? 50 : i === 1 ? 30 : i === 2 ? 20 : 0,
      i === 0 ? 48 : i === 1 ? 28 : i === 2 ? 19 : 0,
      i === 0 ? 4.8 : i === 1 ? 4.9 : i === 2 ? 4.7 : 5.0,
      i === 0 ? 0.96 : i === 1 ? 0.93 : i === 2 ? 0.95 : 1.0,
      null, now, now
    );
  }

  const hr = 60 * 60 * 1000;
  const min = 60 * 1000;
  const deadline = new Date(Date.now() + hr).toISOString();
  const past = new Date(Date.now() - 2 * hr).toISOString();
  const completedAt = new Date(Date.now() - 30 * min).toISOString();
  const startedAt = new Date(Date.now() - 15 * min).toISOString();
  const acceptedAt = new Date(Date.now() - 20 * min).toISOString();
  const arrivedAt = new Date(Date.now() - 17 * min).toISOString();
  const assignedAt = new Date(Date.now() - 22 * min).toISOString();

  const orderRows = [
    {
      no: 'ORD2024060100001', type: 'pickup_delivery', rid: requesterIds[0], cid: null, pri: 0, st: 'pending',
      title: '取送文件', desc: '从南山科技园取文件送到福田CBD',
      pa: '南山区科技园', plat: 22.5431, plng: 114.0579,
      da: '福田区CBD', dlat: 22.5325, dlng: 114.0338,
      pi: null, dur: 60, dl: deadline, fee: 15.0, rw: 12.0, rp: 1, rs: 0,
      aa: null, ac: null, ar: null, sa: null, cla: null, clt: null, cr: null, to: null, cat: now
    },
    {
      no: 'ORD2024060100002', type: 'purchase', rid: requesterIds[0], cid: courierIds[0], pri: 1, st: 'dispatched',
      title: '代购药品', desc: '帮买感冒药',
      pa: '南山区海王药店', plat: 22.5400, plng: 114.0600,
      da: '南山区科技园公寓', dlat: 22.5431, dlng: 114.0579,
      pi: JSON.stringify([{ name: '感冒灵', quantity: 2 }]), dur: 45, dl: deadline, fee: 20.0, rw: 16.0, rp: 1, rs: 0,
      aa: assignedAt, ac: null, ar: null, sa: null, cla: null, clt: null, cr: null, to: null, cat: assignedAt
    },
    {
      no: 'ORD2024060100003', type: 'queue', rid: requesterIds[1], cid: courierIds[1], pri: 0, st: 'accepted',
      title: '排队代取', desc: '帮忙排队取号',
      pa: '福田区招商银行', plat: 22.5325, plng: 114.0338,
      da: null, dlat: null, dlng: null,
      pi: null, dur: 90, dl: deadline, fee: 30.0, rw: 25.0, rp: 1, rs: 0,
      aa: assignedAt, ac: acceptedAt, ar: null, sa: null, cla: null, clt: null, cr: null, to: null, cat: assignedAt
    },
    {
      no: 'ORD2024060100004', type: 'allpurpose', rid: requesterIds[1], cid: courierIds[2], pri: 2, st: 'in_progress',
      title: '紧急送钥匙', desc: '忘带钥匙了，需要紧急送一把',
      pa: '罗湖区火车站附近', plat: 22.5555, plng: 114.1001,
      da: '罗湖区某小区', dlat: 22.5500, dlng: 114.1100,
      pi: null, dur: 30, dl: deadline, fee: 25.0, rw: 20.0, rp: 0, rs: 1,
      aa: assignedAt, ac: acceptedAt, ar: arrivedAt, sa: startedAt, cla: null, clt: null, cr: null, to: null, cat: assignedAt
    },
    {
      no: 'ORD2024060100005', type: 'pickup_delivery', rid: requesterIds[2], cid: courierIds[0], pri: 0, st: 'completed',
      title: '送蛋糕', desc: '生日蛋糕同城配送',
      pa: '南山区蛋糕店', plat: 22.5380, plng: 114.0550,
      da: '南山区某小区', dlat: 22.5450, dlng: 114.0600,
      pi: null, dur: 40, dl: past, fee: 18.0, rw: 15.0, rp: 1, rs: 1,
      aa: past, ac: past, ar: past, sa: past, cla: completedAt, clt: null, cr: null, to: null, cat: past
    },
    {
      no: 'ORD2024060100006', type: 'purchase', rid: requesterIds[2], cid: courierIds[3], pri: 0, st: 'cancelled',
      title: '代购午餐', desc: '帮买麦当劳套餐',
      pa: '宝安区麦当劳', plat: 22.5700, plng: 113.8800,
      da: '宝安区某写字楼', dlat: 22.5680, dlng: 113.8850,
      pi: JSON.stringify([{ name: '巨无霸套餐', quantity: 2 }]), dur: 35, dl: past, fee: 12.0, rw: 10.0, rp: 0, rs: 0,
      aa: past, ac: past, ar: null, sa: null, cla: null, clt: completedAt, cr: '不需要了', to: null, cat: past
    },
  ];

  const orderIds = [];
  for (const o of orderRows) {
    const id = uuidv4();
    orderIds.push(id);
    insertOrder.run(
      id, o.no, o.type, o.rid, o.cid, o.pri, o.st, o.title, o.desc,
      o.pa, o.plat, o.plng, o.da, o.dlat, o.dlng, o.pi, o.dur, o.dl,
      o.fee, o.rw, o.rp, o.rs, o.aa, o.ac, o.ar, o.sa, o.cla, o.clt, o.cr,
      o.to, o.cat, now
    );
  }

  const areas = [
    { district: '南山区', grid: 'NS001', lat: 22.5431, lng: 114.0579, heat: 3, couriers: 2, pending: 1 },
    { district: '福田区', grid: 'FT001', lat: 22.5325, lng: 114.0338, heat: 4, couriers: 1, pending: 2 },
    { district: '罗湖区', grid: 'LH001', lat: 22.5555, lng: 114.1001, heat: 2, couriers: 1, pending: 1 },
    { district: '宝安区', grid: 'BA001', lat: 22.5700, lng: 113.8800, heat: 1, couriers: 0, pending: 0 },
    { district: '龙岗区', grid: 'LG001', lat: 22.7200, lng: 114.2500, heat: 1, couriers: 1, pending: 0 },
  ];
  for (const a of areas) {
    insertServiceArea.run(uuidv4(), '深圳', a.district, a.grid, a.lat, a.lng, a.heat, a.couriers, a.pending, now, now);
  }

  const creditRules = [
    { action: 'complete_order', change: 2, desc: '完成订单' },
    { action: 'cancel_order', change: -5, desc: '取消订单' },
    { action: 'timeout', change: -10, desc: '超时未完成' },
    { action: 'good_review', change: 1, desc: '获得好评' },
    { action: 'bad_review', change: -3, desc: '获得差评' },
  ];
  for (const r of creditRules) {
    insertCreditRule.run(uuidv4(), r.action, r.change, r.desc, now);
  }

  const qualityRules = [
    { type: 'pickup_delivery', name: '取送拍照', key: 'photo_required', required: 1, desc: '取送类订单必须拍照确认' },
    { type: 'queue', name: '排队拍照', key: 'photo_required', required: 1, desc: '排队类订单必须拍照确认' },
    { type: 'purchase', name: '代购拍照', key: 'photo_required', required: 1, desc: '代购类订单必须拍照确认' },
    { type: 'allpurpose', name: '企业签收', key: 'signature_required', required: 1, desc: '企业订单需要签收确认' },
    { type: 'pickup_delivery', name: '企业签收', key: 'signature_required', required: 1, desc: '企业取送订单需要签收' },
  ];
  for (const r of qualityRules) {
    insertQualityRule.run(uuidv4(), r.type, r.name, r.key, r.required, r.desc, now, now);
  }

  insertEnterprise.run(
    uuidv4(), '深圳速达科技', '陈经理', '13900001111',
    'ent_test_key_001', 'ent_test_secret_001', 'active', 1000, 15, now, now
  );

  insertReview.run(uuidv4(), orderIds[4], requesterIds[2], courierIds[0], 5, '配送很快，蛋糕完好无损！', completedAt);
  insertReview.run(uuidv4(), orderIds[4], courierIds[0], requesterIds[2], 5, '客户很友好', completedAt);

  insertNotification.run(uuidv4(), requesterIds[2], 'order_cancelled', '订单已取消', `您的订单 ${orderRows[5].no} 已被取消`, orderIds[5], 1, completedAt);
  insertNotification.run(uuidv4(), courierIds[0], 'order_completed', '订单已完成', `您的订单 ${orderRows[4].no} 已完成，获得好评`, orderIds[4], 1, completedAt);
  insertNotification.run(uuidv4(), courierIds[1], 'order_new', '新订单通知', '您有新的待接订单', orderIds[2], 0, now);
  insertNotification.run(uuidv4(), requesterIds[0], 'order_dispatched', '骑手已派单', `您的订单 ${orderRows[1].no} 已派单`, orderIds[1], 0, now);

  console.log('Seed data inserted successfully');
}

module.exports = { seedDB };
