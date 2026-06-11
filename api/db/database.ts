import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import type {
  Order,
  Rider,
  OrderEvent,
  CreditRecord,
  Compensation,
  Waybill,
  PricingRule,
  OrderStatus,
  RiderStatus,
  CreditReasonType,
  CompensationType,
  CompensationStatus,
  WaybillStatus,
} from '../../shared/types';

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'delivery.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function createTables(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS riders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('online', 'offline', 'busy')),
      credit_score INTEGER NOT NULL,
      credit_level TEXT NOT NULL,
      current_lat REAL NOT NULL,
      current_lng REAL NOT NULL,
      on_time_rate REAL NOT NULL,
      complaint_rate REAL NOT NULL,
      equipment_compliant INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_no TEXT NOT NULL UNIQUE,
      merchant_id TEXT NOT NULL,
      rider_id TEXT,
      status TEXT NOT NULL CHECK(status IN ('pending', 'assigned', 'picked', 'delivered', 'completed', 'cancelled', 'exception')),
      pickup_address TEXT NOT NULL,
      pickup_lat REAL NOT NULL,
      pickup_lng REAL NOT NULL,
      delivery_address TEXT NOT NULL,
      delivery_lat REAL NOT NULL,
      delivery_lng REAL NOT NULL,
      goods_type TEXT NOT NULL,
      goods_weight REAL NOT NULL,
      distance_km REAL NOT NULL,
      estimated_price REAL NOT NULL,
      actual_price REAL,
      estimated_delivery_time TEXT NOT NULL,
      actual_delivery_time TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      exception_type TEXT,
      is_abnormal INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (rider_id) REFERENCES riders(id)
    );

    CREATE TABLE IF NOT EXISTS order_events (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      event_data TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS credit_records (
      id TEXT PRIMARY KEY,
      rider_id TEXT NOT NULL,
      score_change INTEGER NOT NULL,
      reason TEXT NOT NULL,
      reason_type TEXT NOT NULL CHECK(reason_type IN ('on_time', 'complaint', 'equipment')),
      created_at TEXT NOT NULL,
      FOREIGN KEY (rider_id) REFERENCES riders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS compensations (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      rider_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('timeout', 'lost', 'damaged')),
      amount REAL NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected')),
      coupon_id TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (rider_id) REFERENCES riders(id)
    );

    CREATE TABLE IF NOT EXISTS waybills (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      waybill_no TEXT NOT NULL UNIQUE,
      tax_amount REAL NOT NULL,
      tax_rate REAL NOT NULL,
      pdf_url TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('generated', 'printed', 'voided')),
      created_at TEXT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS pricing_rules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      base_price REAL NOT NULL,
      price_per_km REAL NOT NULL,
      weight_surcharge REAL NOT NULL,
      peak_hour_multiplier REAL NOT NULL,
      weather_multiplier REAL NOT NULL,
      weather_condition TEXT NOT NULL,
      min_order_amount REAL NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rider_locations (
      id TEXT PRIMARY KEY,
      rider_id TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (rider_id) REFERENCES riders(id) ON DELETE CASCADE
    );
  `);
}

function isDatabaseEmpty(): boolean {
  const row = db.prepare('SELECT COUNT(*) as count FROM riders').get() as { count: number };
  return row.count === 0;
}

function generateMockRiders(): Rider[] {
  const riderNames = [
    '张伟', '王强', '李明', '刘洋', '陈杰',
    '杨光', '赵磊', '黄勇', '周涛', '吴浩',
    '郑斌', '孙鹏', '马超', '朱峰', '胡军',
  ];
  const riders: Rider[] = [];
  const baseLat = 31.2304;
  const baseLng = 121.4737;

  for (let i = 0; i < 15; i++) {
    const creditScore = Math.floor(Math.random() * 30) + 70;
    const creditLevel = creditScore >= 90 ? 'S' : creditScore >= 80 ? 'A' : creditScore >= 70 ? 'B' : 'C';
    const statuses: RiderStatus[] = ['online', 'offline', 'busy'];
    const status = statuses[i % 3];
    riders.push({
      id: uuidv4(),
      name: riderNames[i],
      phone: `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      status,
      credit_score: creditScore,
      credit_level: creditLevel,
      current_lat: baseLat + (Math.random() - 0.5) * 0.1,
      current_lng: baseLng + (Math.random() - 0.5) * 0.1,
      on_time_rate: Math.round((0.85 + Math.random() * 0.14) * 100) / 100,
      complaint_rate: Math.round((Math.random() * 0.05) * 100) / 100,
      equipment_compliant: Math.random() > 0.1,
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }
  return riders;
}

