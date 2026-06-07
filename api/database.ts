import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataDir = path.join(__dirname, '..', 'data')

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'app.sqlite')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS dispatch_zones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    grid_bounds TEXT NOT NULL,
    online_riders INTEGER DEFAULT 0,
    pending_orders INTEGER DEFAULT 0,
    gap_forecast REAL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS riders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    id_card TEXT NOT NULL,
    health_code_status TEXT DEFAULT 'green',
    vehicle_type TEXT DEFAULT 'electric_bike',
    plate_number TEXT DEFAULT '',
    license_photos TEXT DEFAULT '',
    verify_status TEXT DEFAULT 'pending',
    service_score REAL DEFAULT 5.0,
    credit_score INTEGER DEFAULT 100,
    status TEXT DEFAULT 'offline',
    latitude REAL DEFAULT 0,
    longitude REAL DEFAULT 0,
    zone_id INTEGER,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (zone_id) REFERENCES dispatch_zones(id)
  );

  CREATE TABLE IF NOT EXISTS merchants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    zone_id INTEGER,
    verify_status TEXT DEFAULT 'pending',
    fulfillment_score REAL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (zone_id) REFERENCES dispatch_zones(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no TEXT NOT NULL UNIQUE,
    type TEXT DEFAULT 'instant',
    merchant_id INTEGER,
    pickup_address TEXT DEFAULT '',
    pickup_time_start TEXT DEFAULT '',
    pickup_time_end TEXT DEFAULT '',
    delivery_address TEXT DEFAULT '',
    delivery_time_start TEXT DEFAULT '',
    delivery_time_end TEXT DEFAULT '',
    cargo_type TEXT DEFAULT 'general',
    special_requirements TEXT DEFAULT '',
    status TEXT DEFAULT 'pending',
    rider_id INTEGER,
    zone_id INTEGER,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (merchant_id) REFERENCES merchants(id),
    FOREIGN KEY (rider_id) REFERENCES riders(id),
    FOREIGN KEY (zone_id) REFERENCES dispatch_zones(id)
  );

  CREATE TABLE IF NOT EXISTS trajectories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rider_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    longitude REAL NOT NULL,
    latitude REAL NOT NULL,
    timestamp TEXT DEFAULT (datetime('now', 'localtime')),
    is_abnormal INTEGER DEFAULT 0,
    FOREIGN KEY (rider_id) REFERENCES riders(id),
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );

  CREATE TABLE IF NOT EXISTS incomes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rider_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    delivery_fee REAL DEFAULT 0,
    tier_surcharge REAL DEFAULT 0,
    time_subsidy REAL DEFAULT 0,
    referral_bonus REAL DEFAULT 0,
    total_amount REAL DEFAULT 0,
    settle_status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (rider_id) REFERENCES riders(id),
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );

  CREATE TABLE IF NOT EXISTS credit_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rider_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    score_change INTEGER NOT NULL,
    reason TEXT NOT NULL,
    order_id INTEGER,
    appeal_status TEXT DEFAULT 'none',
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (rider_id) REFERENCES riders(id),
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );

  CREATE TABLE IF NOT EXISTS dispatch_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    rider_id INTEGER NOT NULL,
    dispatch_type TEXT DEFAULT 'auto',
    weight_score REAL DEFAULT 0,
    rider_response TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (rider_id) REFERENCES riders(id)
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    rider_id INTEGER,
    order_id INTEGER,
    zone_id INTEGER,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    handled_at TEXT,
    FOREIGN KEY (rider_id) REFERENCES riders(id),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (zone_id) REFERENCES dispatch_zones(id)
  );

  CREATE TABLE IF NOT EXISTS pricing_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    base_distance REAL DEFAULT 3,
    base_fee REAL DEFAULT 5,
    extra_per_km REAL DEFAULT 1.5,
    time_start TEXT DEFAULT '',
    time_end TEXT DEFAULT '',
    subsidy_rate REAL DEFAULT 0,
    tier_thresholds TEXT DEFAULT '',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS risk_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    condition_config TEXT NOT NULL,
    action_config TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    priority INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS verify_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    target_type TEXT NOT NULL,
    target_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    operator TEXT DEFAULT 'system',
    reason TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );
