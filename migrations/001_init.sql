-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('owner', 'doctor', 'hospital', 'merchant', 'admin', 'platform', 'ops')),
  phone TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nickname TEXT NOT NULL,
  avatar TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled', 'pending_review')),
  license_verified INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 宠物表
CREATE TABLE IF NOT EXISTS pets (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  species TEXT NOT NULL,
  breed TEXT,
  gender TEXT NOT NULL,
  birthday TEXT,
  weight REAL,
  avatar TEXT,
  health_status TEXT DEFAULT 'healthy',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 疫苗记录表
CREATE TABLE IF NOT EXISTS vaccine_records (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL REFERENCES pets(id),
  vaccine_name TEXT NOT NULL,
  date TEXT NOT NULL,
  next_date TEXT,
  hospital_id TEXT REFERENCES users(id)
);

-- 驱虫记录表
CREATE TABLE IF NOT EXISTS deworming_records (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL REFERENCES pets(id),
  type TEXT NOT NULL CHECK (type IN ('internal', 'external')),
  product_name TEXT NOT NULL,
  date TEXT NOT NULL,
  next_date TEXT
);

-- 医生表
CREATE TABLE IF NOT EXISTS doctors (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  hospital_id TEXT REFERENCES users(id),
  name TEXT NOT NULL,
  title TEXT,
  department TEXT,
  license_number TEXT UNIQUE NOT NULL,
  license_verified INTEGER DEFAULT 0,
  rating REAL DEFAULT 5.0,
  consultation_count INTEGER DEFAULT 0,
  is_online INTEGER DEFAULT 0
);

-- 问诊表
CREATE TABLE IF NOT EXISTS consultations (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id),
  doctor_id TEXT NOT NULL REFERENCES users(id),
  pet_id TEXT NOT NULL REFERENCES pets(id),
  type TEXT NOT NULL CHECK (type IN ('text', 'video', 'audio')),
  status TEXT NOT NULL DEFAULT 'pending',
  symptoms TEXT,
  diagnosis TEXT,
  prescription_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);

-- 问诊消息表（内容加密存储）
CREATE TABLE IF NOT EXISTS consultation_messages (
  id TEXT PRIMARY KEY,
  consultation_id TEXT NOT NULL REFERENCES consultations(id),
  sender_id TEXT NOT NULL REFERENCES users(id),
  content_encrypted TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 处方表
CREATE TABLE IF NOT EXISTS prescriptions (
  id TEXT PRIMARY KEY,
  consultation_id TEXT NOT NULL REFERENCES consultations(id),
  doctor_id TEXT NOT NULL REFERENCES users(id),
  owner_id TEXT NOT NULL REFERENCES users(id),
  pet_id TEXT NOT NULL REFERENCES pets(id),
  doctor_signature TEXT NOT NULL,
  owner_acknowledged INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 处方项目表
CREATE TABLE IF NOT EXISTS prescription_items (
  id TEXT PRIMARY KEY,
  prescription_id TEXT NOT NULL REFERENCES prescriptions(id),
  product_id TEXT REFERENCES products(id),
  product_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration TEXT NOT NULL,
  is_prescription INTEGER DEFAULT 0
);

-- 医院表
CREATE TABLE IF NOT EXISTS hospitals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  phone TEXT,
  business_hours TEXT,
  rating REAL DEFAULT 5.0,
  review_count INTEGER DEFAULT 0,
  verified INTEGER DEFAULT 0
);

-- 医院服务项目表
CREATE TABLE IF NOT EXISTS hospital_services (
  id TEXT PRIMARY KEY,
  hospital_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  duration INTEGER
);

-- 医院评价表
CREATE TABLE IF NOT EXISTS hospital_reviews (
  id TEXT PRIMARY KEY,
  hospital_id TEXT NOT NULL REFERENCES users(id),
  owner_id TEXT NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT,
  is_verified INTEGER DEFAULT 0,
  anti_fraud_score REAL DEFAULT 1.0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 商家表
CREATE TABLE IF NOT EXISTS merchants (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  company_name TEXT NOT NULL,
  business_license TEXT UNIQUE NOT NULL,
  verified INTEGER DEFAULT 0
);

-- 商品表
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  species TEXT NOT NULL,
  age_range TEXT,
  health_condition TEXT,
  price REAL NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  is_prescription INTEGER DEFAULT 0,
  images TEXT,
  description TEXT
);

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id),
  prescription_id TEXT REFERENCES prescriptions(id),
  total_amount REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  owner_signature TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 订单项表
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  product_id TEXT NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price REAL NOT NULL
);

-- 社区帖子表
CREATE TABLE IF NOT EXISTS community_posts (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id),
  pet_id TEXT REFERENCES pets(id),
  content TEXT NOT NULL,
  images TEXT,
  tags TEXT,
  vaccine_tag TEXT,
  deworming_tag TEXT,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 寻宠任务表
CREATE TABLE IF NOT EXISTS lost_pet_tasks (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id),
  pet_name TEXT NOT NULL,
  species TEXT NOT NULL,
  description TEXT NOT NULL,
  last_seen_lat REAL NOT NULL,
  last_seen_lng REAL NOT NULL,
  last_seen_address TEXT,
  last_seen_time TEXT NOT NULL,
  reward REAL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'searching',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 寻宠线索表
CREATE TABLE IF NOT EXISTS lost_pet_clues (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES lost_pet_tasks(id),
  reporter_id TEXT NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  location_lat REAL,
  location_lng REAL,
  verified INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 领养意向表
CREATE TABLE IF NOT EXISTS adoption_intents (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES lost_pet_tasks(id),
  applicant_id TEXT NOT NULL REFERENCES users(id),
  message TEXT,
  level TEXT DEFAULT 'pending' CHECK (level IN ('pending', 'interested', 'verified', 'approved')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 健康日历事件表
CREATE TABLE IF NOT EXISTS health_calendar_events (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id),
  pet_id TEXT NOT NULL REFERENCES pets(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  reminder_days INTEGER DEFAULT 3,
  completed INTEGER DEFAULT 0,
  related_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 迁移记录表
CREATE TABLE IF NOT EXISTS migrations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);