function generateMockOrders(riders: Rider[]): Order[] {
  const goodsTypes = ['餐饮', '鲜花', '文件', '药品', '生鲜', '电子产品', '服装', '日用品'];
  const pickupAddresses = [
    '上海市黄浦区南京东路100号',
    '上海市徐汇区淮海中路1200号',
    '上海市静安区南京西路1500号',
    '上海市浦东新区陆家嘴环路500号',
    '上海市长宁区中山公园龙之梦',
    '上海市普陀区长寿路360号',
    '上海市虹口区四川北路500号',
    '上海市杨浦区五角场万达广场',
    '上海市闵行区莘庄龙之梦',
    '上海市宝山区宝山万达',
  ];
  const deliveryAddresses = [
    '上海市黄浦区外滩18号',
    '上海市徐汇区衡山路890号',
    '上海市静安区愚园路68号',
    '上海市浦东新区世纪大道100号',
    '上海市长宁区古北路1000号',
    '上海市普陀区武宁路100号',
    '上海市虹口区北外滩来福士',
    '上海市杨浦区大学路100号',
    '上海市闵行区虹桥天地',
    '上海市宝山区大华虎城',
  ];
  const statuses: OrderStatus[] = ['pending', 'assigned', 'picked', 'delivered', 'completed', 'cancelled', 'exception'];

  const orders: Order[] = [];
  for (let i = 0; i < 25; i++) {
    const status = statuses[i % statuses.length];
    const riderAssigned = status !== 'pending' && status !== 'cancelled';
    const rider = riderAssigned ? riders[i % riders.length] : null;
    const distance = Math.round((1 + Math.random() * 9) * 10) / 10;
    const basePrice = 8 + distance * 2;
    const isAbnormal = status === 'exception' || Math.random() < 0.1;
    const exceptionTypes = ['超时送达', '餐品损坏', '骑手联系不上', '地址错误', null];
    const exceptionType = isAbnormal ? exceptionTypes[Math.floor(Math.random() * 4)] : null;

    const createdAt = new Date(Date.now() - (i * 2 + Math.random()) * 60 * 60 * 1000);
    const estimatedDelivery = new Date(createdAt.getTime() + (30 + Math.random() * 60) * 60 * 1000);
    const actualDelivery = ['delivered', 'completed'].includes(status)
      ? new Date(estimatedDelivery.getTime() + (Math.random() - 0.3) * 30 * 60 * 1000).toISOString()
      : null;

    orders.push({
      id: uuidv4(),
      order_no: `DD${Date.now()}${String(i).padStart(4, '0')}`,
      merchant_id: `merchant_${(i % 5) + 1}`,
      rider_id: rider ? rider.id : null,
      status,
      pickup_address: pickupAddresses[i % pickupAddresses.length],
      pickup_lat: 31.2304 + (Math.random() - 0.5) * 0.08,
      pickup_lng: 121.4737 + (Math.random() - 0.5) * 0.08,
      delivery_address: deliveryAddresses[i % deliveryAddresses.length],
      delivery_lat: 31.2304 + (Math.random() - 0.5) * 0.1,
      delivery_lng: 121.4737 + (Math.random() - 0.5) * 0.1,
      goods_type: goodsTypes[i % goodsTypes.length],
      goods_weight: Math.round((0.5 + Math.random() * 5) * 10) / 10,
      distance_km: distance,
      estimated_price: Math.round(basePrice * 100) / 100,
      actual_price: ['completed', 'delivered'].includes(status)
        ? Math.round(basePrice * (0.95 + Math.random() * 0.1) * 100) / 100
        : 0,
      estimated_delivery_time: estimatedDelivery.toISOString(),
      actual_delivery_time: actualDelivery,
      created_at: createdAt.toISOString(),
      updated_at: new Date(createdAt.getTime() + Math.random() * 2 * 60 * 60 * 1000).toISOString(),
      exception_type: exceptionType,
      is_abnormal: isAbnormal,
    });
  }
  return orders;
}