`)

const seedZones = db.prepare('SELECT COUNT(*) as count FROM dispatch_zones').get() as { count: number }

if (seedZones.count === 0) {
  const insertZone = db.prepare(`
    INSERT INTO dispatch_zones (name, grid_bounds, online_riders, pending_orders, gap_forecast)
    VALUES (?, ?, ?, ?, ?)
  `)

  const zones = [
    ['北京朝阳区CBD', '{"min_lng":116.44,"max_lng":116.50,"min_lat":39.90,"max_lat":39.93}', 8, 5, 2.3],
    ['北京海淀区中关村', '{"min_lng":116.30,"max_lng":116.35,"min_lat":39.96,"max_lat":39.99}', 6, 3, 1.5],
    ['上海浦东陆家嘴', '{"min_lng":121.50,"max_lng":121.55,"min_lat":31.23,"max_lat":31.25}', 7, 4, 1.8],
    ['上海徐汇衡山路', '{"min_lng":121.43,"max_lng":121.48,"min_lat":31.19,"max_lat":31.21}', 5, 2, 0.9],
    ['深圳南山科技园', '{"min_lng":113.93,"max_lng":113.98,"min_lat":22.53,"max_lat":22.56}', 9, 6, 3.1],
    ['深圳福田CBD', '{"min_lng":114.05,"max_lng":114.10,"min_lat":22.53,"max_lat":22.56}', 6, 3, 1.2],
  ]

  const insertZones = db.transaction((data: any[]) => {
    for (const z of data) insertZone.run(...z)
  })
  insertZones(zones)

  const insertRider = db.prepare(`
    INSERT INTO riders (name, phone, id_card, health_code_status, vehicle_type, plate_number, verify_status, service_score, credit_score, status, latitude, longitude, zone_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const riders = [
    ['张伟', '13800001001', '110101199001011234', 'green', 'electric_bike', '京A12345', 'approved', 4.8, 98, 'online', 39.915, 116.470, 1],
    ['李强', '13800001002', '110101199002021235', 'green', 'electric_bike', '京A12346', 'approved', 4.5, 92, 'online', 39.910, 116.475, 1],
    ['王磊', '13800001003', '110101199003031236', 'green', 'electric_bike', '京A12347', 'approved', 4.9, 96, 'online', 39.975, 116.325, 2],
    ['赵刚', '13800001004', '110101199004041237', 'yellow', 'electric_bike', '京A12348', 'approved', 4.2, 85, 'online', 39.970, 116.330, 2],
    ['刘洋', '13800001005', '310101199005051238', 'green', 'electric_bike', '沪B23456', 'approved', 4.7, 94, 'online', 31.240, 121.525, 3],
    ['陈明', '13800001006', '310101199006061239', 'green', 'electric_bike', '沪B23457', 'approved', 4.6, 91, 'online', 31.235, 121.530, 3],
    ['杨帆', '13800001007', '310101199007071240', 'green', 'electric_bike', '沪B23458', 'approved', 4.3, 88, 'online', 31.200, 121.455, 4],
    ['黄海', '13800001008', '310101199008081241', 'green', 'electric_bike', '沪B23459', 'approved', 4.4, 89, 'online', 31.195, 121.460, 4],
    ['周杰', '13800001009', '440301199009091242', 'green', 'electric_bike', '粤C34567', 'approved', 4.9, 97, 'online', 22.545, 113.955, 5],
    ['吴昊', '13800001010', '440301199010101243', 'green', 'electric_bike', '粤C34568', 'approved', 4.6, 93, 'online', 22.550, 113.960, 5],
    ['徐磊', '13800001011', '440301199011111244', 'green', 'electric_bike', '粤C34569', 'approved', 4.5, 90, 'online', 22.545, 114.075, 6],
    ['孙涛', '13800001012', '440301199012121245', 'green', 'electric_bike', '粤C34570', 'approved', 4.7, 95, 'online', 22.550, 114.080, 6],
    ['马云飞', '13800001013', '110101199101011246', 'green', 'electric_bike', '京A12349', 'pending', 0, 100, 'offline', 39.920, 116.465, 1],
    ['朱志强', '13800001014', '110101199102021247', 'green', 'electric_bike', '京A12350', 'rejected', 0, 60, 'offline', 39.980, 116.320, 2],
    ['胡建华', '13800001015', '310101199103031248', 'green', 'electric_bike', '沪B23460', 'pending', 0, 100, 'offline', 31.245, 121.520, 3],
    ['郭永刚', '13800001016', '310101199104041249', 'red', 'electric_bike', '沪B23461', 'approved', 3.8, 72, 'offline', 31.205, 121.450, 4],
    ['林小明', '13800001017', '440301199105051250', 'green', 'electric_bike', '粤C34571', 'approved', 4.1, 83, 'delivering', 22.548, 113.952, 5],
    ['何大伟', '13800001018', '440301199106061251', 'green', 'electric_bike', '粤C34572', 'approved', 4.4, 87, 'delivering', 22.548, 114.072, 6],
    ['罗建国', '13800001019', '110101199107071252', 'green', 'electric_bike', '京A12351', 'approved', 4.0, 80, 'online', 39.912, 116.472, 1],
    ['谢文东', '13800001020', '110101199108081253', 'green', 'electric_bike', '京A12352', 'approved', 4.3, 86, 'online', 39.972, 116.328, 2],
  ]

  const insertRiders = db.transaction((data: any[]) => {
    for (const r of data) insertRider.run(...r)
  })
  insertRiders(riders)

  const insertMerchant = db.prepare(`
    INSERT INTO merchants (name, contact_name, phone, address, zone_id, verify_status, fulfillment_score)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const merchants = [
    ['星巴克国贸店', '王经理', '010-65001234', '北京市朝阳区建国门外大街1号国贸商城B1', 1, 'approved', 95.2],
    ['海底捞中关村店', '李经理', '010-82001234', '北京市海淀区中关村大街15号', 2, 'approved', 92.8],
    ['麦当劳陆家嘴店', '张经理', '021-58001234', '上海市浦东新区陆家嘴环路1000号', 3, 'approved', 97.1],
    ['肯德基衡山路店', '陈经理', '021-64001234', '上海市徐汇区衡山路10号', 4, 'approved', 94.5],
    ['瑞幸科技园店', '周经理', '0755-26001234', '深圳市南山区科技园路8号', 5, 'approved', 91.3],
    ['喜茶福田COCO Park店', '吴经理', '0755-83001234', '深圳市福田区福华三路COCO Park', 6, 'approved', 96.7],
    ['全聚德前门店', '赵经理', '010-67001234', '北京市东城区前门大街30号', 1, 'approved', 88.9],
    ['必胜客五道口店', '刘经理', '010-62001234', '北京市海淀区成府路28号', 2, 'pending', 0],
    ['汉堡王世纪大道店', '黄经理', '021-61001234', '上海市浦东新区世纪大道100号', 3, 'pending', 0],
    ['奈雪南山店', '杨经理', '0755-22001234', '深圳市南山区南海大道1086号', 5, 'rejected', 0],
  ]

  const insertMerchants = db.transaction((data: any[]) => {
    for (const m of data) insertMerchant.run(...m)
  })
  insertMerchants(merchants)

  const insertOrder = db.prepare(`
    INSERT INTO orders (order_no, type, merchant_id, pickup_address, pickup_time_start, pickup_time_end, delivery_address, delivery_time_start, delivery_time_end, cargo_type, special_requirements, status, rider_id, zone_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const orders = [
    ['DD2026060400001', 'instant', 1, '北京市朝阳区建国门外大街1号国贸商城B1', '2026-06-04 10:00', '2026-06-04 10:10', '北京市朝阳区光华路9号', '2026-06-04 10:15', '2026-06-04 10:30', 'food', '', 'completed', 1, 1],
    ['DD2026060400002', 'instant', 1, '北京市朝阳区建国门外大街1号国贸商城B1', '2026-06-04 10:30', '2026-06-04 10:40', '北京市朝阳区东三环中路39号', '2026-06-04 10:45', '2026-06-04 11:00', 'food', '', 'completed', 2, 1],
    ['DD2026060400003', 'instant', 2, '北京市海淀区中关村大街15号', '2026-06-04 11:00', '2026-06-04 11:10', '北京市海淀区知春路76号', '2026-06-04 11:15', '2026-06-04 11:30', 'food', '小心轻放', 'completed', 3, 2],
    ['DD2026060400004', 'instant', 3, '上海市浦东新区陆家嘴环路1000号', '2026-06-04 11:30', '2026-06-04 11:40', '上海市浦东新区世纪大道100号', '2026-06-04 11:45', '2026-06-04 12:00', 'food', '', 'completed', 5, 3],
    ['DD2026060400005', 'instant', 5, '深圳市南山区科技园路8号', '2026-06-04 12:00', '2026-06-04 12:10', '深圳市南山区深南大道9966号', '2026-06-04 12:15', '2026-06-04 12:30', 'drink', '', 'completed', 9, 5],
    ['DD2026060400006', 'instant', 6, '深圳市福田区福华三路COCO Park', '2026-06-04 12:30', '2026-06-04 12:40', '深圳市福田区深南中路1002号', '2026-06-04 12:45', '2026-06-04 13:00', 'drink', '', 'completed', 11, 6],
    ['DD2026060400007', 'instant', 7, '北京市东城区前门大街30号', '2026-06-04 13:00', '2026-06-04 13:10', '北京市东城区崇文门外大街18号', '2026-06-04 13:15', '2026-06-04 13:30', 'food', '保温配送', 'delivering', 1, 1],
    ['DD2026060400008', 'instant', 2, '北京市海淀区中关村大街15号', '2026-06-04 13:30', '2026-06-04 13:40', '北京市海淀区学院路30号', '2026-06-04 13:45', '2026-06-04 14:00', 'food', '', 'delivering', 4, 2],
    ['DD2026060400009', 'instant', 4, '上海市徐汇区衡山路10号', '2026-06-04 14:00', '2026-06-04 14:10', '上海市徐汇区漕溪北路398号', '2026-06-04 14:15', '2026-06-04 14:30', 'food', '', 'delivering', 7, 4],
    ['DD2026060400010', 'instant', 3, '上海市浦东新区陆家嘴环路1000号', '2026-06-04 14:30', '2026-06-04 14:40', '上海市浦东新区张杨路500号', '2026-06-04 14:45', '2026-06-04 15:00', 'food', '', 'picking_up', 6, 3],
    ['DD2026060400011', 'instant', 5, '深圳市南山区科技园路8号', '2026-06-04 15:00', '2026-06-04 15:10', '深圳市南山区科苑路15号', '2026-06-04 15:15', '2026-06-04 15:30', 'drink', '', 'picking_up', 10, 5],
    ['DD2026060400012', 'instant', 6, '深圳市福田区福华三路COCO Park', '2026-06-04 15:30', '2026-06-04 15:40', '深圳市福田区彩田路6002号', '2026-06-04 15:45', '2026-06-04 16:00', 'drink', '加冰配送', 'dispatched', 12, 6],
    ['DD2026060400013', 'instant', 1, '北京市朝阳区建国门外大街1号国贸商城B1', '2026-06-04 16:00', '2026-06-04 16:10', '北京市朝阳区朝外大街18号', '2026-06-04 16:15', '2026-06-04 16:30', 'food', '', 'dispatched', 19, 1],
    ['DD2026060400014', 'instant', 2, '北京市海淀区中关村大街15号', '2026-06-04 16:30', '2026-06-04 16:40', '北京市海淀区北四环西路68号', '2026-06-04 16:45', '2026-06-04 17:00', 'food', '', 'dispatched', 20, 2],
    ['DD2026060400015', 'instant', 4, '上海市徐汇区衡山路10号', '2026-06-04 17:00', '2026-06-04 17:10', '上海市徐汇区宜山路700号', '2026-06-04 17:15', '2026-06-04 17:30', 'food', '', 'dispatched', 8, 4],
    ['DD2026060400016', 'instant', 7, '北京市东城区前门大街30号', '2026-06-04 17:30', '2026-06-04 17:40', '北京市东城区东四北大街200号', '2026-06-04 17:45', '2026-06-04 18:00', 'food', '', 'pending', null, 1],
    ['DD2026060400017', 'instant', 1, '北京市朝阳区建国门外大街1号国贸商城B1', '2026-06-04 18:00', '2026-06-04 18:10', '北京市朝阳区劲松南路1号', '2026-06-04 18:15', '2026-06-04 18:30', 'food', '', 'pending', null, 1],
    ['DD2026060400018', 'instant', 2, '北京市海淀区中关村大街15号', '2026-06-04 18:30', '2026-06-04 18:40', '北京市海淀区清华东路35号', '2026-06-04 18:45', '2026-06-04 19:00', 'food', '', 'pending', null, 2],
    ['DD2026060400019', 'instant', 3, '上海市浦东新区陆家嘴环路1000号', '2026-06-04 19:00', '2026-06-04 19:10', '上海市浦东新区民生路1199号', '2026-06-04 19:15', '2026-06-04 19:30', 'food', '', 'pending', null, 3],
    ['DD2026060400020', 'instant', 5, '深圳市南山区科技园路8号', '2026-06-04 19:30', '2026-06-04 19:40', '深圳市南山区沙河西路2000号', '2026-06-04 19:45', '2026-06-04 20:00', 'drink', '', 'pending', null, 5],
    ['DD2026060400021', 'scheduled', 6, '深圳市福田区福华三路COCO Park', '2026-06-04 20:00', '2026-06-04 20:10', '深圳市福田区红荔西路8008号', '2026-06-04 20:15', '2026-06-04 20:30', 'drink', '', 'pending', null, 6],
    ['DD2026060400022', 'instant', 1, '北京市朝阳区建国门外大街1号国贸商城B1', '2026-06-04 08:00', '2026-06-04 08:10', '北京市朝阳区建国路89号', '2026-06-04 08:15', '2026-06-04 08:30', 'food', '', 'completed', 1, 1],
    ['DD2026060400023', 'instant', 3, '上海市浦东新区陆家嘴环路1000号', '2026-06-04 09:00', '2026-06-04 09:10', '上海市浦东新区银城中路200号', '2026-06-04 09:15', '2026-06-04 09:30', 'food', '', 'completed', 5, 3],
    ['DD2026060400024', 'instant', 2, '北京市海淀区中关村大街15号', '2026-06-04 09:30', '2026-06-04 09:40', '北京市海淀区上地十街10号', '2026-06-04 09:45', '2026-06-04 10:00', 'food', '易碎品', 'cancelled', null, 2],
    ['DD2026060400025', 'instant', 4, '上海市徐汇区衡山路10号', '2026-06-04 08:30', '2026-06-04 08:40', '上海市徐汇区零陵路800号', '2026-06-04 08:45', '2026-06-04 09:00', 'food', '', 'completed', 8, 4],
    ['DD2026060400026', 'instant', 5, '深圳市南山区科技园路8号', '2026-06-04 09:00', '2026-06-04 09:10', '深圳市南山区科华路8号', '2026-06-04 09:15', '2026-06-04 09:30', 'drink', '', 'completed', 9, 5],
    ['DD2026060400027', 'instant', 6, '深圳市福田区福华三路COCO Park', '2026-06-04 10:00', '2026-06-04 10:10', '深圳市福田区深南大道6013号', '2026-06-04 10:15', '2026-06-04 10:30', 'drink', '', 'completed', 11, 6],
    ['DD2026060400028', 'instant', 7, '北京市东城区前门大街30号', '2026-06-04 09:00', '2026-06-04 09:10', '北京市东城区王府井大街255号', '2026-06-04 09:15', '2026-06-04 09:30', 'food', '保温配送', 'completed', 19, 1],
    ['DD2026060400029', 'instant', 3, '上海市浦东新区陆家嘴环路1000号', '2026-06-04 12:00', '2026-06-04 12:10', '上海市浦东新区潍坊路100号', '2026-06-04 12:15', '2026-06-04 12:30', 'food', '', 'completed', 6, 3],
    ['DD2026060400030', 'instant', 4, '上海市徐汇区衡山路10号', '2026-06-04 13:00', '2026-06-04 13:10', '上海市徐汇区田林路388号', '2026-06-04 13:15', '2026-06-04 13:30', 'food', '', 'completed', 7, 4],
  ]

  const insertOrders = db.transaction((data: any[]) => {
    for (const o of data) insertOrder.run(...o)
  })
  insertOrders(orders)

  const insertTrajectory = db.prepare(`
    INSERT INTO trajectories (rider_id, order_id, longitude, latitude, timestamp, is_abnormal)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const trajectories = [
    [1, 1, 116.470, 39.915, '2026-06-04 10:05:00', 0],
    [1, 1, 116.465, 39.912, '2026-06-04 10:08:00', 0],
    [1, 1, 116.458, 39.910, '2026-06-04 10:12:00', 0],
    [1, 1, 116.450, 39.907, '2026-06-04 10:18:00', 0],
    [1, 1, 116.445, 39.905, '2026-06-04 10:25:00', 0],
    [2, 2, 116.475, 39.910, '2026-06-04 10:35:00', 0],
    [2, 2, 116.468, 39.907, '2026-06-04 10:38:00', 0],
    [2, 2, 116.460, 39.905, '2026-06-04 10:42:00', 0],
    [2, 2, 116.452, 39.902, '2026-06-04 10:50:00', 0],
    [3, 3, 116.325, 39.975, '2026-06-04 11:05:00', 0],
    [3, 3, 116.320, 39.972, '2026-06-04 11:08:00', 0],
    [3, 3, 116.315, 39.968, '2026-06-04 11:12:00', 0],
    [3, 3, 116.310, 39.965, '2026-06-04 11:18:00', 0],
    [5, 4, 121.525, 31.240, '2026-06-04 11:35:00', 0],
    [5, 4, 121.520, 31.237, '2026-06-04 11:38:00', 0],
    [5, 4, 121.515, 31.235, '2026-06-04 11:42:00', 0],
    [5, 4, 121.510, 31.232, '2026-06-04 11:48:00', 0],
    [9, 5, 113.955, 22.545, '2026-06-04 12:05:00', 0],
    [9, 5, 113.950, 22.542, '2026-06-04 12:08:00', 0],
    [9, 5, 113.945, 22.540, '2026-06-04 12:12:00', 0],
    [1, 7, 116.470, 39.915, '2026-06-04 13:05:00', 0],
    [1, 7, 116.465, 39.912, '2026-06-04 13:08:00', 1],
    [1, 7, 116.458, 39.910, '2026-06-04 13:12:00', 0],
    [1, 7, 116.450, 39.907, '2026-06-04 13:18:00', 0],
    [4, 8, 116.330, 39.970, '2026-06-04 13:35:00', 0],
    [4, 8, 116.325, 39.968, '2026-06-04 13:38:00', 1],
    [4, 8, 116.320, 39.965, '2026-06-04 13:42:00', 0],
    [7, 9, 121.455, 31.200, '2026-06-04 14:05:00', 0],
    [7, 9, 121.450, 31.197, '2026-06-04 14:08:00', 0],
    [7, 9, 121.445, 31.195, '2026-06-04 14:12:00', 0],
  ]

  const insertTrajectories = db.transaction((data: any[]) => {
    for (const t of data) insertTrajectory.run(...t)
  })
  insertTrajectories(trajectories)

  const insertIncome = db.prepare(`
    INSERT INTO incomes (rider_id, order_id, delivery_fee, tier_surcharge, time_subsidy, referral_bonus, total_amount, settle_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const incomes = [
    [1, 1, 8.0, 1.0, 0.5, 0, 9.5, 'settled'],
    [2, 2, 7.5, 1.0, 0, 0, 8.5, 'settled'],
    [3, 3, 9.0, 1.5, 0.5, 0, 11.0, 'settled'],
    [5, 4, 8.5, 1.0, 0.5, 0, 10.0, 'settled'],
    [9, 5, 7.0, 0.5, 0, 0, 7.5, 'settled'],
    [11, 6, 6.5, 0.5, 0, 0, 7.0, 'settled'],
    [1, 22, 8.0, 1.0, 1.0, 0, 10.0, 'settled'],
    [5, 23, 7.5, 1.0, 0, 0, 8.5, 'settled'],
    [8, 25, 6.5, 0.5, 0, 0, 7.0, 'settled'],
    [9, 26, 7.0, 0.5, 0, 0, 7.5, 'settled'],
    [11, 27, 6.5, 0.5, 0.5, 0, 7.5, 'settled'],
    [19, 28, 9.0, 1.5, 1.0, 0, 11.5, 'settled'],
    [6, 29, 8.0, 1.0, 0.5, 0, 9.5, 'pending'],
    [7, 30, 7.5, 1.0, 0, 0, 8.5, 'pending'],
    [1, 7, 8.0, 1.0, 0.5, 0, 9.5, 'pending'],
  ]

  const insertIncomes = db.transaction((data: any[]) => {
    for (const i of data) insertIncome.run(...i)
  })
  insertIncomes(incomes)

  const insertCredit = db.prepare(`
    INSERT INTO credit_records (rider_id, type, score_change, reason, order_id, appeal_status)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const creditRecords = [
    [4, 'deduct', -5, '配送超时15分钟', 8, 'none'],
    [4, 'deduct', -3, '客户投诉态度不好', 8, 'appealed'],
    [4, 'reward', 5, '高峰期积极接单', null, 'none'],
    [20, 'reward', 5, '连续完成10单无差评', null, 'none'],
    [20, 'deduct', -3, '配送轻微超时', 14, 'none'],
    [20, 'deduct', -5, '客户投诉服务态度', 14, 'appealed'],
    [16, 'deduct', -10, '健康码异常仍接单', null, 'none'],
    [14, 'deduct', -8, '资质审核不通过', null, 'rejected'],
    [1, 'reward', 5, '连续完成10单无差评', null, 'none'],
    [9, 'reward', 3, '客户好评加信', 5, 'none'],
    [3, 'reward', 5, '高峰期积极接单', 3, 'none'],
    [7, 'deduct', -2, '配送轻微超时', 9, 'none'],
    [19, 'reward', 3, '协助新骑手培训', null, 'none'],
    [1, 'deduct', -2, '取餐延迟5分钟', 7, 'none'],
  ]

  const insertCredits = db.transaction((data: any[]) => {
    for (const c of data) insertCredit.run(...c)
  })
  insertCredits(creditRecords)

  const insertDispatchRecord = db.prepare(`
    INSERT INTO dispatch_records (order_id, rider_id, dispatch_type, weight_score, rider_response)
    VALUES (?, ?, ?, ?, ?)
  `)

  const dispatchRecords = [
    [1, 1, 'auto', 92.5, 'accepted'],
    [2, 2, 'auto', 88.3, 'accepted'],
    [3, 3, 'auto', 91.2, 'accepted'],
    [4, 5, 'auto', 89.7, 'accepted'],
    [5, 9, 'auto', 93.1, 'accepted'],
    [6, 11, 'auto', 87.4, 'accepted'],
    [7, 1, 'auto', 90.8, 'accepted'],
    [8, 4, 'auto', 82.1, 'accepted'],
    [9, 7, 'auto', 85.6, 'accepted'],
    [10, 6, 'auto', 88.9, 'pending'],
    [11, 10, 'auto', 86.3, 'pending'],
    [12, 12, 'auto', 84.7, 'accepted'],
    [13, 19, 'auto', 81.5, 'accepted'],
    [14, 20, 'auto', 79.8, 'accepted'],
    [15, 8, 'auto', 83.2, 'accepted'],
    [16, 1, 'grab', 0, 'pending'],
    [17, 2, 'grab', 0, 'pending'],
  ]

  const insertDispatchRecords = db.transaction((data: any[]) => {
    for (const d of data) insertDispatchRecord.run(...d)
  })
  insertDispatchRecords(dispatchRecords)

  const insertAlert = db.prepare(`
    INSERT INTO alerts (type, rider_id, order_id, zone_id, description, status, created_at, handled_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const alerts = [
    ['trajectory_abnormal', 1, 7, null, '骑手轨迹偏离规划路线超过500米', 'pending', '2026-06-04 13:08:00', null],
    ['trajectory_abnormal', 4, 8, null, '骑手轨迹偏离规划路线超过300米', 'pending', '2026-06-04 13:38:00', null],
    ['health_code', 16, null, null, '骑手健康码状态异常(红色)', 'pending', '2026-06-04 08:00:00', null],
    ['delivery_timeout', 4, 8, null, '订单配送超时20分钟', 'handled', '2026-06-04 14:00:00', '2026-06-04 14:15:00'],
    ['complaint', 4, 8, null, '客户投诉骑手服务态度', 'handled', '2026-06-04 14:20:00', '2026-06-04 14:30:00'],
    ['verify_alert', 14, null, null, '骑手资质审核未通过，建议关注', 'handled', '2026-06-04 09:00:00', '2026-06-04 09:30:00'],
    ['order_cancel', null, 24, null, '订单在配送前被取消', 'handled', '2026-06-04 09:50:00', '2026-06-04 10:00:00'],
    ['high_load', null, null, 1, '朝阳区CBD区域运力不足，缺口2.3', 'pending', '2026-06-04 11:30:00', null],
  ]

  const insertAlerts = db.transaction((data: any[]) => {
    for (const a of data) insertAlert.run(...a)
  })
  insertAlerts(alerts)

  const insertPricingRule = db.prepare(`
    INSERT INTO pricing_rules (name, type, base_distance, base_fee, extra_per_km, time_start, time_end, subsidy_rate, tier_thresholds, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const pricingRules = [
    ['基础配送计价', 'base', 3.0, 5.0, 1.5, '', '', 0, '{"tier1":5,"tier2":10,"tier3":20}', 1],
    ['高峰时段补贴', 'peak', 3.0, 5.0, 2.0, '11:00', '13:00', 0.3, '{"tier1":5,"tier2":10,"tier3":20}', 1],
    ['恶劣天气补贴', 'weather', 3.0, 8.0, 2.5, '', '', 0.5, '{"tier1":3,"tier2":8,"tier3":15}', 1],
  ]

  const insertPricingRules = db.transaction((data: any[]) => {
    for (const p of data) insertPricingRule.run(...p)
  })
  insertPricingRules(pricingRules)

  const insertRiskRule = db.prepare(`
    INSERT INTO risk_rules (name, type, condition_config, action_config, is_active, priority)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const riskRules = [
    ['轨迹偏离预警', 'trajectory', '{"max_distance":500,"check_interval":30}', '{"action":"alert","notify":"dispatcher"}', 1, 10],
    ['健康码异常拦截', 'health_code', '{"status":"red,yellow"}', '{"action":"block","notify":"admin"}', 1, 20],
  ]

  const insertRiskRules = db.transaction((data: any[]) => {
    for (const r of data) insertRiskRule.run(...r)
  })
  insertRiskRules(riskRules)

  const insertVerifyLog = db.prepare(`
    INSERT INTO verify_logs (target_type, target_id, action, operator, reason)
    VALUES (?, ?, ?, ?, ?)
  `)

  const verifyLogs = [
    ['rider', 13, 'verify_approved', 'admin', '资质审核通过'],
    ['merchant', 8, 'verify_pending', 'system', '新商户待审核'],
    ['rider', 14, 'verify_rejected', 'admin', '资质信息不完整'],
    ['merchant', 10, 'verify_rejected', 'admin', '证照过期'],
  ]

  const insertVerifyLogs = db.transaction((data: any[]) => {
    for (const v of data) insertVerifyLog.run(...v)
  })
  insertVerifyLogs(verifyLogs)
}

export default db
