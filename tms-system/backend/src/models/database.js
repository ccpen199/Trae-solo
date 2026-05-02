import Database from 'better-sqlite3'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'

export const db = new Database('tms.db')

export function initialize() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      customer_no TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      contact TEXT,
      phone TEXT,
      address TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY,
      vehicle_no TEXT UNIQUE NOT NULL,
      vehicle_type TEXT NOT NULL,
      length REAL,
      width REAL,
      height REAL,
      max_load REAL NOT NULL,
      max_volume REAL,
      status TEXT DEFAULT 'AVAILABLE',
      current_driver_id TEXT,
      current_lat REAL,
      current_lng REAL,
      current_address TEXT,
      last_location_update TEXT,
      owner_type TEXT,
      owner_name TEXT,
      owner_contact TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS drivers (
      id TEXT PRIMARY KEY,
      driver_no TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      id_card TEXT,
      license_no TEXT,
      license_type TEXT,
      license_expire TEXT,
      vehicle_id TEXT,
      status TEXT DEFAULT 'AVAILABLE',
      current_waybill_id TEXT,
      current_lat REAL,
      current_lng REAL,
      last_location_update TEXT,
      total_orders INTEGER DEFAULT 0,
      completion_rate REAL DEFAULT 0,
      accident_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS routes (
      id TEXT PRIMARY KEY,
      route_no TEXT UNIQUE NOT NULL,
      route_name TEXT NOT NULL,
      origin_city TEXT NOT NULL,
      destination_city TEXT NOT NULL,
      distance REAL NOT NULL,
      duration INTEGER,
      toll_fee REAL DEFAULT 0,
      waypoints TEXT,
      base_fee REAL DEFAULT 0,
      per_km_fee REAL DEFAULT 0,
      per_ton_fee REAL DEFAULT 0,
      status TEXT DEFAULT 'ACTIVE',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_no TEXT UNIQUE NOT NULL,
      customer_id TEXT,
      customer_name TEXT,
      customer_contact TEXT,
      customer_phone TEXT,
      pickup_address TEXT NOT NULL,
      pickup_city TEXT NOT NULL,
      pickup_district TEXT,
      pickup_contact TEXT,
      pickup_phone TEXT,
      pickup_lat REAL,
      pickup_lng REAL,
      pickup_time TEXT,
      delivery_address TEXT NOT NULL,
      delivery_city TEXT NOT NULL,
      delivery_district TEXT,
      delivery_contact TEXT,
      delivery_phone TEXT,
      delivery_lat REAL,
      delivery_lng REAL,
      goods_type TEXT,
      goods_name TEXT NOT NULL,
      weight REAL DEFAULT 0,
      volume REAL DEFAULT 0,
      quantity INTEGER DEFAULT 1,
      package_type TEXT,
      declared_value REAL DEFAULT 0,
      status TEXT DEFAULT 'PENDING',
      priority TEXT DEFAULT 'NORMAL',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT
    );

    CREATE TABLE IF NOT EXISTS transport_tasks (
      id TEXT PRIMARY KEY,
      task_no TEXT UNIQUE NOT NULL,
      order_id TEXT NOT NULL,
      route_id TEXT,
      route_name TEXT,
      estimated_distance REAL,
      estimated_duration INTEGER,
      dispatcher_id TEXT,
      assigned_at TEXT,
      status TEXT DEFAULT 'PENDING_DISPATCH',
      priority TEXT DEFAULT 'NORMAL',
      remark TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS waybills (
      id TEXT PRIMARY KEY,
      waybill_no TEXT UNIQUE NOT NULL,
      transport_task_id TEXT,
      order_id TEXT NOT NULL,
      order_no TEXT,
      vehicle_id TEXT NOT NULL,
      vehicle_no TEXT,
      driver_id TEXT NOT NULL,
      driver_name TEXT,
      driver_phone TEXT,
      dispatcher_id TEXT,
      dispatched_at TEXT,
      planned_route TEXT,
      actual_route TEXT,
      total_distance REAL,
      actual_distance REAL,
      freight_amount REAL DEFAULT 0,
      distance_fee REAL DEFAULT 0,
      weight_fee REAL DEFAULT 0,
      additional_fees TEXT,
      total_freight REAL DEFAULT 0,
      status TEXT DEFAULT 'CREATED',
      assigned_at TEXT,
      accepted_at TEXT,
      picked_up_at TEXT,
      departed_at TEXT,
      arrived_at TEXT,
      signed_at TEXT,
      completed_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS gps_tracks (
      id TEXT PRIMARY KEY,
      waybill_id TEXT NOT NULL,
      vehicle_id TEXT,
      driver_id TEXT,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      address TEXT,
      speed REAL,
      direction INTEGER,
      altitude REAL,
      location_type TEXT DEFAULT 'NORMAL',
      stop_duration INTEGER DEFAULT 0,
      engine_status TEXT,
      recorded_at TEXT,
      received_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS exceptions (
      id TEXT PRIMARY KEY,
      waybill_id TEXT NOT NULL,
      exception_no TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      report_lat REAL,
      report_lng REAL,
      report_address TEXT,
      report_by TEXT,
      reported_at TEXT DEFAULT CURRENT_TIMESTAMP,
      handled_by TEXT,
      handled_at TEXT,
      handling_result TEXT,
      status TEXT DEFAULT 'REPORTED',
      images TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS receipts (
      id TEXT PRIMARY KEY,
      receipt_no TEXT UNIQUE NOT NULL,
      waybill_id TEXT NOT NULL,
      signed_by TEXT,
      signed_at TEXT,
      signed_lat REAL,
      signed_lng REAL,
      photos TEXT,
      remark TEXT,
      damage_photos TEXT,
      status TEXT DEFAULT 'PENDING',
      verified_by TEXT,
      verified_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS freights (
      id TEXT PRIMARY KEY,
      freight_no TEXT UNIQUE NOT NULL,
      waybill_id TEXT NOT NULL,
      waybill_no TEXT,
      distance REAL DEFAULT 0,
      weight REAL DEFAULT 0,
      volume REAL DEFAULT 0,
      distance_fee REAL DEFAULT 0,
      weight_fee REAL DEFAULT 0,
      volume_fee REAL DEFAULT 0,
      pickup_fee REAL DEFAULT 0,
      delivery_fee REAL DEFAULT 0,
      additional_fees TEXT,
      declared_value REAL DEFAULT 0,
      insurance_fee REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      total_freight REAL DEFAULT 0,
      calculation_basis TEXT,
      status TEXT DEFAULT 'CALCULATED',
      calculated_by TEXT,
      calculated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      confirmed_by TEXT,
      confirmed_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS statements (
      id TEXT PRIMARY KEY,
      statement_no TEXT UNIQUE NOT NULL,
      statement_type TEXT NOT NULL,
      customer_id TEXT,
      customer_name TEXT,
      carrier_id TEXT,
      carrier_name TEXT,
      period_start TEXT NOT NULL,
      period_end TEXT NOT NULL,
      total_orders INTEGER DEFAULT 0,
      total_distance REAL DEFAULT 0,
      total_weight REAL DEFAULT 0,
      subtotal REAL DEFAULT 0,
      adjustment REAL DEFAULT 0,
      total_amount REAL DEFAULT 0,
      line_items TEXT,
      status TEXT DEFAULT 'DRAFT',
      due_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL,
      operator_id TEXT,
      operator_name TEXT,
      details TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `)

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get()
  if (userCount.count === 0) {
    seedData()
  }

  console.log('Database initialized')
}

function seedData() {
  const adminId = uuidv4()
  const dispatcherId = uuidv4()
  const driver1Id = uuidv4()
  const driver2Id = uuidv4()
  const customer1Id = uuidv4()
  const customer2Id = uuidv4()
  const financeId = uuidv4()

  const hashedPassword = bcrypt.hashSync('123456', 10)

  db.prepare(`INSERT INTO users (id, username, password, role, name, phone) VALUES (?, ?, ?, ?, ?, ?)`).run(adminId, 'admin', bcrypt.hashSync('admin', 10), 'admin', '系统管理员', '13800138000')
  db.prepare(`INSERT INTO users (id, username, password, role, name, phone) VALUES (?, ?, ?, ?, ?, ?)`).run(dispatcherId, 'dispatcher1', hashedPassword, 'dispatcher', '张调度', '13800138001')
  db.prepare(`INSERT INTO users (id, username, password, role, name, phone) VALUES (?, ?, ?, ?, ?, ?)`).run(driver1Id, 'driver1', hashedPassword, 'driver', '李师傅', '13800138002')
  db.prepare(`INSERT INTO users (id, username, password, role, name, phone) VALUES (?, ?, ?, ?, ?, ?)`).run(driver2Id, 'driver2', hashedPassword, 'driver', '王师傅', '13800138003')
  db.prepare(`INSERT INTO users (id, username, password, role, name, phone) VALUES (?, ?, ?, ?, ?, ?)`).run(customer1Id, 'customer1', hashedPassword, 'customer', '某科技有限公司', '13800138004')
  db.prepare(`INSERT INTO users (id, username, password, role, name, phone) VALUES (?, ?, ?, ?, ?, ?)`).run(customer2Id, 'customer2', hashedPassword, 'customer', '某商贸公司', '13800138005')
  db.prepare(`INSERT INTO users (id, username, password, role, name, phone) VALUES (?, ?, ?, ?, ?, ?)`).run(financeId, 'finance1', hashedPassword, 'finance', '陈财务', '13800138006')

  const vehicle1Id = uuidv4()
  const vehicle2Id = uuidv4()
  const vehicle3Id = uuidv4()

  db.prepare(`INSERT INTO vehicles (id, vehicle_no, vehicle_type, max_load, max_volume, status) VALUES (?, ?, ?, ?, ?, ?)`).run(vehicle1Id, '京A12345', 'OPEN_TRUCK', 8, 30, 'AVAILABLE')
  db.prepare(`INSERT INTO vehicles (id, vehicle_no, vehicle_type, max_load, max_volume, status) VALUES (?, ?, ?, ?, ?, ?)`).run(vehicle2Id, '京B67890', 'CLOSED_VAN', 5, 20, 'AVAILABLE')
  db.prepare(`INSERT INTO vehicles (id, vehicle_no, vehicle_type, max_load, max_volume, status) VALUES (?, ?, ?, ?, ?, ?)`).run(vehicle3Id, '京C11111', 'REFRIGERATED', 6, 25, 'AVAILABLE')

  db.prepare(`INSERT INTO drivers (id, driver_no, name, phone, vehicle_id, status) VALUES (?, ?, ?, ?, ?, ?)`).run(driver1Id, 'D001', '李师傅', '13800138002', vehicle1Id, 'AVAILABLE')
  db.prepare(`INSERT INTO drivers (id, driver_no, name, phone, vehicle_id, status) VALUES (?, ?, ?, ?, ?, ?)`).run(driver2Id, 'D002', '王师傅', '13800138003', vehicle2Id, 'AVAILABLE')

  const route1Id = uuidv4()
  const route2Id = uuidv4()
  const route3Id = uuidv4()

  db.prepare(`INSERT INTO routes (id, route_no, route_name, origin_city, destination_city, distance, duration, per_km_fee, per_ton_fee) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(route1Id, 'R001', '北京-上海', '北京市', '上海市', 1200, 720, 3.5, 50)
  db.prepare(`INSERT INTO routes (id, route_no, route_name, origin_city, destination_city, distance, duration, per_km_fee, per_ton_fee) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(route2Id, 'R002', '北京-广州', '北京市', '广州市', 2200, 1320, 3.2, 48)
  db.prepare(`INSERT INTO routes (id, route_no, route_name, origin_city, destination_city, distance, duration, per_km_fee, per_ton_fee) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(route3Id, 'R003', '上海-深圳', '上海市', '深圳市', 1500, 900, 3.8, 55)

  const order1Id = uuidv4()
  const order2Id = uuidv4()
  const order3Id = uuidv4()

  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  db.prepare(`INSERT INTO orders (id, order_no, customer_id, customer_name, customer_phone, pickup_address, pickup_city, pickup_contact, pickup_phone, pickup_time, delivery_address, delivery_city, delivery_contact, delivery_phone, goods_name, goods_type, weight, volume, quantity, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    order1Id, 'ORD-20260427-0001', customer1Id, '某科技有限公司', '13800138004',
    '朝阳区建国路88号', '北京市', '张三', '13800138010', tomorrow.toISOString(),
    '浦东新区世纪大道100号', '上海市', '李四', '13800138020',
    '电子元器件', 'NORMAL', 3.5, 8, 50, 'PENDING'
  )

  db.prepare(`INSERT INTO orders (id, order_no, customer_id, customer_name, customer_phone, pickup_address, pickup_city, pickup_contact, pickup_phone, pickup_time, delivery_address, delivery_city, delivery_contact, delivery_phone, goods_name, goods_type, weight, volume, quantity, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    order2Id, 'ORD-20260427-0002', customer2Id, '某商贸公司', '13800138005',
    '天河区珠江新城', '广州市', '王五', '13800138011',
    tomorrow.toISOString(),
    '静安区南京西路', '上海市', '赵六', '13800138021',
    '服装鞋帽', 'NORMAL', 2.0, 15, 100, 'PENDING'
  )

  db.prepare(`INSERT INTO orders (id, order_no, customer_id, customer_name, customer_phone, pickup_address, pickup_city, pickup_contact, pickup_phone, pickup_time, delivery_address, delivery_city, delivery_contact, delivery_phone, goods_name, goods_type, weight, volume, quantity, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    order3Id, 'ORD-20260427-0003', customer1Id, '某科技有限公司', '13800138004',
    '海淀区中关村大街', '北京市', '钱七', '13800138012',
    new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    '南山区科技园', '深圳市', '孙八', '13800138022',
    '精密仪器', 'FRAGILE', 1.5, 5, 20, 'DISPATCHED'
  )

  console.log('Seed data inserted')
}

export default { db, initialize }