function generateMockOrderEvents(orders: Order[]): OrderEvent[] {
  const events: OrderEvent[] = [];
  const eventTypesByStatus: Record<OrderStatus, string[]> = {
    pending: ['order_created'],
    assigned: ['order_created', 'rider_assigned'],
    accepted: ['order_created', 'rider_assigned'],
    picked: ['order_created', 'rider_assigned', 'goods_picked'],
    picked_up: ['order_created', 'rider_assigned', 'goods_picked'],
    in_transit: ['order_created', 'rider_assigned', 'goods_picked', 'in_transit'],
    delivering: ['order_created', 'rider_assigned', 'goods_picked', 'delivering'],
    delivered: ['order_created', 'rider_assigned', 'goods_picked', 'goods_delivered'],
    completed: ['order_created', 'rider_assigned', 'goods_picked', 'goods_delivered', 'order_completed'],
    cancelled: ['order_created', 'order_cancelled'],
    exception: ['order_created', 'rider_assigned', 'exception_occurred'],
  };

  orders.forEach((order) => {
    const eventTypes = eventTypesByStatus[order.status];
    eventTypes.forEach((eventType, index) => {
      const eventData: Record<string, unknown> = {};
      if (eventType === 'rider_assigned') {
        eventData.rider_id = order.rider_id;
      } else if (eventType === 'exception_occurred') {
        eventData.exception_type = order.exception_type;
      }
      events.push({
        id: uuidv4(),
        order_id: order.id,
        event_type: eventType,
        event_data: eventData,
        created_at: new Date(new Date(order.created_at).getTime() + index * 15 * 60 * 1000).toISOString(),
      });
    });
  });
  return events;
}

