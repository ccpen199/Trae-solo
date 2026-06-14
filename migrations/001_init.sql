-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT NOT NULL CHECK (role IN ('user', 'owner', 'agent', 'admin')),
  avatar TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 经纪人表
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  license_number TEXT UNIQUE,
  company TEXT,
  deal_count INTEGER DEFAULT 0,
  rating REAL DEFAULT 5.0,
  is_verified BOOLEAN DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 房源表
CREATE TABLE IF NOT EXISTS properties (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('new', 'secondhand', 'rent')),
  title TEXT NOT NULL,
  price REAL NOT NULL,
  unit_price REAL,
  area REAL NOT NULL,
  rooms INTEGER NOT NULL,
  halls INTEGER DEFAULT 0,
  bathrooms INTEGER DEFAULT 1,
  floor TEXT,
  orientation TEXT,
  decoration TEXT,
  build_year INTEGER,
  address TEXT NOT NULL,
  district TEXT NOT NULL,
  city TEXT DEFAULT '本地',
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  description TEXT,
  owner_id TEXT,
  agent_id TEXT,
  publish_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  listing_weight REAL DEFAULT 1.0,
  FOREIGN KEY (owner_id) REFERENCES users(id),
  FOREIGN KEY (agent_id) REFERENCES agents(id)
);

-- 房源图片表
CREATE TABLE IF NOT EXISTS property_images (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT CHECK (type IN ('normal', 'vr', 'floorplan')),
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY (property_id) REFERENCES properties(id)
);

-- 产权信息表
CREATE TABLE IF NOT EXISTS property_rights (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  right_type TEXT,
  status TEXT DEFAULT 'normal',
  ownership_years INTEGER,
  is_five_years BOOLEAN DEFAULT 0,
  is_only_one BOOLEAN DEFAULT 0,
  FOREIGN KEY (property_id) REFERENCES properties(id)
);

-- 学区信息表
CREATE TABLE IF NOT EXISTS school_districts (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  name TEXT NOT NULL,
  level TEXT CHECK (level IN ('primary', 'middle', 'high')),
  quality TEXT CHECK (quality IN ('key', 'ordinary')),
  distance REAL,
  enrollment_policy TEXT,
  FOREIGN KEY (property_id) REFERENCES properties(id)
);

-- 地铁信息表
CREATE TABLE IF NOT EXISTS metro_infos (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  nearest_station TEXT NOT NULL,
  line TEXT,
  distance REAL NOT NULL,
  walk_time INTEGER,
  FOREIGN KEY (property_id) REFERENCES properties(id)
);

-- 核验信息表
CREATE TABLE IF NOT EXISTS verifications (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  owner_verified BOOLEAN DEFAULT 0,
  agent_verified BOOLEAN DEFAULT 0,
  anti_fraud_passed BOOLEAN DEFAULT 0,
  verify_time DATETIME,
  listing_days INTEGER DEFAULT 0,
  decay_weight REAL DEFAULT 1.0,
  fraud_flags TEXT,
  FOREIGN KEY (property_id) REFERENCES properties(id)
);

-- 客户表
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  level TEXT CHECK (level IN ('A', 'B', 'C')),
  budget_min REAL,
  budget_max REAL,
  preference TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agent_id) REFERENCES agents(id)
);

-- 带看记录表
CREATE TABLE IF NOT EXISTS viewing_records (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  viewing_date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  feedback TEXT,
  interest_level TEXT CHECK (interest_level IN ('high', 'medium', 'low')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id),
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (agent_id) REFERENCES agents(id)
);

-- 成交表
CREATE TABLE IF NOT EXISTS deals (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  deal_price REAL NOT NULL,
  commission REAL,
  deal_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'reported')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id),
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (agent_id) REFERENCES agents(id)
);

-- 监管上报记录表
CREATE TABLE IF NOT EXISTS regulatory_reports (
  id TEXT PRIMARY KEY,
  deal_id TEXT NOT NULL,
  report_id TEXT UNIQUE,
  report_time DATETIME,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  government_response TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (deal_id) REFERENCES deals(id)
);

-- 价格趋势表
CREATE TABLE IF NOT EXISTS price_trends (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL,
  district TEXT,
  property_type TEXT,
  avg_price REAL NOT NULL,
  change_rate REAL,
  volume INTEGER,
  UNIQUE(date, district, property_type)
);

-- 防欺诈记录表
CREATE TABLE IF NOT EXISTS anti_fraud_records (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  check_type TEXT NOT NULL,
  result TEXT NOT NULL,
  score REAL,
  details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_district ON properties(district);
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(lat, lng);
CREATE INDEX IF NOT EXISTS idx_properties_publish_time ON properties(publish_time);
CREATE INDEX IF NOT EXISTS idx_viewings_agent ON viewing_records(agent_id);
CREATE INDEX IF NOT EXISTS idx_clients_agent ON clients(agent_id);
CREATE INDEX IF NOT EXISTS idx_deals_agent ON deals(agent_id);
