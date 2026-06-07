import BetterSqlite3 from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import { mkdirSync } from 'fs'

const Database = BetterSqlite3 as any

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbDir = path.join(__dirname, '..', 'data')
mkdirSync(dbDir, { recursive: true })

const dbPath = path.join(dbDir, 'app.sqlite')
const db = new Database(dbPath) as BetterSqlite3.Database

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS riders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    device_model TEXT,
    battery_health REAL DEFAULT 100,
    latitude REAL DEFAULT 0,
    longitude REAL DEFAULT 0,
    current_load INTEGER DEFAULT 0,
    max_load INTEGER DEFAULT 5,
    performance_rate REAL DEFAULT 0.95,
    is_novice INTEGER DEFAULT 1,
    novice_start_date TEXT,
    status TEXT DEFAULT 'online',
    total_orders INTEGER DEFAULT 0,
    total_income REAL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS rider_violations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rider_id INTEGER REFERENCES riders(id),
    type TEXT NOT NULL,
    description TEXT,
    order_id INTEGER,
    penalty_points INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS mentorships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mentor_id INTEGER REFERENCES riders(id),
    mentee_id INTEGER REFERENCES riders(id),
    status TEXT DEFAULT 'active',
    started_at TEXT DEFAULT CURRENT_TIMESTAMP,
    ended_at TEXT
  );

  CREATE TABLE IF NOT EXISTS novice_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rider_id INTEGER REFERENCES riders(id),
    card_type TEXT,
    reason TEXT,
    used INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS delivery_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no TEXT UNIQUE NOT NULL,
    pickup_lat REAL,
    pickup_lng REAL,
    pickup_address TEXT,
    pickup_geofence_radius REAL DEFAULT 500,
    delivery_lat REAL,
    delivery_lng REAL,
    delivery_address TEXT,
    delivery_geofence_radius REAL DEFAULT 500,
    estimated_pickup_time TEXT,
    estimated_delivery_time TEXT,
    delivery_time_window_start TEXT,
    delivery_time_window_end TEXT,
    weight REAL DEFAULT 0,
    status TEXT DEFAULT 'pending',
    rider_id INTEGER REFERENCES riders(id),
    base_fee REAL DEFAULT 0,
    reward REAL DEFAULT 0,
    subsidy REAL DEFAULT 0,
    timeout_penalty_tier INTEGER DEFAULT 0,
    timeout_penalty_amount REAL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    assigned_at TEXT,
    picked_up_at TEXT,
    delivered_at TEXT
  );

  CREATE TABLE IF NOT EXISTS capacity_grids (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    grid_code TEXT UNIQUE NOT NULL,
    grid_name TEXT NOT NULL,
    center_lat REAL,
    center_lng REAL,
    heat_density REAL DEFAULT 0,
    rider_count INTEGER DEFAULT 0,
    active_orders INTEGER DEFAULT 0,
    load_balance_coefficient REAL DEFAULT 1.0,
    weather_factor REAL DEFAULT 1.0,
    weather_description TEXT DEFAULT 'sunny',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS training_scenarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT,
    content TEXT NOT NULL,
    difficulty TEXT DEFAULT 'easy',
    video_url TEXT,
    pass_score INTEGER DEFAULT 60,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS training_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rider_id INTEGER REFERENCES riders(id),
    scenario_id INTEGER REFERENCES training_scenarios(id),
    score INTEGER,
    passed INTEGER DEFAULT 0,
    completed_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS gps_tracks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rider_id INTEGER REFERENCES riders(id),
    order_id INTEGER REFERENCES delivery_orders(id),
    latitude REAL,
    longitude REAL,
    speed REAL DEFAULT 0,
    heading REAL DEFAULT 0,
    recorded_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS monitoring_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rider_id INTEGER REFERENCES riders(id),
    order_id INTEGER REFERENCES delivery_orders(id),
    alert_type TEXT,
    severity TEXT DEFAULT 'warning',
    message TEXT,
    resolved INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    resolved_at TEXT
  );

  CREATE TABLE IF NOT EXISTS dispatch_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER REFERENCES delivery_orders(id),
    rider_id INTEGER REFERENCES riders(id),
    score REAL,
    dispatch_reason TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`)

const riderCount = (db.prepare('SELECT COUNT(*) as count FROM riders').get() as any).count

if (riderCount === 0) {
  const insertRider = db.prepare(`
    INSERT INTO riders (name, phone, device_model, battery_health, latitude, longitude, current_load, max_load, performance_rate, is_novice, novice_start_date, status, total_orders, total_income)
    VALUES (@name, @phone, @device_model, @battery_health, @latitude, @longitude, @current_load, @max_load, @performance_rate, @is_novice, @novice_start_date, @status, @total_orders, @total_income)
  `)

  const ridersData = [
    { name: '张伟', phone: '13800001001', device_model: 'iPhone 15', battery_health: 95, latitude: 39.9042, longitude: 116.4074, current_load: 2, max_load: 5, performance_rate: 0.98, is_novice: 0, novice_start_date: null, status: 'online', total_orders: 1520, total_income: 22800 },
    { name: '李娜', phone: '13800001002', device_model: 'Xiaomi 14', battery_health: 88, latitude: 39.9142, longitude: 116.4174, current_load: 1, max_load: 5, performance_rate: 0.96, is_novice: 0, novice_start_date: null, status: 'busy', total_orders: 980, total_income: 14700 },
    { name: '王磊', phone: '13800001003', device_model: 'Huawei Mate60', battery_health: 72, latitude: 39.8942, longitude: 116.3974, current_load: 3, max_load: 5, performance_rate: 0.91, is_novice: 0, novice_start_date: null, status: 'online', total_orders: 2100, total_income: 31500 },
    { name: '刘洋', phone: '13800001004', device_model: 'OPPO Find X7', battery_health: 100, latitude: 39.9242, longitude: 116.4274, current_load: 0, max_load: 5, performance_rate: 0.85, is_novice: 1, novice_start_date: '2026-05-01', status: 'online', total_orders: 45, total_income: 675 },
    { name: '陈静', phone: '13800001005', device_model: 'vivo X100', battery_health: 91, latitude: 39.8842, longitude: 116.3874, current_load: 2, max_load: 5, performance_rate: 0.97, is_novice: 0, novice_start_date: null, status: 'online', total_orders: 1340, total_income: 20100 },
    { name: '赵强', phone: '13800001006', device_model: 'iPhone 14', battery_health: 80, latitude: 39.9342, longitude: 116.4374, current_load: 0, max_load: 5, performance_rate: 0.88, is_novice: 1, novice_start_date: '2026-04-15', status: 'offline', total_orders: 120, total_income: 1800 },
    { name: '孙丽', phone: '13800001007', device_model: 'Samsung S24', battery_health: 65, latitude: 39.8742, longitude: 116.3774, current_load: 4, max_load: 5, performance_rate: 0.93, is_novice: 0, novice_start_date: null, status: 'busy', total_orders: 870, total_income: 13050 },
    { name: '周鹏', phone: '13800001008', device_model: 'Redmi K70', battery_health: 100, latitude: 39.9442, longitude: 116.4474, current_load: 0, max_load: 5, performance_rate: 0.78, is_novice: 1, novice_start_date: '2026-05-20', status: 'online', total_orders: 18, total_income: 270 },
    { name: '吴芳', phone: '13800001009', device_model: 'Huawei P60', battery_health: 87, latitude: 39.9042, longitude: 116.4574, current_load: 1, max_load: 5, performance_rate: 0.95, is_novice: 0, novice_start_date: null, status: 'online', total_orders: 660, total_income: 9900 },
    { name: '郑浩', phone: '13800001010', device_model: 'iPhone 15 Pro', battery_health: 93, latitude: 39.9142, longitude: 116.3674, current_load: 2, max_load: 5, performance_rate: 0.99, is_novice: 0, novice_start_date: null, status: 'online', total_orders: 2800, total_income: 42000 },
    { name: '马超', phone: '13800001011', device_model: 'OnePlus 12', battery_health: 76, latitude: 39.8842, longitude: 116.4274, current_load: 3, max_load: 5, performance_rate: 0.90, is_novice: 0, novice_start_date: null, status: 'busy', total_orders: 540, total_income: 8100 },
    { name: '黄敏', phone: '13800001012', device_model: 'Xiaomi 13', battery_health: 100, latitude: 39.9342, longitude: 116.3974, current_load: 0, max_load: 5, performance_rate: 0.82, is_novice: 1, novice_start_date: '2026-05-10', status: 'online', total_orders: 32, total_income: 480 },
    { name: '林涛', phone: '13800001013', device_model: 'vivo S18', battery_health: 84, latitude: 39.8742, longitude: 116.4174, current_load: 1, max_load: 5, performance_rate: 0.94, is_novice: 0, novice_start_date: null, status: 'online', total_orders: 1100, total_income: 16500 },
    { name: '何婷', phone: '13800001014', device_model: 'OPPO Reno11', battery_health: 100, latitude: 39.9042, longitude: 116.4374, current_load: 0, max_load: 5, performance_rate: 0.80, is_novice: 1, novice_start_date: '2026-05-25', status: 'online', total_orders: 8, total_income: 120 },
    { name: '罗杰', phone: '13800001015', device_model: 'iPhone 14 Pro', battery_health: 90, latitude: 39.9242, longitude: 116.3874, current_load: 2, max_load: 5, performance_rate: 0.96, is_novice: 0, novice_start_date: null, status: 'online', total_orders: 1750, total_income: 26250 },
    { name: '谢军', phone: '13800001016', device_model: 'Huawei Nova12', battery_health: 97, latitude: 39.8942, longitude: 116.4474, current_load: 0, max_load: 5, performance_rate: 0.87, is_novice: 1, novice_start_date: '2026-04-28', status: 'offline', total_orders: 95, total_income: 1425 },
    { name: '韩雪', phone: '13800001017', device_model: 'Samsung A55', battery_health: 82, latitude: 39.9142, longitude: 116.3774, current_load: 1, max_load: 5, performance_rate: 0.92, is_novice: 0, novice_start_date: null, status: 'online', total_orders: 430, total_income: 6450 },
    { name: '唐峰', phone: '13800001018', device_model: 'Redmi Note13', battery_health: 100, latitude: 39.9442, longitude: 116.4074, current_load: 0, max_load: 5, performance_rate: 0.76, is_novice: 1, novice_start_date: '2026-05-28', status: 'online', total_orders: 5, total_income: 75 },
    { name: '许晴', phone: '13800001019', device_model: 'iPhone 15', battery_health: 89, latitude: 39.8842, longitude: 116.3974, current_load: 3, max_load: 5, performance_rate: 0.97, is_novice: 0, novice_start_date: null, status: 'busy', total_orders: 960, total_income: 14400 },
    { name: '冯刚', phone: '13800001020', device_model: 'Xiaomi 14 Pro', battery_health: 78, latitude: 39.9042, longitude: 116.4174, current_load: 2, max_load: 5, performance_rate: 0.93, is_novice: 0, novice_start_date: null, status: 'online', total_orders: 680, total_income: 10200 },
  ]

  const insertOrder = db.prepare(`
    INSERT INTO delivery_orders (order_no, pickup_lat, pickup_lng, pickup_address, pickup_geofence_radius, delivery_lat, delivery_lng, delivery_address, delivery_geofence_radius, estimated_pickup_time, estimated_delivery_time, delivery_time_window_start, delivery_time_window_end, weight, status, rider_id, base_fee, reward, subsidy, timeout_penalty_tier, timeout_penalty_amount, assigned_at, picked_up_at, delivered_at)
    VALUES (@order_no, @pickup_lat, @pickup_lng, @pickup_address, @pickup_geofence_radius, @delivery_lat, @delivery_lng, @delivery_address, @delivery_geofence_radius, @estimated_pickup_time, @estimated_delivery_time, @delivery_time_window_start, @delivery_time_window_end, @weight, @status, @rider_id, @base_fee, @reward, @subsidy, @timeout_penalty_tier, @timeout_penalty_amount, @assigned_at, @picked_up_at, @delivered_at)
  `)

  const ordersData = [
    { order_no: 'ORD20260603001', pickup_lat: 39.9082, pickup_lng: 116.4054, pickup_address: '朝阳区建国路88号', pickup_geofence_radius: 500, delivery_lat: 39.9182, delivery_lng: 116.4154, delivery_address: '朝阳区三里屯路19号', delivery_geofence_radius: 500, estimated_pickup_time: '2026-06-03T09:30:00', estimated_delivery_time: '2026-06-03T10:00:00', delivery_time_window_start: '2026-06-03T09:30:00', delivery_time_window_end: '2026-06-03T10:30:00', weight: 2.5, status: 'delivered', rider_id: 1, base_fee: 8, reward: 2, subsidy: 0, timeout_penalty_tier: 0, timeout_penalty_amount: 0, assigned_at: '2026-06-03T09:15:00', picked_up_at: '2026-06-03T09:28:00', delivered_at: '2026-06-03T09:55:00' },
    { order_no: 'ORD20260603002', pickup_lat: 39.9122, pickup_lng: 116.4104, pickup_address: '东城区王府井大街138号', pickup_geofence_radius: 500, delivery_lat: 39.8982, delivery_lng: 116.3954, delivery_address: '西城区西长安街1号', delivery_geofence_radius: 500, estimated_pickup_time: '2026-06-03T10:00:00', estimated_delivery_time: '2026-06-03T10:30:00', delivery_time_window_start: '2026-06-03T10:00:00', delivery_time_window_end: '2026-06-03T11:00:00', weight: 1.2, status: 'picked_up', rider_id: 3, base_fee: 6, reward: 0, subsidy: 1, timeout_penalty_tier: 0, timeout_penalty_amount: 0, assigned_at: '2026-06-03T09:50:00', picked_up_at: '2026-06-03T09:58:00', delivered_at: null },
    { order_no: 'ORD20260603003', pickup_lat: 39.9022, pickup_lng: 116.4204, pickup_address: '海淀区中关村大街27号', pickup_geofence_radius: 500, delivery_lat: 39.9222, delivery_lng: 116.4404, delivery_address: '朝阳区望京西路50号', delivery_geofence_radius: 500, estimated_pickup_time: '2026-06-03T10:30:00', estimated_delivery_time: '2026-06-03T11:15:00', delivery_time_window_start: '2026-06-03T10:30:00', delivery_time_window_end: '2026-06-03T11:30:00', weight: 3.8, status: 'assigned', rider_id: 5, base_fee: 12, reward: 3, subsidy: 2, timeout_penalty_tier: 0, timeout_penalty_amount: 0, assigned_at: '2026-06-03T10:20:00', picked_up_at: null, delivered_at: null },
    { order_no: 'ORD20260603004', pickup_lat: 39.9182, pickup_lng: 116.3954, pickup_address: '西城区金融街9号', pickup_geofence_radius: 500, delivery_lat: 39.8882, delivery_lng: 116.3854, delivery_address: '丰台区南三环西路16号', delivery_geofence_radius: 500, estimated_pickup_time: '2026-06-03T11:00:00', estimated_delivery_time: '2026-06-03T11:45:00', delivery_time_window_start: '2026-06-03T11:00:00', delivery_time_window_end: '2026-06-03T12:00:00', weight: 0.8, status: 'pending', rider_id: null, base_fee: 10, reward: 0, subsidy: 0, timeout_penalty_tier: 0, timeout_penalty_amount: 0, assigned_at: null, picked_up_at: null, delivered_at: null },
    { order_no: 'ORD20260603005', pickup_lat: 39.9282, pickup_lng: 116.4254, pickup_address: '朝阳区国贸CBD核心区', pickup_geofence_radius: 500, delivery_lat: 39.9082, delivery_lng: 116.4104, delivery_address: '东城区东直门外大街48号', delivery_geofence_radius: 500, estimated_pickup_time: '2026-06-03T09:00:00', estimated_delivery_time: '2026-06-03T09:30:00', delivery_time_window_start: '2026-06-03T09:00:00', delivery_time_window_end: '2026-06-03T10:00:00', weight: 5.0, status: 'delivered', rider_id: 10, base_fee: 15, reward: 5, subsidy: 0, timeout_penalty_tier: 0, timeout_penalty_amount: 0, assigned_at: '2026-06-03T08:45:00', picked_up_at: '2026-06-03T08:55:00', delivered_at: '2026-06-03T09:25:00' },
    { order_no: 'ORD20260603006', pickup_lat: 39.8922, pickup_lng: 116.4154, pickup_address: '东城区安定门外大街56号', pickup_geofence_radius: 500, delivery_lat: 39.9122, delivery_lng: 116.4354, delivery_address: '朝阳区劲松南路1号', delivery_geofence_radius: 500, estimated_pickup_time: '2026-06-03T12:00:00', estimated_delivery_time: '2026-06-03T12:30:00', delivery_time_window_start: '2026-06-03T12:00:00', delivery_time_window_end: '2026-06-03T13:00:00', weight: 2.0, status: 'cancelled', rider_id: 7, base_fee: 8, reward: 0, subsidy: 0, timeout_penalty_tier: 0, timeout_penalty_amount: 0, assigned_at: '2026-06-03T11:50:00', picked_up_at: null, delivered_at: null },
    { order_no: 'ORD20260603007', pickup_lat: 39.9052, pickup_lng: 116.4004, pickup_address: '西城区西单北大街120号', pickup_geofence_radius: 500, delivery_lat: 39.9252, delivery_lng: 116.4304, delivery_address: '朝阳区大望路SOHO', delivery_geofence_radius: 500, estimated_pickup_time: '2026-06-03T13:00:00', estimated_delivery_time: '2026-06-03T13:40:00', delivery_time_window_start: '2026-06-03T13:00:00', delivery_time_window_end: '2026-06-03T14:00:00', weight: 1.5, status: 'timeout', rider_id: 6, base_fee: 9, reward: 0, subsidy: 0, timeout_penalty_tier: 2, timeout_penalty_amount: 5, assigned_at: '2026-06-03T12:50:00', picked_up_at: '2026-06-03T13:05:00', delivered_at: null },
    { order_no: 'ORD20260603008', pickup_lat: 39.9352, pickup_lng: 116.4104, pickup_address: '朝阳区朝阳北路101号', pickup_geofence_radius: 500, delivery_lat: 39.8952, delivery_lng: 116.3904, delivery_address: '西城区宣武门外大街8号', delivery_geofence_radius: 500, estimated_pickup_time: '2026-06-03T14:00:00', estimated_delivery_time: '2026-06-03T14:30:00', delivery_time_window_start: '2026-06-03T14:00:00', delivery_time_window_end: '2026-06-03T15:00:00', weight: 4.2, status: 'delivered', rider_id: 15, base_fee: 14, reward: 4, subsidy: 3, timeout_penalty_tier: 0, timeout_penalty_amount: 0, assigned_at: '2026-06-03T13:50:00', picked_up_at: '2026-06-03T13:57:00', delivered_at: '2026-06-03T14:22:00' },
    { order_no: 'ORD20260603009', pickup_lat: 39.8982, pickup_lng: 116.4254, pickup_address: '东城区北三环东路36号', pickup_geofence_radius: 500, delivery_lat: 39.9182, delivery_lng: 116.4454, delivery_address: '朝阳区酒仙桥路2号', delivery_geofence_radius: 500, estimated_pickup_time: '2026-06-03T15:00:00', estimated_delivery_time: '2026-06-03T15:40:00', delivery_time_window_start: '2026-06-03T15:00:00', delivery_time_window_end: '2026-06-03T16:00:00', weight: 0.5, status: 'pending', rider_id: null, base_fee: 7, reward: 0, subsidy: 0, timeout_penalty_tier: 0, timeout_penalty_amount: 0, assigned_at: null, picked_up_at: null, delivered_at: null },
    { order_no: 'ORD20260603010', pickup_lat: 39.9102, pickup_lng: 116.3984, pickup_address: '西城区复兴门外大街A座', pickup_geofence_radius: 500, delivery_lat: 39.9302, delivery_lng: 116.4184, delivery_address: '朝阳区工体北路4号', delivery_geofence_radius: 500, estimated_pickup_time: '2026-06-03T16:00:00', estimated_delivery_time: '2026-06-03T16:30:00', delivery_time_window_start: '2026-06-03T16:00:00', delivery_time_window_end: '2026-06-03T17:00:00', weight: 3.0, status: 'assigned', rider_id: 13, base_fee: 11, reward: 2, subsidy: 1, timeout_penalty_tier: 0, timeout_penalty_amount: 0, assigned_at: '2026-06-03T15:50:00', picked_up_at: null, delivered_at: null },
    { order_no: 'ORD20260603011', pickup_lat: 39.8862, pickup_lng: 116.3884, pickup_address: '丰台区方庄路5号', pickup_geofence_radius: 500, delivery_lat: 39.9062, delivery_lng: 116.4084, delivery_address: '东城区前门大街28号', delivery_geofence_radius: 500, estimated_pickup_time: '2026-06-03T09:15:00', estimated_delivery_time: '2026-06-03T09:50:00', delivery_time_window_start: '2026-06-03T09:15:00', delivery_time_window_end: '2026-06-03T10:15:00', weight: 1.8, status: 'delivered', rider_id: 19, base_fee: 9, reward: 3, subsidy: 0, timeout_penalty_tier: 0, timeout_penalty_amount: 0, assigned_at: '2026-06-03T09:05:00', picked_up_at: '2026-06-03T09:12:00', delivered_at: '2026-06-03T09:42:00' },
    { order_no: 'ORD20260603012', pickup_lat: 39.9202, pickup_lng: 116.4054, pickup_address: '朝阳区建外SOHO西区', pickup_geofence_radius: 500, delivery_lat: 39.9002, delivery_lng: 116.4254, delivery_address: '东城区东四十条22号', delivery_geofence_radius: 500, estimated_pickup_time: '2026-06-03T17:00:00', estimated_delivery_time: '2026-06-03T17:30:00', delivery_time_window_start: '2026-06-03T17:00:00', delivery_time_window_end: '2026-06-03T18:00:00', weight: 2.3, status: 'picked_up', rider_id: 20, base_fee: 8, reward: 1, subsidy: 0, timeout_penalty_tier: 0, timeout_penalty_amount: 0, assigned_at: '2026-06-03T16:50:00', picked_up_at: '2026-06-03T16:55:00', delivered_at: null },
    { order_no: 'ORD20260603013', pickup_lat: 39.9022, pickup_lng: 116.4124, pickup_address: '东城区崇文门外大街18号', pickup_geofence_radius: 500, delivery_lat: 39.9222, delivery_lng: 116.4324, delivery_address: '朝阳区双井路8号', delivery_geofence_radius: 500, estimated_pickup_time: '2026-06-03T18:00:00', estimated_delivery_time: '2026-06-03T18:30:00', delivery_time_window_start: '2026-06-03T18:00:00', delivery_time_window_end: '2026-06-03T19:00:00', weight: 6.0, status: 'pending', rider_id: null, base_fee: 18, reward: 0, subsidy: 5, timeout_penalty_tier: 0, timeout_penalty_amount: 0, assigned_at: null, picked_up_at: null, delivered_at: null },
    { order_no: 'ORD20260603014', pickup_lat: 39.9152, pickup_lng: 116.4004, pickup_address: '西城区德胜门外大街5号', pickup_geofence_radius: 500, delivery_lat: 39.8952, delivery_lng: 116.4204, delivery_address: '东城区广渠门内大街16号', delivery_geofence_radius: 500, estimated_pickup_time: '2026-06-03T08:30:00', estimated_delivery_time: '2026-06-03T09:00:00', delivery_time_window_start: '2026-06-03T08:30:00', delivery_time_window_end: '2026-06-03T09:30:00', weight: 1.0, status: 'delivered', rider_id: 2, base_fee: 7, reward: 2, subsidy: 0, timeout_penalty_tier: 0, timeout_penalty_amount: 0, assigned_at: '2026-06-03T08:20:00', picked_up_at: '2026-06-03T08:28:00', delivered_at: '2026-06-03T08:52:00' },
    { order_no: 'ORD20260603015', pickup_lat: 39.9082, pickup_lng: 116.4184, pickup_address: '朝阳区朝外大街18号', pickup_geofence_radius: 500, delivery_lat: 39.8882, delivery_lng: 116.3984, delivery_address: '西城区牛街5号', delivery_geofence_radius: 500, estimated_pickup_time: '2026-06-03T19:00:00', estimated_delivery_time: '2026-06-03T19:40:00', delivery_time_window_start: '2026-06-03T19:00:00', delivery_time_window_end: '2026-06-03T20:00:00', weight: 3.5, status: 'assigned', rider_id: 11, base_fee: 13, reward: 3, subsidy: 2, timeout_penalty_tier: 0, timeout_penalty_amount: 0, assigned_at: '2026-06-03T18:50:00', picked_up_at: null, delivered_at: null },
  ]

  const insertGrid = db.prepare(`
    INSERT INTO capacity_grids (grid_code, grid_name, center_lat, center_lng, heat_density, rider_count, active_orders, load_balance_coefficient, weather_factor, weather_description)
    VALUES (@grid_code, @grid_name, @center_lat, @center_lng, @heat_density, @rider_count, @active_orders, @load_balance_coefficient, @weather_factor, @weather_description)
  `)

  const gridsData = [
    { grid_code: 'G-NW', grid_name: '西北片区', center_lat: 39.9242, center_lng: 116.3874, heat_density: 0.65, rider_count: 5, active_orders: 3, load_balance_coefficient: 1.1, weather_factor: 1.0, weather_description: 'sunny' },
    { grid_code: 'G-NC', grid_name: '北部中心', center_lat: 39.9242, center_lng: 116.4074, heat_density: 0.85, rider_count: 8, active_orders: 6, load_balance_coefficient: 0.9, weather_factor: 1.0, weather_description: 'sunny' },
    { grid_code: 'G-NE', grid_name: '东北片区', center_lat: 39.9242, center_lng: 116.4274, heat_density: 0.72, rider_count: 6, active_orders: 4, load_balance_coefficient: 1.0, weather_factor: 0.9, weather_description: 'cloudy' },
    { grid_code: 'G-CW', grid_name: '西部中心', center_lat: 39.9042, center_lng: 116.3874, heat_density: 0.78, rider_count: 7, active_orders: 5, load_balance_coefficient: 1.0, weather_factor: 1.0, weather_description: 'sunny' },
    { grid_code: 'G-CC', grid_name: '城市核心', center_lat: 39.9042, center_lng: 116.4074, heat_density: 0.95, rider_count: 12, active_orders: 10, load_balance_coefficient: 0.8, weather_factor: 0.85, weather_description: 'rainy' },
    { grid_code: 'G-CE', grid_name: '东部中心', center_lat: 39.9042, center_lng: 116.4274, heat_density: 0.88, rider_count: 9, active_orders: 7, load_balance_coefficient: 0.85, weather_factor: 0.9, weather_description: 'cloudy' },
    { grid_code: 'G-SW', grid_name: '西南片区', center_lat: 39.8842, center_lng: 116.3874, heat_density: 0.55, rider_count: 4, active_orders: 2, load_balance_coefficient: 1.2, weather_factor: 1.0, weather_description: 'sunny' },
    { grid_code: 'G-SC', grid_name: '南部中心', center_lat: 39.8842, center_lng: 116.4074, heat_density: 0.70, rider_count: 6, active_orders: 4, load_balance_coefficient: 1.05, weather_factor: 1.0, weather_description: 'sunny' },
    { grid_code: 'G-SE', grid_name: '东南片区', center_lat: 39.8842, center_lng: 116.4274, heat_density: 0.62, rider_count: 5, active_orders: 3, load_balance_coefficient: 1.1, weather_factor: 0.95, weather_description: 'cloudy' },
  ]

  const insertScenario = db.prepare(`
    INSERT INTO training_scenarios (title, category, content, difficulty, video_url, pass_score)
    VALUES (@title, @category, @content, @difficulty, @video_url, @pass_score)
  `)

  const scenariosData = [
    { title: '标准取餐流程模拟', category: 'order_simulation', content: '模拟从接单到取餐的完整标准流程，包括到店确认、餐品核对、打包检查等环节。', difficulty: 'easy', video_url: 'https://example.com/train/pickup-standard', pass_score: 60 },
    { title: '高峰期多单配送', category: 'order_simulation', content: '模拟高峰期同时配送3个订单的场景，训练骑手合理规划路线和优先级判断能力。', difficulty: 'hard', video_url: 'https://example.com/train/peak-multi', pass_score: 70 },
    { title: '大额订单配送规范', category: 'order_simulation', content: '针对大额订单的特殊配送规范，包括餐品保护、配送时效和客户沟通要点。', difficulty: 'medium', video_url: 'https://example.com/train/large-order', pass_score: 65 },
    { title: '客户地址异常处理', category: 'exception_sop', content: '当客户地址无法到达或定位偏移时的标准处理流程，包括联系客户、上报系统等。', difficulty: 'medium', video_url: 'https://example.com/train/address-error', pass_score: 70 },
    { title: '餐品撒漏应急处理', category: 'exception_sop', content: '配送途中餐品发生撒漏的应急处理方案，包括拍照留证、联系商家和客户沟通。', difficulty: 'medium', video_url: 'https://example.com/train/spill-handling', pass_score: 75 },
    { title: '恶劣天气配送安全', category: 'exception_sop', content: '暴雨、大风等恶劣天气下的安全配送规范，包括减速慢行、避雨点选择等。', difficulty: 'easy', video_url: 'https://example.com/train/bad-weather', pass_score: 60 },
    { title: '配送服务规范考试', category: 'rule_exam', content: '考核配送服务基本规范，包括着装要求、配送箱卫生、服务话术等。', difficulty: 'easy', video_url: null, pass_score: 60 },
    { title: '违规处罚制度考试', category: 'rule_exam', content: '考核平台违规处罚制度，包括超时处罚、虚假签到、GPS偏移等违规类型及对应处罚。', difficulty: 'medium', video_url: null, pass_score: 80 },
    { title: '新手保护期规则考试', category: 'rule_exam', content: '考核新手保护期相关政策，包括保护卡使用规则、师徒制度、新手奖励等。', difficulty: 'easy', video_url: null, pass_score: 60 },
    { title: '突发事件报告流程', category: 'exception_sop', content: '交通事故、客户纠纷等突发事件的报告和处理流程，确保骑手掌握正确的上报渠道和步骤。', difficulty: 'hard', video_url: 'https://example.com/train/emergency-report', pass_score: 80 },
  ]

  const insertViolation = db.prepare(`
    INSERT INTO rider_violations (rider_id, type, description, order_id, penalty_points)
    VALUES (@rider_id, @type, @description, @order_id, @penalty_points)
  `)

  const violationsData = [
    { rider_id: 6, type: 'timeout', description: '配送超时15分钟', order_id: 7, penalty_points: 3 },
    { rider_id: 7, type: 'false_signin', description: '签到位置与商家位置偏差超过500米', order_id: null, penalty_points: 5 },
    { rider_id: 8, type: 'gps_deviation', description: '配送路线偏移预期路线超过2公里', order_id: null, penalty_points: 4 },
    { rider_id: 4, type: 'timeout', description: '取餐超时10分钟', order_id: null, penalty_points: 2 },
    { rider_id: 12, type: 'other', description: '未按规定佩戴配送箱标识', order_id: null, penalty_points: 1 },
    { rider_id: 16, type: 'false_signin', description: '非本人签到，代签行为', order_id: null, penalty_points: 8 },
    { rider_id: 18, type: 'timeout', description: '新手期配送超时，触发保护卡', order_id: null, penalty_points: 0 },
  ]

  const insertMentorship = db.prepare(`
    INSERT INTO mentorships (mentor_id, mentee_id, status, started_at, ended_at)
    VALUES (@mentor_id, @mentee_id, @status, @started_at, @ended_at)
  `)

  const mentorshipsData = [
    { mentor_id: 1, mentee_id: 4, status: 'active', started_at: '2026-05-01T00:00:00', ended_at: null },
    { mentor_id: 3, mentee_id: 8, status: 'active', started_at: '2026-05-20T00:00:00', ended_at: null },
    { mentor_id: 5, mentee_id: 12, status: 'active', started_at: '2026-05-10T00:00:00', ended_at: null },
    { mentor_id: 10, mentee_id: 14, status: 'active', started_at: '2026-05-25T00:00:00', ended_at: null },
    { mentor_id: 2, mentee_id: 6, status: 'completed', started_at: '2026-04-15T00:00:00', ended_at: '2026-05-15T00:00:00' },
    { mentor_id: 9, mentee_id: 18, status: 'active', started_at: '2026-05-28T00:00:00', ended_at: null },
  ]

  const insertNoviceCard = db.prepare(`
    INSERT INTO novice_cards (rider_id, card_type, reason, used)
    VALUES (@rider_id, @card_type, @reason, @used)
  `)

  const noviceCardsData = [
    { rider_id: 4, card_type: 'timeout_elimination', reason: '新手保护：首次超时免罚', used: 0 },
    { rider_id: 8, card_type: 'timeout_elimination', reason: '新手保护：首次超时免罚', used: 0 },
    { rider_id: 8, card_type: 'bonus_reward', reason: '完成首周培训奖励', used: 0 },
    { rider_id: 12, card_type: 'timeout_elimination', reason: '新手保护：首次超时免罚', used: 1 },
    { rider_id: 14, card_type: 'bonus_reward', reason: '新手注册奖励', used: 0 },
    { rider_id: 14, card_type: 'timeout_elimination', reason: '新手保护：首次超时免罚', used: 0 },
    { rider_id: 18, card_type: 'timeout_elimination', reason: '新手保护：首次超时免罚', used: 0 },
    { rider_id: 18, card_type: 'bonus_reward', reason: '完成首周培训奖励', used: 0 },
  ]

  const insertGpsTrack = db.prepare(`
    INSERT INTO gps_tracks (rider_id, order_id, latitude, longitude, speed, heading, recorded_at)
    VALUES (@rider_id, @order_id, @latitude, @longitude, @speed, @heading, @recorded_at)
  `)

  const gpsTracksData = [
    { rider_id: 1, order_id: 1, latitude: 39.9092, longitude: 116.4064, speed: 15.5, heading: 45.0, recorded_at: '2026-06-03T09:30:00' },
    { rider_id: 1, order_id: 1, latitude: 39.9112, longitude: 116.4084, speed: 22.3, heading: 30.0, recorded_at: '2026-06-03T09:35:00' },
    { rider_id: 1, order_id: 1, latitude: 39.9142, longitude: 116.4114, speed: 18.0, heading: 60.0, recorded_at: '2026-06-03T09:40:00' },
    { rider_id: 1, order_id: 1, latitude: 39.9162, longitude: 116.4134, speed: 12.0, heading: 90.0, recorded_at: '2026-06-03T09:45:00' },
    { rider_id: 1, order_id: 1, latitude: 39.9182, longitude: 116.4154, speed: 5.0, heading: 0.0, recorded_at: '2026-06-03T09:55:00' },
    { rider_id: 3, order_id: 2, latitude: 39.9132, longitude: 116.4114, speed: 20.0, heading: 200.0, recorded_at: '2026-06-03T10:00:00' },
    { rider_id: 3, order_id: 2, latitude: 39.9082, longitude: 116.4064, speed: 25.0, heading: 210.0, recorded_at: '2026-06-03T10:10:00' },
    { rider_id: 3, order_id: 2, latitude: 39.9032, longitude: 116.4014, speed: 18.5, heading: 195.0, recorded_at: '2026-06-03T10:20:00' },
    { rider_id: 10, order_id: 5, latitude: 39.9292, longitude: 116.4264, speed: 16.0, heading: 270.0, recorded_at: '2026-06-03T09:00:00' },
    { rider_id: 10, order_id: 5, latitude: 39.9202, longitude: 116.4204, speed: 28.0, heading: 260.0, recorded_at: '2026-06-03T09:10:00' },
    { rider_id: 10, order_id: 5, latitude: 39.9122, longitude: 116.4144, speed: 22.0, heading: 240.0, recorded_at: '2026-06-03T09:20:00' },
    { rider_id: 19, order_id: 11, latitude: 39.8872, longitude: 116.3894, speed: 19.0, heading: 30.0, recorded_at: '2026-06-03T09:15:00' },
    { rider_id: 19, order_id: 11, latitude: 39.8942, longitude: 116.3964, speed: 24.0, heading: 45.0, recorded_at: '2026-06-03T09:25:00' },
    { rider_id: 19, order_id: 11, latitude: 39.9012, longitude: 116.4044, speed: 17.0, heading: 35.0, recorded_at: '2026-06-03T09:35:00' },
  ]

  const insertAlert = db.prepare(`
    INSERT INTO monitoring_alerts (rider_id, order_id, alert_type, severity, message, resolved, resolved_at)
    VALUES (@rider_id, @order_id, @alert_type, @severity, @message, @resolved, @resolved_at)
  `)

  const alertsData = [
    { rider_id: 6, order_id: 7, alert_type: 'timeout_risk', severity: 'critical', message: '骑手赵强配送已超时15分钟，预计超时风险极高', resolved: 1, resolved_at: '2026-06-03T14:30:00' },
    { rider_id: 7, order_id: 6, alert_type: 'fake_signin', severity: 'critical', message: '骑手孙丽签到位置异常，与商家距离偏差超过500米', resolved: 1, resolved_at: '2026-06-03T12:15:00' },
    { rider_id: 8, order_id: null, alert_type: 'gps_deviation', severity: 'warning', message: '骑手周鹏GPS轨迹偏移常规路线超过2公里', resolved: 0, resolved_at: null },
    { rider_id: 4, order_id: null, alert_type: 'timeout_risk', severity: 'warning', message: '新手骑手刘洋取餐时间接近上限', resolved: 1, resolved_at: '2026-06-03T10:05:00' },
    { rider_id: 18, order_id: null, alert_type: 'arrived_not_picked', severity: 'warning', message: '骑手唐峰已到达商家5分钟但未确认取餐', resolved: 0, resolved_at: null },
    { rider_id: 12, order_id: null, alert_type: 'gps_deviation', severity: 'info', message: '骑手黄敏路线有小幅偏移，可能绕行避堵', resolved: 1, resolved_at: '2026-06-03T11:30:00' },
  ]

  const insertDispatchLog = db.prepare(`
    INSERT INTO dispatch_logs (order_id, rider_id, score, dispatch_reason)
    VALUES (@order_id, @rider_id, @score, @dispatch_reason)
  `)

  const dispatchLogsData = [
    { order_id: 1, rider_id: 1, score: 0.95, dispatch_reason: '距离最近、绩效优秀、负载适中' },
    { order_id: 2, rider_id: 3, score: 0.91, dispatch_reason: '负载较低、历史配送评分高' },
    { order_id: 3, rider_id: 5, score: 0.88, dispatch_reason: '网格匹配、运力充足' },
    { order_id: 5, rider_id: 10, score: 0.97, dispatch_reason: '最优匹配：绩效最高、距离最近' },
    { order_id: 7, rider_id: 6, score: 0.72, dispatch_reason: '新手派单保护期，降低接单难度' },
    { order_id: 8, rider_id: 15, score: 0.93, dispatch_reason: '高绩效骑手、可承载大重量订单' },
    { order_id: 10, rider_id: 13, score: 0.86, dispatch_reason: '区域运力调配、负载均衡' },
    { order_id: 11, rider_id: 19, score: 0.89, dispatch_reason: '忙时调配、绩效匹配' },
    { order_id: 14, rider_id: 2, score: 0.92, dispatch_reason: '早班优先、距离最优' },
    { order_id: 15, rider_id: 11, score: 0.84, dispatch_reason: '负载均衡分配、晚高峰运力补充' },
  ]

  const insertTrainingRecord = db.prepare(`
    INSERT INTO training_records (rider_id, scenario_id, score, passed)
    VALUES (@rider_id, @scenario_id, @score, @passed)
  `)

  const trainingRecordsData = [
    { rider_id: 4, scenario_id: 1, score: 85, passed: 1 },
    { rider_id: 4, scenario_id: 7, score: 72, passed: 1 },
    { rider_id: 4, scenario_id: 9, score: 90, passed: 1 },
    { rider_id: 8, scenario_id: 1, score: 55, passed: 0 },
    { rider_id: 8, scenario_id: 6, score: 78, passed: 1 },
    { rider_id: 12, scenario_id: 1, score: 68, passed: 1 },
    { rider_id: 12, scenario_id: 7, score: 62, passed: 1 },
    { rider_id: 14, scenario_id: 1, score: 45, passed: 0 },
    { rider_id: 18, scenario_id: 1, score: 50, passed: 0 },
    { rider_id: 18, scenario_id: 9, score: 58, passed: 0 },
    { rider_id: 6, scenario_id: 8, score: 82, passed: 1 },
    { rider_id: 6, scenario_id: 4, score: 76, passed: 1 },
    { rider_id: 16, scenario_id: 2, score: 71, passed: 1 },
    { rider_id: 16, scenario_id: 5, score: 65, passed: 0 },
  ]

  const seedTransaction = db.transaction(() => {
    for (const r of ridersData) insertRider.run(r)
    for (const o of ordersData) insertOrder.run(o)
    for (const g of gridsData) insertGrid.run(g)
    for (const s of scenariosData) insertScenario.run(s)
    for (const v of violationsData) insertViolation.run(v)
    for (const m of mentorshipsData) insertMentorship.run(m)
    for (const nc of noviceCardsData) insertNoviceCard.run(nc)
    for (const gt of gpsTracksData) insertGpsTrack.run(gt)
    for (const a of alertsData) insertAlert.run(a)
    for (const d of dispatchLogsData) insertDispatchLog.run(d)
    for (const tr of trainingRecordsData) insertTrainingRecord.run(tr)
  })

  seedTransaction()
}

export default db
