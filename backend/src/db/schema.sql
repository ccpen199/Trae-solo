CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  phone TEXT UNIQUE,
  email TEXT UNIQUE,
  user_type TEXT NOT NULL CHECK(user_type IN ('student', 'homemaker', 'parttime', 'employer', 'admin')),
  real_name TEXT,
  id_card TEXT,
  id_verified INTEGER DEFAULT 0,
  avatar TEXT,
  skills TEXT,
  location TEXT,
  latitude REAL,
  longitude REAL,
  available_hours TEXT,
  credit_score INTEGER DEFAULT 100,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  company_name TEXT NOT NULL,
  business_license TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  qualification TEXT,
  credit_rating TEXT DEFAULT 'C',
  verified INTEGER DEFAULT 0,
  risk_level TEXT DEFAULT 'low',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employer_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL CHECK(task_type IN ('online', 'offline', 'hybrid')),
  category TEXT NOT NULL,
  skills_required TEXT,
  location TEXT,
  latitude REAL,
  longitude REAL,
  radius INTEGER DEFAULT 5,
  budget REAL NOT NULL,
  unit TEXT DEFAULT 'per_task',
  total_count INTEGER DEFAULT 1,
  accepted_count INTEGER DEFAULT 0,
  start_time DATETIME,
  end_time DATETIME,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'reviewing', 'published', 'in_progress', 'completed', 'cancelled', 'rejected')),
  review_note TEXT,
  risk_level TEXT DEFAULT 'low',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employer_id) REFERENCES employers(id)
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  worker_id INTEGER NOT NULL,
  employer_id INTEGER NOT NULL,
  status TEXT DEFAULT 'accepted' CHECK(status IN ('accepted', 'verified', 'in_progress', 'submitted', 'reviewing', 'completed', 'rejected', 'cancelled', 'appealing')),
  amount REAL NOT NULL,
  deliverable TEXT,
  deliverable_url TEXT,
  submitted_at DATETIME,
  reviewed_at DATETIME,
  review_note TEXT,
  spot_check INTEGER DEFAULT 0,
  spot_check_passed INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id),
  FOREIGN KEY (worker_id) REFERENCES users(id),
  FOREIGN KEY (employer_id) REFERENCES employers(id)
);

CREATE TABLE IF NOT EXISTS settlements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  worker_id INTEGER NOT NULL,
  employer_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  platform_fee REAL NOT NULL,
  worker_amount REAL NOT NULL,
  payment_method TEXT,
  payment_account TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
  settle_date DATE,
  transaction_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE TABLE IF NOT EXISTS appeals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  reason TEXT NOT NULL,
  evidence TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'reviewing', 'resolved', 'rejected')),
  handler_id INTEGER,
  resolution TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS task_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  reviewer_id INTEGER NOT NULL,
  status TEXT NOT NULL,
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id)
);

CREATE TABLE IF NOT EXISTS id_verifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  real_name TEXT NOT NULL,
  id_card TEXT NOT NULL,
  id_card_front TEXT,
  id_card_back TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
  reviewer_id INTEGER,
  review_note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  read INTEGER DEFAULT 0,
  related_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS user_ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  rater_id INTEGER NOT NULL,
  rated_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);
