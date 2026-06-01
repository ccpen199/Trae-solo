CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'dispatcher', 'nurse', 'patient_family')),
  name TEXT NOT NULL,
  phone TEXT,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS nurses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  id_card TEXT UNIQUE NOT NULL,
  license_no TEXT UNIQUE NOT NULL,
  hospital TEXT,
  department TEXT,
  years_of_experience INTEGER DEFAULT 0,
  rating REAL DEFAULT 5.0,
  total_orders INTEGER DEFAULT 0,
  latitude REAL,
  longitude REAL,
  qualifications TEXT,
  skills TEXT,
  service_area TEXT,
  status TEXT DEFAULT 'available' CHECK(status IN ('available', 'busy', 'offline')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS nurse_qualifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nurse_id INTEGER NOT NULL,
  qualification_type TEXT NOT NULL,
  certificate_no TEXT NOT NULL,
  issue_date DATE,
  expiry_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (nurse_id) REFERENCES nurses(id)
);

CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  indications TEXT,
  contraindications TEXT,
  supplies TEXT,
  category TEXT NOT NULL,
  risk_level TEXT NOT NULL CHECK(risk_level IN ('low', 'medium', 'high')),
  duration INTEGER NOT NULL,
  price REAL NOT NULL,
  requires_approval INTEGER DEFAULT 0,
  required_qualifications TEXT,
  status INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  specification TEXT,
  unit TEXT NOT NULL,
  price REAL NOT NULL DEFAULT 0,
  stock INTEGER DEFAULT 0,
  category TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_no TEXT UNIQUE NOT NULL,
  user_id INTEGER NOT NULL,
  service_id INTEGER NOT NULL,
  nurse_id INTEGER,
  patient_name TEXT NOT NULL,
  patient_phone TEXT,
  patient_address TEXT NOT NULL,
  patient_age INTEGER,
  patient_gender TEXT,
  patient_condition TEXT,
  medical_order TEXT,
  scheduled_time DATETIME,
  contact_name TEXT,
  contact_phone TEXT,
  price REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'pending_approval', 'approved', 'rejected', 'dispatched', 'nurse_accepted', 'in_progress', 'completed', 'cancelled')),
  need_approval INTEGER DEFAULT 0,
  risk_level TEXT DEFAULT 'low',
  latitude REAL,
  longitude REAL,
  remark TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (service_id) REFERENCES services(id),
  FOREIGN KEY (nurse_id) REFERENCES nurses(id)
);

CREATE TABLE IF NOT EXISTS nursing_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER UNIQUE NOT NULL,
  checkin_time DATETIME,
  checkin_latitude REAL,
  checkin_longitude REAL,
  checkout_time DATETIME,
  checkout_latitude REAL,
  checkout_longitude REAL,
  temperature REAL,
  pulse INTEGER,
  breathing INTEGER,
  blood_pressure TEXT,
  spo2 INTEGER,
  blood_sugar REAL,
  vital_signs TEXT,
  operation_process TEXT,
  materials_used TEXT,
  abnormal_situation TEXT,
  family_signature TEXT,
  photos TEXT,
  nurse_remark TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE TABLE IF NOT EXISTS complaints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'resolved', 'closed')),
  handler_id INTEGER,
  handle_remark TEXT,
  handle_time DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS risk_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  nurse_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK(severity IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'pending',
  handler_id INTEGER,
  handle_remark TEXT,
  handle_time DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (nurse_id) REFERENCES nurses(id)
);

CREATE TABLE IF NOT EXISTS nurse_ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER UNIQUE NOT NULL,
  nurse_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (nurse_id) REFERENCES nurses(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS order_materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  inventory_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (inventory_id) REFERENCES inventory(id)
);

CREATE TABLE IF NOT EXISTS dispatch_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  nurse_id INTEGER,
  status TEXT DEFAULT 'waiting' CHECK(status IN ('waiting', 'assigned', 'accepted', 'rejected', 'in_progress', 'completed')),
  route TEXT,
  eta_minutes INTEGER,
  notes TEXT,
  assigned_at DATETIME,
  accepted_at DATETIME,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (nurse_id) REFERENCES nurses(id)
);

CREATE TABLE IF NOT EXISTS nurse_schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nurse_id INTEGER NOT NULL,
  schedule_date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  is_available INTEGER DEFAULT 1,
  order_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (nurse_id) REFERENCES nurses(id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_nurse ON orders(nurse_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_nursing_records_order ON nursing_records(order_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_order ON dispatch_tasks(order_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_nurse ON dispatch_tasks(nurse_id);