function generateMockCreditRecords(riders: Rider[]): CreditRecord[] {
  const records: CreditRecord[] = [];
  const reasons: { reason: string; type: CreditReasonType; positive: boolean }[] = [
    { reason: '准时送达', type: 'on_time', positive: true },
    { reason: '提前送达', type: 'on_time', positive: true },
    { reason: '用户投诉服务态度', type: 'complaint', positive: false },
    { reason: '用户投诉餐品洒漏', type: 'complaint', positive: false },
    { reason: '装备检查合规', type: 'equipment', positive: true },
    { reason: '未佩戴头盔', type: 'equipment', positive: false },
    { reason: '未穿工服', type: 'equipment', positive: false },
  ];

  riders.forEach((rider) => {
    const recordCount = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < recordCount; i++) {
      const r = reasons[Math.floor(Math.random() * reasons.length)];
      const scoreChange = r.positive ? 2 + Math.floor(Math.random() * 3) : -(3 + Math.floor(Math.random() * 5));
      records.push({
        id: uuidv4(),
        rider_id: rider.id,
        score_change: scoreChange,
        reason: r.reason,
        reason_type: r.type,
        created_at: new Date(Date.now() - (i + Math.random() * 10) * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
  });
  return records;
}

function generateMockCompensations(orders: Order[], riders: Rider[]): Compensation[] {
  const compensations: Compensation[] = [];
  const abnormalOrders = orders.filter((o) => o.is_abnormal && o.rider_id);
  const compTypes: CompensationType[] = ['timeout', 'lost', 'damaged'];
  const compStatuses: CompensationStatus[] = ['pending', 'approved', 'rejected'];

  abnormalOrders.forEach((order, idx) => {
    const type = compTypes[idx % compTypes.length];
    const amount = type === 'lost' ? 50 + Math.random() * 100 : 10 + Math.random() * 40;
    const status = compStatuses[idx % compStatuses.length];
    compensations.push({
      id: uuidv4(),
      order_id: order.id,
      rider_id: order.rider_id!,
      type,
      amount: Math.round(amount * 100) / 100,
      status,
      coupon_id: status === 'approved' ? `CPN${uuidv4().slice(0, 8).toUpperCase()}` : null,
      created_at: new Date(new Date(order.created_at).getTime() + 2 * 60 * 60 * 1000).toISOString(),
    });
  });

  return compensations;
}

function generateMockWaybills(orders: Order[]): Waybill[] {
  const waybills: Waybill[] = [];
  const completedOrders = orders.filter((o) => ['delivered', 'completed', 'picked'].includes(o.status));
  const statuses: WaybillStatus[] = ['generated', 'printed', 'voided'];

  completedOrders.forEach((order, idx) => {
    const taxRate = 0.06;
    const taxAmount = Math.round(order.estimated_price * taxRate * 100) / 100;
    waybills.push({
      id: uuidv4(),
      order_id: order.id,
      waybill_no: `YD${Date.now()}${String(idx).padStart(6, '0')}`,
      tax_amount: taxAmount,
      tax_rate: taxRate,
      pdf_url: `/waybills/${order.order_no}.pdf`,
      status: statuses[idx % statuses.length],
      created_at: new Date(new Date(order.created_at).getTime() + 30 * 60 * 1000).toISOString(),
    });
  });

  return waybills;
}

function generateMockPricingRules(): PricingRule[] {
  const now = new Date().toISOString();
  return [
    {
      id: uuidv4(),
      name: '标准定价规则',
      base_price: 8.0,
      price_per_km: 2.0,
      weight_surcharge: 1.5,
      peak_hour_multiplier: 1.3,
      weather_multiplier: 1.0,
      weather_condition: '晴天',
      min_order_amount: 10.0,
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: uuidv4(),
      name: '恶劣天气定价',
      base_price: 10.0,
      price_per_km: 2.5,
      weight_surcharge: 2.0,
      peak_hour_multiplier: 1.5,
      weather_multiplier: 1.5,
      weather_condition: '雨天',
      min_order_amount: 15.0,
      is_active: false,
      created_at: now,
      updated_at: now,
    },
    {
      id: uuidv4(),
      name: '夜间加价规则',
      base_price: 12.0,
      price_per_km: 2.5,
      weight_surcharge: 1.5,
      peak_hour_multiplier: 1.2,
      weather_multiplier: 1.0,
      weather_condition: '晴',
      min_order_amount: 15.0,
      is_active: false,
      created_at: now,
      updated_at: now,
    },
  ];
}

function seedData(): void {
  if (!isDatabaseEmpty()) {
    return;
  }

  const insertRider = db.prepare(`
    INSERT INTO riders (id, name, phone, status, credit_score, credit_level, current_lat, current_lng, on_time_rate, complaint_rate, equipment_compliant, created_at)
    VALUES (@id, @name, @phone, @status, @credit_score, @credit_level, @current_lat, @current_lng, @on_time_rate, @complaint_rate, @equipment_compliant, @created_at)
  `);

  const insertOrder = db.prepare(`
    INSERT INTO orders (id, order_no, merchant_id, rider_id, status, pickup_address, pickup_lat, pickup_lng, delivery_address, delivery_lat, delivery_lng, goods_type, goods_weight, distance_km, estimated_price, actual_price, estimated_delivery_time, actual_delivery_time, created_at, updated_at, exception_type, is_abnormal)
    VALUES (@id, @order_no, @merchant_id, @rider_id, @status, @pickup_address, @pickup_lat, @pickup_lng, @delivery_address, @delivery_lat, @delivery_lng, @goods_type, @goods_weight, @distance_km, @estimated_price, @actual_price, @estimated_delivery_time, @actual_delivery_time, @created_at, @updated_at, @exception_type, @is_abnormal)
  `);

  const insertOrderEvent = db.prepare(`
    INSERT INTO order_events (id, order_id, event_type, event_data, created_at)
    VALUES (@id, @order_id, @event_type, @event_data, @created_at)
  `);

  const insertCreditRecord = db.prepare(`
    INSERT INTO credit_records (id, rider_id, score_change, reason, reason_type, created_at)
    VALUES (@id, @rider_id, @score_change, @reason, @reason_type, @created_at)
  `);

  const insertCompensation = db.prepare(`
    INSERT INTO compensations (id, order_id, rider_id, type, amount, status, coupon_id, created_at)
    VALUES (@id, @order_id, @rider_id, @type, @amount, @status, @coupon_id, @created_at)
  `);

  const insertWaybill = db.prepare(`
    INSERT INTO waybills (id, order_id, waybill_no, tax_amount, tax_rate, pdf_url, status, created_at)
    VALUES (@id, @order_id, @waybill_no, @tax_amount, @tax_rate, @pdf_url, @status, @created_at)
  `);

  const insertPricingRule = db.prepare(`
    INSERT INTO pricing_rules (id, name, base_price, price_per_km, weight_surcharge, peak_hour_multiplier, weather_multiplier, weather_condition, min_order_amount, is_active, created_at, updated_at)
    VALUES (@id, @name, @base_price, @price_per_km, @weight_surcharge, @peak_hour_multiplier, @weather_multiplier, @weather_condition, @min_order_amount, @is_active, @created_at, @updated_at)
  `);

  const toSqliteBool = (b: boolean | undefined | null): number => (b ? 1 : 0);

  const transaction = db.transaction(() => {
    const riders = generateMockRiders();
    riders.forEach((rider) =>
      insertRider.run({
        ...rider,
        equipment_compliant: toSqliteBool(rider.equipment_compliant),
      })
    );

    const orders = generateMockOrders(riders);
    orders.forEach((order) =>
      insertOrder.run({
        ...order,
        is_abnormal: toSqliteBool(order.is_abnormal),
      })
    );

    const orderEvents = generateMockOrderEvents(orders);
    orderEvents.forEach((event) => {
      insertOrderEvent.run({
        ...event,
        event_data: JSON.stringify(event.event_data),
      });
    });

    const creditRecords = generateMockCreditRecords(riders);
    creditRecords.forEach((record) => insertCreditRecord.run(record));

    const compensations = generateMockCompensations(orders, riders);
    compensations.forEach((comp) => insertCompensation.run(comp));

    const waybills = generateMockWaybills(orders);
    waybills.forEach((waybill) => insertWaybill.run(waybill));

    const pricingRules = generateMockPricingRules();
    pricingRules.forEach((rule) =>
      insertPricingRule.run({
        ...rule,
        is_active: toSqliteBool(rule.is_active),
      })
    );
  });

  transaction();
}

createTables();
seedData();

const buildQueries = (dbInstance: Database.Database) => {
  const orders = {
    create: () =>
      dbInstance.prepare(
        `INSERT INTO orders (id, order_no, merchant_id, rider_id, status, pickup_address, pickup_lat, pickup_lng, delivery_address, delivery_lat, delivery_lng, goods_type, goods_weight, distance_km, estimated_price, actual_price, estimated_delivery_time, actual_delivery_time, created_at, updated_at, exception_type, is_abnormal)
         VALUES (@id, @order_no, @merchant_id, @rider_id, @status, @pickup_address, @pickup_lat, @pickup_lng, @delivery_address, @delivery_lat, @delivery_lng, @goods_type, @goods_weight, @distance_km, @estimated_price, @actual_price, @estimated_delivery_time, @actual_delivery_time, @created_at, @updated_at, @exception_type, @is_abnormal)`,
      ),
    findById: () => dbInstance.prepare('SELECT * FROM orders WHERE id = ?'),
    findByOrderNo: () => dbInstance.prepare('SELECT * FROM orders WHERE order_no = ?'),
    findByUserId: () => dbInstance.prepare('SELECT * FROM orders WHERE merchant_id = ? ORDER BY created_at DESC'),
    findByRiderId: () => dbInstance.prepare('SELECT * FROM orders WHERE rider_id = ? ORDER BY created_at DESC'),
    findByStatus: () => dbInstance.prepare('SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC'),
    findAll: () => dbInstance.prepare('SELECT * FROM orders ORDER BY created_at DESC'),
    findPendingNearby: () =>
      dbInstance.prepare(
        `SELECT * FROM orders WHERE status = 'pending'
         AND pickup_lat BETWEEN ? AND ? AND pickup_lng BETWEEN ? AND ?
         ORDER BY created_at DESC`,
      ),
    update: () =>
      dbInstance.prepare(
        `UPDATE orders SET
          status = @status,
          rider_id = @rider_id,
          actual_price = @actual_price,
          actual_delivery_time = @actual_delivery_time,
          updated_at = @updated_at,
          exception_type = @exception_type,
          is_abnormal = @is_abnormal
         WHERE id = @id`,
      ),
  }

  const riders = {
    create: () =>
      dbInstance.prepare(
        `INSERT INTO riders (id, name, phone, status, credit_score, credit_level, current_lat, current_lng, on_time_rate, complaint_rate, equipment_compliant, created_at)
         VALUES (@id, @name, @phone, @status, @credit_score, @credit_level, @current_lat, @current_lng, @on_time_rate, @complaint_rate, @equipment_compliant, @created_at)`,
      ),
    findById: () => dbInstance.prepare('SELECT * FROM riders WHERE id = ?'),
    findByPhone: () => dbInstance.prepare('SELECT * FROM riders WHERE phone = ?'),
    findAll: () => dbInstance.prepare('SELECT * FROM riders ORDER BY created_at DESC'),
    findByStatus: () => dbInstance.prepare('SELECT * FROM riders WHERE status = ?'),
    findNearby: () =>
      dbInstance.prepare(
        `SELECT * FROM riders WHERE status != 'offline'
         AND current_lat BETWEEN ? AND ? AND current_lng BETWEEN ? AND ?`,
      ),
    update: () =>
      dbInstance.prepare(
        `UPDATE riders SET
          status = @status,
          current_lat = @current_lat,
          current_lng = @current_lng,
          credit_score = @credit_score,
          on_time_rate = @on_time_rate,
          complaint_rate = @complaint_rate,
          equipment_compliant = @equipment_compliant
         WHERE id = @id`,
      ),
    delete: () => dbInstance.prepare('DELETE FROM riders WHERE id = ?'),
  }

  const riderLocations = {
    create: () =>
      dbInstance.prepare(
        `INSERT INTO rider_locations (id, rider_id, lat, lng, timestamp)
         VALUES (@id, @rider_id, @lat, @lng, @timestamp)`,
      ),
    findByRiderId: () =>
      dbInstance.prepare('SELECT * FROM rider_locations WHERE rider_id = ? ORDER BY timestamp DESC LIMIT ?'),
    deleteOld: () => dbInstance.prepare('DELETE FROM rider_locations WHERE timestamp < ?'),
  }

  const compensations = {
    create: () =>
      dbInstance.prepare(
        `INSERT INTO compensations (id, order_id, rider_id, type, amount, status, coupon_id, created_at)
         VALUES (@id, @order_id, @rider_id, @type, @amount, @status, @coupon_id, @created_at)`,
      ),
    findById: () => dbInstance.prepare('SELECT * FROM compensations WHERE id = ?'),
    findByOrderId: () => dbInstance.prepare('SELECT * FROM compensations WHERE order_id = ?'),
    findByUserId: () => dbInstance.prepare('SELECT * FROM compensations WHERE rider_id = ? ORDER BY created_at DESC'),
    findByStatus: () => dbInstance.prepare('SELECT * FROM compensations WHERE status = ? ORDER BY created_at DESC'),
    findAll: () => dbInstance.prepare('SELECT * FROM compensations ORDER BY created_at DESC'),
    update: () =>
      dbInstance.prepare(
        `UPDATE compensations SET status = @status, coupon_id = @coupon_id WHERE id = @id`,
      ),
  }

  const waybills = {
    create: () =>
      dbInstance.prepare(
        `INSERT INTO waybills (id, order_id, waybill_no, tax_amount, tax_rate, pdf_url, status, created_at)
         VALUES (@id, @order_id, @waybill_no, @tax_amount, @tax_rate, @pdf_url, @status, @created_at)`,
      ),
    findById: () => dbInstance.prepare('SELECT * FROM waybills WHERE id = ?'),
    findByOrderId: () => dbInstance.prepare('SELECT * FROM waybills WHERE order_id = ?'),
    findByWaybillNo: () => dbInstance.prepare('SELECT * FROM waybills WHERE waybill_no = ?'),
    findAll: () => dbInstance.prepare('SELECT * FROM waybills ORDER BY created_at DESC'),
    findPendingExport: () => dbInstance.prepare("SELECT * FROM waybills WHERE status != 'voided' ORDER BY created_at DESC"),
    markExported: () => dbInstance.prepare("UPDATE waybills SET status = 'printed' WHERE id = ?"),
  }

  const pricing = {
    getConfig: () => dbInstance.prepare('SELECT * FROM pricing_rules WHERE is_active = 1 LIMIT 1'),
    updateConfig: () =>
      dbInstance.prepare(
        `UPDATE pricing_rules SET
          base_price = @base_price,
          price_per_km = @price_per_km,
          peak_hour_multiplier = @peak_hour_multiplier,
          weather_multiplier = @weather_multiplier,
          weight_surcharge = @weight_surcharge,
          updated_at = @updated_at
         WHERE id = @id`,
      ),
  }

  const dashboard = {
    orderStats: () =>
      dbInstance.prepare(
        `SELECT
          COUNT(*) as total_orders,
          SUM(CASE WHEN status = 'completed' OR status = 'delivered' THEN 1 ELSE 0 END) as completed_orders,
          SUM(CASE WHEN status IN ('assigned', 'picked', 'picked_up', 'in_transit', 'delivering') THEN 1 ELSE 0 END) as in_progress_orders,
          SUM(CASE WHEN status = 'exception' THEN 1 ELSE 0 END) as exception_orders,
          COALESCE(SUM(actual_price), 0) as total_revenue
        FROM orders
        WHERE created_at >= ?`,
      ),
    activeRiders: () =>
      dbInstance.prepare("SELECT COUNT(*) as count FROM riders WHERE status != 'offline'"),
    avgDeliveryTime: () =>
      dbInstance.prepare(
        `SELECT COALESCE(AVG(
          CAST((julianday(COALESCE(actual_delivery_time, datetime('now'))) - julianday(created_at)) * 24 * 60 AS REAL)
        ), 0) as avg_minutes
        FROM orders
        WHERE (status = 'completed' OR status = 'delivered') AND created_at >= ?`,
      ),
  }

  return {
    orders,
    riders,
    riderLocations,
    compensations,
    waybills,
    pricing,
    dashboard,
  }
}

export const dbQueries = buildQueries(db)

export const getDb = (): Database.Database => db

export type {
  Order,
  Rider,
  RiderLocation,
  OrderEvent,
  CreditRecord,
  Compensation,
  Waybill,
  PricingRule,
  OrderStatus,
  RiderStatus,
  CreditReasonType,
  CompensationType,
  CompensationStatus,
  WaybillStatus,
  PricingConfig,
  DashboardMetrics,
} from '../../shared/types/index.js'

export default db;
