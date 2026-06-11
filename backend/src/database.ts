import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../../data');
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.resolve(dataDir, 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      real_name TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL CHECK(role IN ('shipper','driver','carrier','admin')),
      company_name TEXT NOT NULL DEFAULT '',
      license_number TEXT NOT NULL DEFAULT '',
      credit_score INTEGER NOT NULL DEFAULT 100,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','disabled','pending_review')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cargo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      cargo_name TEXT NOT NULL,
      cargo_type TEXT NOT NULL DEFAULT 'general',
      weight REAL NOT NULL DEFAULT 0,
      volume REAL NOT NULL DEFAULT 0,
      temperature_control TEXT NOT NULL DEFAULT 'none',
      loading_method TEXT NOT NULL DEFAULT 'manual',
      origin_province TEXT NOT NULL DEFAULT '',
      origin_city TEXT NOT NULL DEFAULT '',
      origin_district TEXT NOT NULL DEFAULT '',
      dest_province TEXT NOT NULL DEFAULT '',
      dest_city TEXT NOT NULL DEFAULT '',
      dest_district TEXT NOT NULL DEFAULT '',
      origin_lat REAL NOT NULL DEFAULT 0,
      origin_lng REAL NOT NULL DEFAULT 0,
      dest_lat REAL NOT NULL DEFAULT 0,
      dest_lng REAL NOT NULL DEFAULT 0,
      route_preference TEXT NOT NULL DEFAULT 'shortest',
      expected_loading_date TEXT,
      expected_delivery_date TEXT,
      budget REAL NOT NULL DEFAULT 0,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','matched','transporting','completed','cancelled')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      plate_number TEXT NOT NULL,
      vehicle_type TEXT NOT NULL DEFAULT 'flatbed',
      load_capacity REAL NOT NULL DEFAULT 0,
      volume_capacity REAL NOT NULL DEFAULT 0,
      temperature_control TEXT NOT NULL DEFAULT 'none',
      current_province TEXT NOT NULL DEFAULT '',
      current_city TEXT NOT NULL DEFAULT '',
      current_lat REAL NOT NULL DEFAULT 0,
      current_lng REAL NOT NULL DEFAULT 0,
      available_routes TEXT NOT NULL DEFAULT '',
      driver_license TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available','matched','transporting','offline')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS dedicated_routes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      carrier_id INTEGER NOT NULL REFERENCES users(id),
      route_name TEXT NOT NULL,
      origin_province TEXT NOT NULL DEFAULT '',
      origin_city TEXT NOT NULL DEFAULT '',
      dest_province TEXT NOT NULL DEFAULT '',
      dest_city TEXT NOT NULL DEFAULT '',
      origin_lat REAL NOT NULL DEFAULT 0,
      origin_lng REAL NOT NULL DEFAULT 0,
      dest_lat REAL NOT NULL DEFAULT 0,
      dest_lng REAL NOT NULL DEFAULT 0,
      carrier_qualification TEXT NOT NULL DEFAULT '',
      delivery_promise TEXT NOT NULL DEFAULT '',
      complaint_rate REAL NOT NULL DEFAULT 0,
      on_time_rate REAL NOT NULL DEFAULT 0,
      price_per_ton REAL NOT NULL DEFAULT 0,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive','pending_review')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shipper_id INTEGER NOT NULL REFERENCES users(id),
      carrier_id INTEGER NOT NULL REFERENCES users(id),
      cargo_id INTEGER NOT NULL REFERENCES cargo(id),
      vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
      contract_number TEXT NOT NULL UNIQUE,
      content TEXT NOT NULL DEFAULT '',
      shipper_signature TEXT NOT NULL DEFAULT '',
      carrier_signature TEXT NOT NULL DEFAULT '',
      shipper_signature_time TEXT,
      carrier_signature_time TEXT,
      ca_serial TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','signing','signed','archived','cancelled')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS transport_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cargo_id INTEGER NOT NULL REFERENCES cargo(id),
      vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
      contract_id INTEGER REFERENCES contracts(id),
      shipper_id INTEGER NOT NULL REFERENCES users(id),
      driver_id INTEGER NOT NULL REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'pending_loading' CHECK(status IN ('pending_loading','loading','in_transit','unloading','completed','cancelled')),
      actual_loading_time TEXT,
      actual_delivery_time TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS checkin_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL REFERENCES transport_tasks(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      checkin_type TEXT NOT NULL CHECK(checkin_type IN ('loading','in_transit','unloading')),
      latitude REAL NOT NULL DEFAULT 0,
      longitude REAL NOT NULL DEFAULT 0,
      address TEXT NOT NULL DEFAULT '',
      photo_url TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      checkin_time TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS evaluations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL REFERENCES transport_tasks(id),
      from_user_id INTEGER NOT NULL REFERENCES users(id),
      to_user_id INTEGER NOT NULL REFERENCES users(id),
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      comment TEXT NOT NULL DEFAULT '',
      evaluation_type TEXT NOT NULL CHECK(evaluation_type IN ('shipper_to_driver','driver_to_shipper')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS credit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      change_type TEXT NOT NULL,
      change_value INTEGER NOT NULL DEFAULT 0,
      reason TEXT NOT NULL DEFAULT '',
      new_score INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cost_indices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      province TEXT NOT NULL DEFAULT '',
      city TEXT NOT NULL DEFAULT '',
      cost_index REAL NOT NULL DEFAULT 0,
      period TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS supply_demand_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      province TEXT NOT NULL DEFAULT '',
      city TEXT NOT NULL DEFAULT '',
      cargo_count REAL NOT NULL DEFAULT 0,
      vehicle_count REAL NOT NULL DEFAULT 0,
      match_rate REAL NOT NULL DEFAULT 0,
      period TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS compliance_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      check_type TEXT NOT NULL,
      check_result TEXT NOT NULL DEFAULT '',
      detail TEXT NOT NULL DEFAULT '',
      checked_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_cargo_user_id ON cargo(user_id);
    CREATE INDEX IF NOT EXISTS idx_cargo_status ON cargo(status);
    CREATE INDEX IF NOT EXISTS idx_cargo_type ON cargo(cargo_type);
    CREATE INDEX IF NOT EXISTS idx_cargo_origin ON cargo(origin_province, origin_city);
    CREATE INDEX IF NOT EXISTS idx_cargo_dest ON cargo(dest_province, dest_city);
    CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);
    CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
    CREATE INDEX IF NOT EXISTS idx_vehicles_type ON vehicles(vehicle_type);
    CREATE INDEX IF NOT EXISTS idx_dedicated_routes_carrier_id ON dedicated_routes(carrier_id);
    CREATE INDEX IF NOT EXISTS idx_vehicles_location ON vehicles(current_province, current_city);
    CREATE INDEX IF NOT EXISTS idx_dedicated_routes_status ON dedicated_routes(status);
    CREATE INDEX IF NOT EXISTS idx_dedicated_routes_origin ON dedicated_routes(origin_province, origin_city);
    CREATE INDEX IF NOT EXISTS idx_dedicated_routes_dest ON dedicated_routes(dest_province, dest_city);
    CREATE INDEX IF NOT EXISTS idx_contracts_shipper_id ON contracts(shipper_id);
    CREATE INDEX IF NOT EXISTS idx_contracts_carrier_id ON contracts(carrier_id);
    CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
    CREATE INDEX IF NOT EXISTS idx_transport_tasks_cargo_id ON transport_tasks(cargo_id);
    CREATE INDEX IF NOT EXISTS idx_transport_tasks_vehicle_id ON transport_tasks(vehicle_id);
    CREATE INDEX IF NOT EXISTS idx_transport_tasks_shipper_id ON transport_tasks(shipper_id);
    CREATE INDEX IF NOT EXISTS idx_transport_tasks_driver_id ON transport_tasks(driver_id);
    CREATE INDEX IF NOT EXISTS idx_transport_tasks_status ON transport_tasks(status);
    CREATE INDEX IF NOT EXISTS idx_checkin_records_task_id ON checkin_records(task_id);
    CREATE INDEX IF NOT EXISTS idx_evaluations_task_id ON evaluations(task_id);
    CREATE INDEX IF NOT EXISTS idx_evaluations_to_user_id ON evaluations(to_user_id);
    CREATE INDEX IF NOT EXISTS idx_credit_logs_user_id ON credit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_cost_indices_province_city ON cost_indices(province, city);
    CREATE INDEX IF NOT EXISTS idx_supply_demand_stats_province_city ON supply_demand_stats(province, city);
  `);

  seedData();
}

function seedData() {
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
  if (userCount > 0) {
    db.pragma('foreign_keys = OFF');
    db.exec('DELETE FROM checkin_records; DELETE FROM transport_tasks; DELETE FROM contracts; DELETE FROM evaluation; DELETE FROM cargo; DELETE FROM vehicles; DELETE FROM dedicated_routes; DELETE FROM compliance_logs; DELETE FROM cost_indices; DELETE FROM supply_demand_stats; DELETE FROM credit_logs; DELETE FROM users;');
    db.pragma('foreign_keys = ON');
  }

  const adminHash = bcrypt.hashSync('admin123', 10);
  const shipper1Hash = bcrypt.hashSync('shipper123', 10);
  const shipper2Hash = bcrypt.hashSync('shipper456', 10);
  const driver1Hash = bcrypt.hashSync('driver123', 10);
  const driver2Hash = bcrypt.hashSync('driver456', 10);
  const carrier1Hash = bcrypt.hashSync('carrier123', 10);
  const carrier2Hash = bcrypt.hashSync('carrier456', 10);

  const insertUser = db.prepare(`
    INSERT INTO users (username, password_hash, real_name, phone, email, role, company_name, license_number, credit_score, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const users = [
    ['admin', adminHash, '系统管理员', '13800000000', 'admin@logistics.com', 'admin', '平台管理', '', 100, 'active'],
    ['zhangwei', shipper1Hash, '张伟', '13800000001', 'zhangwei@example.com', 'shipper', '华贸电子科技', '', 95, 'active'],
    ['liming', shipper2Hash, '李明', '13800000002', 'liming@example.com', 'shipper', '明达贸易公司', '', 88, 'active'],
    ['wangqiang', driver1Hash, '王强', '13800000003', 'wangqiang@example.com', 'driver', '', '驾照A2-4401001234', 92, 'active'],
    ['zhaogang', driver2Hash, '赵刚', '13800000004', 'zhaogang@example.com', 'driver', '', '驾照A2-5101005678', 85, 'active'],
    ['shunda', carrier1Hash, '刘建国', '13800000005', 'shunda@example.com', 'carrier', '顺达物流有限公司', '交运许可-44010001', 96, 'active'],
    ['zhongyun', carrier2Hash, '陈志远', '13800000006', 'zhongyun@example.com', 'carrier', '中运快线物流', '交运许可-31010002', 90, 'active'],
  ] as const;

  const insertMany = db.transaction(() => {
    for (const u of users) {
      insertUser.run(...u);
    }
  });
  insertMany();

  const insertCargo = db.prepare(`
    INSERT INTO cargo (user_id, cargo_name, cargo_type, weight, volume, temperature_control, loading_method,
      origin_province, origin_city, origin_district, dest_province, dest_city, dest_district,
      origin_lat, origin_lng, dest_lat, dest_lng, route_preference,
      expected_loading_date, expected_delivery_date, budget, description, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const cargoItems = [
    [2, '电子元器件', 'electronics', 8.5, 32, 'none', 'manual', '广东省', '深圳市', '南山区', '北京市', '北京市', '朝阳区', 22.5431, 113.9578, 39.9219, 116.4435, 'shortest', '2024-07-01', '2024-07-03', 15000, '高精度芯片及电子元器件，需轻拿轻放', 'pending'],
    [2, '进口水果', 'fresh', 15, 45, 'cold', 'manual', '广东省', '广州市', '白云区', '上海市', '上海市', '浦东新区', 23.1485, 113.2659, 31.2304, 121.4737, 'shortest', '2024-07-02', '2024-07-04', 22000, '进口热带水果，需全程冷链2-8°C', 'pending'],
    [3, '建筑钢材', 'construction', 35, 20, 'none', 'mechanical', '广东省', '佛山市', '顺德区', '湖北省', '武汉市', '洪山区', 22.8076, 113.1070, 30.4995, 114.4026, 'shortest', '2024-07-03', '2024-07-06', 28000, '螺纹钢及型材，需加固绑扎', 'pending'],
    [3, '服装面料', 'textile', 5, 60, 'none', 'manual', '浙江省', '杭州市', '余杭区', '四川省', '成都市', '武侯区', 30.4192, 120.0125, 30.5728, 104.0668, 'shortest', '2024-07-05', '2024-07-08', 18000, '高档面料，注意防潮防尘', 'pending'],
    [2, '数控机床', 'machinery', 22, 38, 'none', 'mechanical', '广东省', '东莞市', '长安镇', '河南省', '郑州市', '金水区', 22.8147, 113.7597, 34.7995, 113.6587, 'shortest', '2024-07-06', '2024-07-09', 35000, '精密数控设备，需专业吊装', 'matched'],
    [3, '生物制药', 'pharmaceutical', 3, 15, 'cold', 'manual', '北京市', '北京市', '大兴区', '广东省', '广州市', '天河区', 39.7266, 116.3370, 23.1246, 113.3613, 'shortest', '2024-07-08', '2024-07-11', 42000, '生物制剂，需全程冷链2-8°C，限时送达', 'pending'],
    [2, '日用百货', 'general', 12, 40, 'none', 'manual', '江苏省', '南京市', '鼓楼区', '山东省', '济南市', '历下区', 32.0603, 118.7969, 36.6512, 117.1201, 'shortest', '2024-07-10', '2024-07-13', 12000, '普通日用百货，标准运输', 'pending'],
    [3, '冷冻海鲜', 'cold_chain', 20, 35, 'frozen', 'mechanical', '山东省', '青岛市', '市南区', '北京市', '北京市', '海淀区', 36.0671, 120.3826, 39.9599, 116.3262, 'shortest', '2024-07-11', '2024-07-13', 25000, '深海冷冻海鲜，需-18°C冷链运输', 'pending'],
    [2, '工业化学品', 'hazardous', 18, 25, 'none', 'mechanical', '上海市', '上海市', '宝山区', '浙江省', '宁波市', '北仑区', 31.4053, 121.4836, 29.9147, 121.8276, 'safe', '2024-07-12', '2024-07-14', 32000, '危险化学品，需专业资质车辆运输', 'pending'],
    [3, '大型变压器', 'oversized', 50, 80, 'none', 'mechanical', '江苏省', '苏州市', '工业园区', '安徽省', '合肥市', '蜀山区', 31.3245, 120.7369, 31.8206, 117.2272, 'shortest', '2024-07-15', '2024-07-18', 55000, '超大型电力变压器，需超低板车运输', 'pending'],
  ] as const;

  const cargoInsert = db.transaction(() => {
    for (const c of cargoItems) {
      insertCargo.run(...c);
    }
  });
  cargoInsert();

  const insertVehicle = db.prepare(`
    INSERT INTO vehicles (user_id, plate_number, vehicle_type, load_capacity, volume_capacity, temperature_control,
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    current_province, current_city, current_lat, current_lng, available_routes, driver_license, status)
  `);

  const vehicleItems = [
    [4, '粤B12345', 'flatbed', 30, 80, 'none', '广东省', '深圳市', 22.5431, 113.9578, '深圳-北京,深圳-上海', 'A2-4401001234', 'available'],
    [5, '粤A67890', 'refrigerated', 20, 50, 'cold', '广东省', '广州市', 23.1485, 113.2659, '广州-上海,广州-北京', 'A2-5101005678', 'available'],
    [4, '鄂A11111', 'van', 25, 65, 'none', '湖北省', '武汉市', 30.4995, 114.4026, '武汉-成都,武汉-郑州', 'A2-4401001234', 'available'],
    [5, '浙A22222', 'flatbed', 35, 90, 'none', '浙江省', '杭州市', 30.4192, 120.0125, '杭州-成都,杭州-广州', 'A2-5101005678', 'available'],
    [4, '豫A33333', 'lowbed', 40, 100, 'none', '河南省', '郑州市', 34.7995, 113.6587, '郑州-北京,郑州-武汉', 'A2-4401001234', 'available'],
    [5, '川A44444', 'refrigerated', 18, 45, 'cold', '四川省', '成都市', 30.5728, 104.0668, '成都-广州,成都-上海', 'A2-5101005678', 'available'],
    [4, '鲁B55555', 'refrigerated', 28, 60, 'frozen', '山东省', '青岛市', 36.0671, 120.3826, '青岛-北京,青岛-济南', 'A2-4401001234', 'available'],
    [5, '沪A66666', 'container', 40, 85, 'none', '上海市', '上海市', 31.2304, 121.4737, '上海-宁波,上海-苏州', 'A2-5101005678', 'available'],
  ] as const;

  const vehicleInsert = db.transaction(() => {
    for (const v of vehicleItems) {
      insertVehicle.run(...v);
    }
  });
  vehicleInsert();

  const insertRoute = db.prepare(`
    INSERT INTO dedicated_routes (carrier_id, route_name, origin_province, origin_city, dest_province, dest_city,
      origin_lat, origin_lng, dest_lat, dest_lng, carrier_qualification, delivery_promise,
      complaint_rate, on_time_rate, price_per_ton, description, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const routeItems = [
    [6, '深京快线', '广东省', '深圳市', '北京市', '北京市', 22.5431, 113.9578, 39.9219, 116.4435, 'AAAA级物流企业', '48小时送达', 0.5, 98.5, 450, '深圳至北京直达专线，全程高速，GPS实时追踪', 'active'],
    [7, '穗沪速运', '广东省', '广州市', '上海市', '上海市', 23.1485, 113.2659, 31.2304, 121.4737, 'AAAA级物流企业', '36小时送达', 0.8, 97.2, 380, '广州至上海直达专线，冷链可选', 'active'],
    [6, '汉蓉专线', '湖北省', '武汉市', '四川省', '成都市', 30.4995, 114.4026, 30.5728, 104.0668, 'AAA级物流企业', '48小时送达', 1.2, 95.8, 320, '武汉至成都专线，覆盖川渝地区', 'active'],
    [7, '苏鲁货运', '江苏省', '南京市', '山东省', '济南市', 32.0603, 118.7969, 36.6512, 117.1201, '', '72小时送达', 2.5, 90.5, 280, '南京至济南普通货运专线，价格优惠', 'inactive'],
    [6, '沪甬快线', '上海市', '上海市', '浙江省', '宁波市', 31.2304, 121.4737, 29.9147, 121.8276, 'AAAA级物流企业', '24小时送达', 0.3, 99.2, 520, '上海至宁波直达快线，资质审核中', 'pending_review'],
  ] as const;

  const routeInsert = db.transaction(() => {
    for (const r of routeItems) {
      insertRoute.run(...r);
    }
  });
  routeInsert();

  const insertContract = db.prepare(`
    INSERT INTO contracts (shipper_id, carrier_id, cargo_id, vehicle_id, contract_number, content,
      shipper_signature, carrier_signature, shipper_signature_time, carrier_signature_time, ca_serial, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const contractItems = [
    [2, 6, 5, 1, 'CT-2024-000001', '托运方委托承运方运输数控机床一台，从广东省东莞市至河南省郑州市，运费35000元，承运方需确保货物安全、准时送达。', '张伟', '刘建国', '2024-06-28T10:30:00', '2024-06-28T14:20:00', 'CA-20240628-000001', 'signed'],
    [2, 7, 2, 2, 'CT-2024-000002', '托运方委托承运方运输进口水果一批，从广东省广州市至上海市，需全程冷链2-8°C，运费22000元。', '张伟', '', '2024-07-01T09:00:00', '', '', 'signing'],
    [3, 6, 3, 4, 'CT-2024-000003', '托运方委托承运方运输建筑钢材一批，从广东省佛山市至湖北省武汉市，运费28000元。', '', '', '', '', '', 'draft'],
    [3, 7, 4, 3, 'CT-2024-000004', '托运方委托承运方运输服装面料一批，从浙江省杭州市至四川省成都市，运费18000元，已完成运输。', '李明', '陈志远', '2024-06-25T11:00:00', '2024-06-25T15:30:00', 'CA-20240625-000004', 'archived'],
  ] as const;

  const contractInsert = db.transaction(() => {
    for (const c of contractItems) {
      insertContract.run(...c);
    }
  });
  contractInsert();

  const insertTask = db.prepare(`
    INSERT INTO transport_tasks (cargo_id, vehicle_id, contract_id, shipper_id, driver_id, status,
      actual_loading_time, actual_delivery_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const taskItems = [
    [5, 1, 1, 2, 4, 'in_transit', '2024-07-06T08:00:00', null],
    [2, 2, 2, 2, 5, 'pending_loading', null, null],
  ] as const;

  const taskInsert = db.transaction(() => {
    for (const t of taskItems) {
      insertTask.run(...t);
    }
  });
  taskInsert();

  const insertCheckin = db.prepare(`
    INSERT INTO checkin_records (task_id, user_id, checkin_type, latitude, longitude, address, photo_url, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const checkinItems = [
    [1, 4, 'loading', 22.8147, 113.7597, '广东省东莞市长安镇装货点', '', '已完成装货，货物完好'],
    [1, 4, 'in_transit', 28.2282, 112.9388, '湖南省长沙市服务区', '', '中途休息，车辆正常'],
  ] as const;

  const checkinInsert = db.transaction(() => {
    for (const c of checkinItems) {
      insertCheckin.run(...c);
    }
  });
  checkinInsert();

  const insertCostIndex = db.prepare(`
    INSERT INTO cost_indices (province, city, cost_index, period)
    VALUES (?, ?, ?, ?)
  `);

  const costIndexItems: (string | number)[][] = [];
  const provinces = [
    ['广东省', '深圳市'], ['广东省', '广州市'], ['北京市', '北京市'],
    ['上海市', '上海市'], ['湖北省', '武汉市'], ['浙江省', '杭州市'],
    ['河南省', '郑州市'], ['四川省', '成都市'],
  ];
  const periods = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06'];
  const baseIndices: Record<string, number> = {
    '广东省-深圳市': 1.25, '广东省-广州市': 1.18, '北京市-北京市': 1.22,
    '上海市-上海市': 1.30, '湖北省-武汉市': 1.05, '浙江省-杭州市': 1.15,
    '河南省-郑州市': 0.98, '四川省-成都市': 1.02,
  };

  for (const [province, city] of provinces) {
    const base = baseIndices[`${province}-${city}`] ?? 1.0;
    for (const period of periods) {
      const fluctuation = 1 + (Math.random() - 0.5) * 0.1;
      costIndexItems.push([province, city, Math.round(base * fluctuation * 100) / 100, period]);
    }
  }

  const costInsert = db.transaction(() => {
    for (const item of costIndexItems) {
      insertCostIndex.run(...item);
    }
  });
  costInsert();

  const insertSupplyDemand = db.prepare(`
    INSERT INTO supply_demand_stats (province, city, cargo_count, vehicle_count, match_rate, period)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const sdItems: (string | number)[][] = [];
  for (const [province, city] of provinces) {
    for (const period of periods) {
      const cargoCount = Math.round(100 + Math.random() * 200);
      const vehicleCount = Math.round(80 + Math.random() * 150);
      const matchRate = Math.round((0.6 + Math.random() * 0.3) * 100) / 100;
      sdItems.push([province, city, cargoCount, vehicleCount, matchRate, period]);
    }
  }

  const sdInsert = db.transaction(() => {
    for (const item of sdItems) {
      insertSupplyDemand.run(...item);
    }
  });
  sdInsert();

  const insertCompliance = db.prepare(`
    INSERT INTO compliance_logs (user_id, check_type, check_result, detail)
    VALUES (?, ?, ?, ?)
  `);

  const complianceItems: (string | number)[][] = [
    [4, 'license_check', 'pass', '驾驶证A2审验合格，有效期至2025-12'],
    [5, 'license_check', 'pass', '驾驶证A2审验合格，有效期至2025-06'],
    [6, 'qualification_check', 'pass', '道路运输经营许可证有效，AAA级企业'],
    [7, 'qualification_check', 'warning', '道路运输经营许可证将于3个月内到期'],
    [4, 'vehicle_inspection', 'pass', '粤B12345年检合格'],
    [5, 'vehicle_inspection', 'pass', '粤A67890年检合格'],
  ];

  const complianceInsert = db.transaction(() => {
    for (const item of complianceItems) {
      insertCompliance.run(...item);
    }
  });
  complianceInsert();
}

export { db };
