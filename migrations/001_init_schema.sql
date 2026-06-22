-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  id_card TEXT UNIQUE NOT NULL,
  social_security_no TEXT UNIQUE NOT NULL,
  insured_area TEXT NOT NULL,
  face_data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 账户表
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  personal_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  overall_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  annual_consumption DECIMAL(12,2) NOT NULL DEFAULT 0,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 医院表
CREATE TABLE IF NOT EXISTS hospitals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  level TEXT NOT NULL,
  area TEXT NOT NULL,
  address TEXT NOT NULL,
  is_insurance_point BOOLEAN DEFAULT true,
  longitude DECIMAL(10,6),
  latitude DECIMAL(10,6),
  insurance_policy TEXT
);

-- 科室表
CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  hospital_id TEXT NOT NULL REFERENCES hospitals(id),
  name TEXT NOT NULL,
  description TEXT
);

-- 医生表
CREATE TABLE IF NOT EXISTS doctors (
  id TEXT PRIMARY KEY,
  department_id TEXT NOT NULL REFERENCES departments(id),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  specialty TEXT,
  registration_fee DECIMAL(10,2) NOT NULL
);

-- 号源表
CREATE TABLE IF NOT EXISTS time_slots (
  id TEXT PRIMARY KEY,
  doctor_id TEXT NOT NULL REFERENCES doctors(id),
  date DATE NOT NULL,
  time TEXT NOT NULL,
  period TEXT NOT NULL,
  available INTEGER NOT NULL,
  total INTEGER NOT NULL
);

-- 预约表
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  hospital_id TEXT NOT NULL REFERENCES hospitals(id),
  doctor_id TEXT NOT NULL REFERENCES doctors(id),
  date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  medical_code TEXT,
  qr_code TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 支付订单表
CREATE TABLE IF NOT EXISTS payment_orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  hospital_id TEXT NOT NULL REFERENCES hospitals(id),
  appointment_id TEXT REFERENCES appointments(id),
  type TEXT NOT NULL,
  amount TEXT NOT NULL,
  items TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  transaction_id TEXT,
  paid_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 就诊记录表
CREATE TABLE IF NOT EXISTS medical_records (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  hospital_id TEXT NOT NULL REFERENCES hospitals(id),
  visit_date DATE NOT NULL,
  department TEXT NOT NULL,
  doctor TEXT NOT NULL,
  diagnosis TEXT NOT NULL,
  symptoms TEXT,
  prescriptions TEXT,
  examinations TEXT,
  cost TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 慢特病认定表
CREATE TABLE IF NOT EXISTS chronic_diseases (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  disease_type TEXT NOT NULL,
  confirmed_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'approved',
  materials TEXT
);

-- 通知消息表
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  retryable BOOLEAN DEFAULT false,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 异地就医备案表
CREATE TABLE IF NOT EXISTS remote_records (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  area TEXT NOT NULL,
  hospital TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempt_count INTEGER DEFAULT 0,
  next_retry DATETIME,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 消费明细表
CREATE TABLE IF NOT EXISTS consumption_records (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  date DATE NOT NULL,
  type TEXT NOT NULL,
  merchant_name TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  personal_pay DECIMAL(12,2) NOT NULL,
  overall_pay DECIMAL(12,2) NOT NULL,
  category TEXT NOT NULL,
  details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
