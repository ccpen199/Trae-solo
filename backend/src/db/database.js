const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const dayjs = require('dayjs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS platforms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      logo TEXT,
      base_price REAL DEFAULT 0,
      per_km_price REAL DEFAULT 0,
      per_kg_price REAL DEFAULT 0,
      min_delivery_time INTEGER DEFAULT 30,
      max_delivery_time INTEGER DEFAULT 120,
      capacity_saturation REAL DEFAULT 0.5,
      on_time_rate REAL DEFAULT 0.95,
      loss_rate REAL DEFAULT 0.01,
      complaint_rate REAL DEFAULT 0.02,
      status TEXT DEFAULT 'active',
      commission_rate REAL DEFAULT 0.05,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS merchants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact_name TEXT,
      contact_phone TEXT,
      address TEXT,
      latitude REAL,
      longitude REAL,
      balance REAL DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      merchant_id INTEGER NOT NULL,
      sender_name TEXT,
      sender_phone TEXT,
      sender_address TEXT NOT NULL,
      sender_lat REAL,
      sender_lng REAL,
      receiver_name TEXT NOT NULL,
      receiver_phone TEXT NOT NULL,
      receiver_address TEXT NOT NULL,
      receiver_lat REAL,
      receiver_lng REAL,
      goods_name TEXT,
      goods_weight REAL DEFAULT 0,
      goods_value REAL DEFAULT 0,
      distance REAL DEFAULT 0,
      expected_delivery_time INTEGER,
      urgency TEXT DEFAULT 'normal',
      total_fee REAL DEFAULT 0,
      platform_fee REAL DEFAULT 0,
      platform_id INTEGER,
      platform_order_no TEXT,
      status TEXT DEFAULT 'pending',
      delivery_status TEXT DEFAULT 'pending',
      rider_name TEXT,
      rider_phone TEXT,
      estimated_arrival_time DATETIME,
      picked_up_at DATETIME,
      delivered_at DATETIME,
      cancel_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (merchant_id) REFERENCES merchants(id),
      FOREIGN KEY (platform_id) REFERENCES platforms(id)
    );

    CREATE TABLE IF NOT EXISTS order_tracks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      description TEXT,
      location TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS after_sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      reason TEXT,
      new_address TEXT,
      new_lat REAL,
      new_lng REAL,
      status TEXT DEFAULT 'processing',
      platform_ack BOOLEAN DEFAULT 0,
      result TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS compensations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      merchant_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      amount REAL DEFAULT 0,
      coupon_code TEXT,
      reason TEXT,
      status TEXT DEFAULT 'pending',
      review_result TEXT,
      reviewed_by TEXT,
      reviewed_at DATETIME,
      triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      coupon_verified INTEGER DEFAULT 0,
      coupon_sent_at DATETIME,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (merchant_id) REFERENCES merchants(id)
    );

    CREATE TABLE IF NOT EXISTS settlements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      settlement_no TEXT UNIQUE NOT NULL,
      merchant_id INTEGER NOT NULL,
      platform_id INTEGER NOT NULL,
      period TEXT NOT NULL,
      total_orders INTEGER DEFAULT 0,
      total_amount REAL DEFAULT 0,
      commission_amount REAL DEFAULT 0,
      settlement_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (merchant_id) REFERENCES merchants(id),
      FOREIGN KEY (platform_id) REFERENCES platforms(id)
    );

    CREATE TABLE IF NOT EXISTS settlement_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      settlement_id INTEGER NOT NULL,
      order_id INTEGER NOT NULL,
      order_amount REAL DEFAULT 0,
      commission_amount REAL DEFAULT 0,
      FOREIGN KEY (settlement_id) REFERENCES settlements(id),
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );
  `);

  try {
    db.prepare('ALTER TABLE compensations ADD COLUMN review_result TEXT').run();
  } catch (e) {}
  try {
    db.prepare('ALTER TABLE compensations ADD COLUMN reviewed_at DATETIME').run();
  } catch (e) {}
  try {
    db.prepare('ALTER TABLE compensations ADD COLUMN coupon_verified BOOLEAN DEFAULT 0').run();
  } catch (e) {}
  try {
    db.prepare('ALTER TABLE compensations ADD COLUMN coupon_sent_at DATETIME').run();
  } catch (e) {}
  try {
    db.prepare('ALTER TABLE after_sales ADD COLUMN change_fee REAL DEFAULT 0').run();
  } catch (e) {}
  try {
    db.prepare('ALTER TABLE after_sales ADD COLUMN fee_confirmed BOOLEAN DEFAULT 0').run();
  } catch (e) {}
  try {
    db.prepare('ALTER TABLE after_sales ADD COLUMN disposal_result TEXT').run();
  } catch (e) {}
  try {
    db.prepare('ALTER TABLE after_sales ADD COLUMN disposed_at DATETIME').run();
  } catch (e) {}
  try {
    db.prepare('ALTER TABLE settlements ADD COLUMN has_exception BOOLEAN DEFAULT 0').run();
  } catch (e) {}
  try {
    db.prepare('ALTER TABLE settlements ADD COLUMN exception_count INTEGER DEFAULT 0').run();
  } catch (e) {}
  try {
    db.prepare('ALTER TABLE settlements ADD COLUMN exception_amount REAL DEFAULT 0').run();
  } catch (e) {}
  try {
    db.prepare('ALTER TABLE orders ADD COLUMN route_reason TEXT').run();
  } catch (e) {}
  try {
    db.prepare('ALTER TABLE orders ADD COLUMN route_score_detail TEXT').run();
  } catch (e) {}
  try {
    db.prepare('ALTER TABLE orders ADD COLUMN route_distance REAL').run();
  } catch (e) {}
  try {
    db.prepare('ALTER TABLE orders ADD COLUMN route_weight REAL').run();
  } catch (e) {}
  try {
    db.prepare('ALTER TABLE orders ADD COLUMN route_urgency TEXT').run();
  } catch (e) {}
  try {
    db.prepare('ALTER TABLE orders ADD COLUMN route_selected_by TEXT DEFAULT \'auto\'').run();
  } catch (e) {}
  try {
    db.prepare('ALTER TABLE orders ADD COLUMN route_composite_score REAL').run();
  } catch (e) {}
  try {
    db.prepare('ALTER TABLE settlements ADD COLUMN reconciled_by TEXT').run();
  } catch (e) {}
  try {
    db.prepare('ALTER TABLE settlements ADD COLUMN reconciled_at DATETIME').run();
  } catch (e) {}
  try {
    db.prepare('ALTER TABLE settlements ADD COLUMN diff_type TEXT').run();
  } catch (e) {}
  try {
    db.prepare('ALTER TABLE settlements ADD COLUMN diff_amount REAL DEFAULT 0').run();
  } catch (e) {}
  try {
    db.prepare('ALTER TABLE settlements ADD COLUMN diff_remark TEXT').run();
  } catch (e) {}
  try {
    db.prepare('ALTER TABLE settlements ADD COLUMN is_matched BOOLEAN DEFAULT 0').run();
  } catch (e) {}

  const platformCount = db.prepare('SELECT COUNT(*) as count FROM platforms').get().count;
  if (platformCount === 0) {
    const insertPlatform = db.prepare(`
      INSERT INTO platforms (code, name, logo, base_price, per_km_price, per_kg_price,
        min_delivery_time, max_delivery_time, capacity_saturation, on_time_rate, loss_rate,
        complaint_rate, commission_rate, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const platforms = [
      ['dada', '达达快送', '🚴', 8, 2.5, 0.5, 30, 90, 0.6, 0.96, 0.008, 0.015, 0.05, 'active'],
      ['sf-city', '顺丰同城', '📦', 12, 3, 0.8, 25, 60, 0.4, 0.98, 0.005, 0.01, 0.06, 'active'],
      ['shansong', '闪送', '⚡', 10, 3.5, 1, 20, 45, 0.3, 0.97, 0.006, 0.012, 0.07, 'active'],
      ['meituan', '美团众包', '🍔', 7, 2.2, 0.4, 35, 120, 0.7, 0.93, 0.012, 0.025, 0.045, 'active'],
      ['eleme', '蜂鸟即配', '🐦', 7.5, 2.3, 0.45, 30, 100, 0.65, 0.94, 0.01, 0.022, 0.048, 'active'],
      ['uu', 'UU跑腿', '🏃', 9, 2.8, 0.6, 25, 80, 0.5, 0.95, 0.009, 0.018, 0.055, 'active'],
      ['fengniao', '点我达', '🎯', 8.5, 2.6, 0.5, 30, 90, 0.55, 0.94, 0.011, 0.02, 0.052, 'active'],
      ['jitu', '极兔速递', '🐰', 6, 2, 0.3, 45, 180, 0.45, 0.91, 0.015, 0.03, 0.04, 'active'],
      ['jingdong', '京东到家', '🛒', 11, 2.9, 0.7, 25, 60, 0.35, 0.97, 0.007, 0.013, 0.065, 'active'],
      ['suning', '苏宁秒达', '⏱️', 9.5, 2.7, 0.55, 30, 75, 0.4, 0.95, 0.008, 0.016, 0.058, 'active'],
      ['baishi', '百世闪送', '💨', 7, 2.1, 0.35, 40, 150, 0.6, 0.92, 0.013, 0.028, 0.042, 'active'],
      ['deppon', '德邦快递', '🚚', 15, 4, 1.5, 40, 120, 0.25, 0.98, 0.004, 0.008, 0.08, 'active'],
    ];

    for (const p of platforms) {
      insertPlatform.run(...p);
    }
  }

  const merchantCount = db.prepare('SELECT COUNT(*) as count FROM merchants').get().count;
  if (merchantCount === 0) {
    const insertMerchant = db.prepare(`
      INSERT INTO merchants (name, contact_name, contact_phone, address, latitude, longitude, balance)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertMerchant.run('美味鲜花店', '张经理', '13800138001', '北京市朝阳区建国路88号', 39.9087, 116.4572, 5000);
    insertMerchant.run('鲜果时光', '李老板', '13800138002', '北京市海淀区中关村大街1号', 39.9847, 116.3056, 3200);
  }

  try {
    const nullOrders = db.prepare("SELECT id FROM orders WHERE created_at IS NULL").all();
    if (nullOrders.length > 0) {
      const stmt = db.prepare("UPDATE orders SET created_at = ? WHERE id = ?");
      const now = dayjs();
      let count = 0;
      nullOrders.forEach((r, idx) => {
        const t = now.subtract(5 + r.id * 12, 'minute').format('YYYY-MM-DD HH:mm:ss');
        const info = stmt.run(t, r.id);
        count += info.changes;
      });
      db.pragma('wal_checkpoint(TRUNCATE)');
      console.log(`✅ 自动填充 ${count} 条订单的 created_at 字段`);
      const verify = db.prepare("SELECT id, created_at FROM orders WHERE created_at IS NULL").all();
      if (verify.length > 0) {
        console.log('⚠️  仍有 NULL 的 created_at:', verify);
      }
    }
  } catch (e) {
    console.log('created_at migration skip:', e.message)
  }

  try {
    db.pragma('wal_checkpoint(TRUNCATE)');
  } catch (e) {}

  const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
  if (orderCount === 0) {
    const insertOrder = db.prepare(`
      INSERT INTO orders (order_no, merchant_id, sender_name, sender_phone, sender_address,
        sender_lat, sender_lng, receiver_name, receiver_phone, receiver_address,
        receiver_lat, receiver_lng, goods_name, goods_weight, goods_value, distance,
        expected_delivery_time, urgency, total_fee, platform_fee, platform_id,
        platform_order_no, status, delivery_status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = dayjs();
    const sampleOrders = [
      ['DD202401150001', 1, '张经理', '13800138001', '北京市朝阳区建国路88号', 39.9087, 116.4572,
        '王女士', '13900139001', '北京市东城区王府井大街138号', 39.9147, 116.4107,
        '玫瑰花束', 0.5, 299, 5.2, 45, 'normal', 28, 26.6, 1, 'DADA20240115001',
        'assigned', 'delivering', now.subtract(15, 'minute').format('YYYY-MM-DD HH:mm:ss')],
      ['DD202401150002', 1, '张经理', '13800138001', '北京市朝阳区建国路88号', 39.9087, 116.4572,
        '李先生', '13900139002', '北京市西城区西单北大街120号', 39.9128, 116.3763,
        '生日蛋糕', 1.2, 198, 8.5, 60, 'urgent', 42, 39.5, 2, 'SF20240115002',
        'assigned', 'picked', now.subtract(45, 'minute').format('YYYY-MM-DD HH:mm:ss')],
      ['DD202401150003', 2, '李老板', '13800138002', '北京市海淀区中关村大街1号', 39.9847, 116.3056,
        '赵先生', '13900139003', '北京市西城区金融街7号', 39.9145, 116.3627,
        '水果礼盒', 3, 158, 12.3, 90, 'normal', 38, 36.2, 4, 'MT20240115003',
        'pending', 'pending', now.subtract(80, 'minute').format('YYYY-MM-DD HH:mm:ss')],
      ['DD202401150004', 1, '张经理', '13800138001', '北京市朝阳区建国路88号', 39.9087, 116.4572,
        '陈女士', '13900139004', '北京市丰台区丰台路1号', 39.8639, 116.2869,
        '文件资料', 0.3, 50, 18.6, 120, 'normal', 52, 49.4, 3, 'SS20240115004',
        'assigned', 'delivered', now.subtract(180, 'minute').format('YYYY-MM-DD HH:mm:ss')],
      ['DD202401150005', 2, '李老板', '13800138002', '北京市海淀区中关村大街1号', 39.9847, 116.3056,
        '周先生', '13900139005', '北京市朝阳区三里屯路19号', 39.9367, 116.4556,
        '进口水果', 2.5, 268, 10.1, 75, 'urgent', 45, 42.8, 3, 'SS20240115005',
        'assigned', 'delivering', now.subtract(60, 'minute').format('YYYY-MM-DD HH:mm:ss')],
    ];

    for (const o of sampleOrders) {
      insertOrder.run(...o);
    }

    const insertTrack = db.prepare(`
      INSERT INTO order_tracks (order_id, status, description, location)
      VALUES (?, ?, ?, ?)
    `);

    const tracks = [
      [1, 'pending', '订单已创建，等待分配', '北京市朝阳区建国路88号'],
      [1, 'assigned', '已分配达达快送骑手', '北京市朝阳区建国路88号'],
      [1, 'picked', '骑手已取货', '北京市朝阳区建国路88号'],
      [1, 'delivering', '配送中', '北京市朝阳区'],
      [2, 'pending', '订单已创建，等待分配', '北京市朝阳区建国路88号'],
      [2, 'assigned', '已分配顺丰同城骑手', '北京市朝阳区建国路88号'],
      [2, 'picked', '骑手已取货，正在配送', '北京市朝阳区建国路88号'],
      [4, 'pending', '订单已创建，等待分配', '北京市朝阳区建国路88号'],
      [4, 'assigned', '已分配闪送骑手', '北京市朝阳区建国路88号'],
      [4, 'picked', '骑手已取货', '北京市朝阳区建国路88号'],
      [4, 'delivering', '配送中', '北京市朝阳区'],
      [4, 'delivered', '已送达', '北京市丰台区丰台路1号'],
      [5, 'pending', '订单已创建，等待分配', '北京市海淀区中关村大街1号'],
      [5, 'assigned', '已分配闪送骑手', '北京市海淀区中关村大街1号'],
      [5, 'picked', '骑手已取货', '北京市海淀区中关村大街1号'],
      [5, 'delivering', '配送中', '北京市海淀区'],
    ];

    for (const t of tracks) {
      insertTrack.run(...t);
    }
  }

  ensureDemoWorkflowData();

  console.log('Database initialized successfully');
}

function ensureDemoWorkflowData() {
  const sampleOrders = db.prepare('SELECT COUNT(*) as count FROM orders WHERE id BETWEEN 1 AND 5').get().count;
  if (sampleOrders >= 5) {
    const snapshots = [
      {
        id: 1,
        status: 'assigned',
        deliveryStatus: 'delivering',
        etaOffset: '+22 minutes',
        pickedOffset: '-18 minutes',
        riderName: '刘师傅',
        riderPhone: '13810001001'
      },
      {
        id: 2,
        status: 'assigned',
        deliveryStatus: 'picked',
        etaOffset: '+8 minutes',
        pickedOffset: '-12 minutes',
        riderName: '陈师傅',
        riderPhone: '13810001002'
      },
      {
        id: 3,
        status: 'pending',
        deliveryStatus: 'pending',
        etaOffset: '+45 minutes',
        pickedOffset: null,
        riderName: null,
        riderPhone: null
      },
      {
        id: 4,
        status: 'assigned',
        deliveryStatus: 'delivered',
        etaOffset: '-90 minutes',
        pickedOffset: '-160 minutes',
        deliveredOffset: '-95 minutes',
        riderName: '王师傅',
        riderPhone: '13810001004'
      },
      {
        id: 5,
        status: 'assigned',
        deliveryStatus: 'delivering',
        etaOffset: '-12 minutes',
        pickedOffset: '-55 minutes',
        riderName: '赵师傅',
        riderPhone: '13810001005'
      }
    ];

    for (const item of snapshots) {
      const hours = 8 + item.id;
      const minutes = (item.id * 17) % 60;
      const now = dayjs();
      const createTime = now.startOf('day').add(hours, 'hour').add(minutes, 'minute').format('YYYY-MM-DD HH:mm:ss');
      const etaTime = item.etaOffset ? now.add(parseInt(item.etaOffset), 'minute').format('YYYY-MM-DD HH:mm:ss') : null;
      const pickedTime = item.pickedOffset ? now.add(parseInt(item.pickedOffset), 'minute').format('YYYY-MM-DD HH:mm:ss') : null;
      const deliveredTime = item.deliveredOffset ? now.add(parseInt(item.deliveredOffset), 'minute').format('YYYY-MM-DD HH:mm:ss') : null;
      const updateTime = now.format('YYYY-MM-DD HH:mm:ss');
      db.prepare(`
        UPDATE orders
        SET status = ?,
            delivery_status = ?,
            created_at = ?,
            estimated_arrival_time = ?,
            picked_up_at = CASE WHEN ? IS NULL THEN picked_up_at ELSE ? END,
            delivered_at = CASE WHEN ? IS NULL THEN delivered_at ELSE ? END,
            rider_name = ?,
            rider_phone = ?,
            updated_at = ?
        WHERE id = ?
      `).run(
        item.status,
        item.deliveryStatus,
        createTime,
        etaTime,
        item.pickedOffset ? 1 : null, pickedTime,
        item.deliveredOffset ? 1 : null, deliveredTime,
        item.riderName,
        item.riderPhone,
        updateTime,
        item.id
      );
    }
  }

  const afterSalesCount = db.prepare('SELECT COUNT(*) as count FROM after_sales').get().count;
  if (afterSalesCount === 0) {
    const now = dayjs();
    db.prepare(`
      INSERT INTO after_sales (order_id, type, reason, status, platform_ack, result, disposal_result, disposed_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(5, 'complaint', '配送已超过预计送达时间，商户要求平台说明并触发SLA复核', 'accepted', 1, '平台已受理，预计30分钟内给出处置结果', '骑手已致歉并补偿，商户满意', now.subtract(5, 'minute').format('YYYY-MM-DD HH:mm:ss'), now.subtract(10, 'minute').format('YYYY-MM-DD HH:mm:ss'));

    db.prepare(`
      INSERT INTO after_sales (order_id, type, reason, new_address, status, platform_ack, result, change_fee, fee_confirmed, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(2, 'address_change', '客户临时改到同小区北门', '北京市西城区西单北大街120号北门', 'processing', 0, '等待承运平台确认改址费用', 3.5, 0, now.subtract(4, 'minute').format('YYYY-MM-DD HH:mm:ss'));
  }

  const compensationCount = db.prepare('SELECT COUNT(*) as count FROM compensations').get().count;
  if (compensationCount === 0) {
    const now = dayjs();
    const insertCompensation = db.prepare(`
      INSERT INTO compensations (order_id, merchant_id, type, amount, coupon_code, reason, status, review_result, reviewed_by, reviewed_at, triggered_at, coupon_verified, coupon_sent_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertCompensation.run(
      5,
      2,
      'timeout',
      13.5,
      'CPFAST1505',
      '预计送达已超时12分钟，自动触发SLA补偿券',
      'issued',
      '系统自动超时赔付',
      '系统自动',
      now.subtract(8, 'minute').format('YYYY-MM-DD HH:mm:ss'),
      now.subtract(10, 'minute').format('YYYY-MM-DD HH:mm:ss'),
      1,
      now.subtract(6, 'minute').format('YYYY-MM-DD HH:mm:ss')
    );
    insertCompensation.run(
      4,
      1,
      'complaint',
      10,
      'CPREVIEW04',
      '客户投诉骑手未提前电话联系，复核后确认补偿',
      'reviewed',
      '复核通过，补偿券已发放给商户账户',
      '运营-张主管',
      now.subtract(25, 'minute').format('YYYY-MM-DD HH:mm:ss'),
      now.subtract(40, 'minute').format('YYYY-MM-DD HH:mm:ss'),
      1,
      now.subtract(30, 'minute').format('YYYY-MM-DD HH:mm:ss')
    );
    insertCompensation.run(
      2,
      1,
      'loss',
      18,
      'CPPENDING02',
      '蛋糕外包装破损，等待运营复核后发放',
      'review_pending',
      null,
      null,
      null,
      now.subtract(3, 'minute').format('YYYY-MM-DD HH:mm:ss'),
      0,
      null
    );
  }

  const settlementCount = db.prepare('SELECT COUNT(*) as count FROM settlements').get().count;
  if (settlementCount === 0) {
    const period = dayjs().format('YYYY-MM');
    const now = dayjs();
    const insertSettlement = db.prepare(`
      INSERT INTO settlements (settlement_no, merchant_id, platform_id, period, total_orders, total_amount, commission_amount, settlement_amount, status, has_exception, exception_count, exception_amount, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const platformSettlements = [
      [1, 8, 15, 2580.5, 129.03, 2451.47, 'pending', 0, 0, 0, 3],
      [1, 1, 12, 1856.0, 92.80, 1763.20, 'reconciled', 0, 0, 0, 5],
      [1, 3, 23, 3850.75, 269.55, 3581.20, 'pending', 1, 3, 42.50, 2],
      [2, 2, 18, 2940.0, 176.40, 2763.60, 'paid', 0, 0, 0, 10],
      [2, 4, 9, 1260.5, 56.72, 1203.78, 'pending', 1, 1, 15.00, 1],
    ];

    platformSettlements.forEach((s, idx) => {
      insertSettlement.run(
        `JS${period.replace('-', '')}${String(idx + 1).padStart(4, '0')}`,
        s[0],
        s[1],
        period,
        s[2],
        s[3],
        s[4],
        s[5],
        s[6],
        s[7],
        s[8],
        s[9],
        now.subtract(s[10], 'day').format('YYYY-MM-DD HH:mm:ss')
      );
    });
  }

  const ensureTrack = (orderId, status, description, location = null) => {
    const exists = db.prepare(`
      SELECT COUNT(*) as count FROM order_tracks
      WHERE order_id = ? AND status = ? AND description = ?
    `).get(orderId, status, description).count;

    if (!exists) {
      db.prepare(`
        INSERT INTO order_tracks (order_id, status, description, location, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(orderId, status, description, location, dayjs().format('YYYY-MM-DD HH:mm:ss'));
    }
  };

  ensureTrack(5, 'sla_warning', '预计送达已超时，系统已推送SLA赔付复核', '北京市朝阳区三里屯路19号');
  ensureTrack(2, 'address_change', '客户提交改址申请，等待承运平台确认费用', '北京市西城区西单北大街120号北门');

  const ensureRoute = (orderId, reason, scoreDetail, distance, weight, urgency, selectedBy, compositeScore) => {
    const row = db.prepare(`SELECT route_reason FROM orders WHERE id = ?`).get(orderId);
    if (row && !row.route_reason) {
      db.prepare(`
        UPDATE orders SET route_reason = ?, route_score_detail = ?, route_distance = ?, route_weight = ?,
          route_urgency = ?, route_selected_by = ?, route_composite_score = ?
        WHERE id = ?
      `).run(reason, JSON.stringify(scoreDetail), distance, weight, urgency, selectedBy, compositeScore, orderId);
    }
  };

  ensureRoute(1,
    '达达快送在5km距离0.5kg场景下费用最低，运力适中，推荐性价比方案',
    { price_score: 0.88, time_score: 0.72, quality_score: 0.89, saturation_score: 0.75 },
    5.2, 0.5, 'normal', 'auto', 81.5);
  ensureRoute(2,
    '顺丰同城时效最快，1.2kg蛋糕配送优先考虑准时率，综合评分最优',
    { price_score: 0.65, time_score: 0.95, quality_score: 0.97, saturation_score: 0.88 },
    8.5, 1.2, 'urgent', 'auto', 86.3);
  ensureRoute(3,
    '美团众包在经济场景下运力充足，12km远距离配送费用占优',
    { price_score: 0.86, time_score: 0.62, quality_score: 0.79, saturation_score: 0.82 },
    12.3, 3, 'normal', 'auto', 77.1);
  ensureRoute(4,
    '闪送一对一专人专送，文件资料安全性优先，历史履约率97%',
    { price_score: 0.70, time_score: 0.88, quality_score: 0.96, saturation_score: 0.92 },
    18.6, 0.3, 'normal', 'auto', 84.8);
  ensureRoute(5,
    '闪送加急场景时效稳定，2.5kg进口水果综合评分最优',
    { price_score: 0.72, time_score: 0.92, quality_score: 0.95, saturation_score: 0.90 },
    10.1, 2.5, 'urgent', 'auto', 85.4);
}

initDatabase();

module.exports = db;
