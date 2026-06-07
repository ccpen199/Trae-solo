const db = require('../config/database')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    nickname TEXT,
    phone TEXT UNIQUE,
    email TEXT,
    avatar TEXT,
    role TEXT DEFAULT 'user',
    member_level INTEGER DEFAULT 1,
    points INTEGER DEFAULT 0,
    preferences TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS cinemas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    province TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    hall_count INTEGER DEFAULT 0,
    equipment_types TEXT,
    status INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS halls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cinema_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    seat_rows INTEGER NOT NULL,
    seat_cols INTEGER NOT NULL,
    seat_layout TEXT,
    equipment_type TEXT,
    FOREIGN KEY (cinema_id) REFERENCES cinemas(id)
  );

  CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    original_title TEXT,
    poster TEXT,
    description TEXT,
    duration INTEGER,
    release_date DATE,
    country TEXT,
    language TEXT,
    versions TEXT,
    rating REAL DEFAULT 0,
    trailer_url TEXT,
    status INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS movie_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    movie_id INTEGER NOT NULL,
    cinema_id INTEGER NOT NULL,
    hall_id INTEGER NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    version TEXT,
    language TEXT,
    base_price DECIMAL(10,2) NOT NULL,
    price_strategy TEXT,
    seat_status TEXT,
    status INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (movie_id) REFERENCES movies(id),
    FOREIGN KEY (cinema_id) REFERENCES cinemas(id),
    FOREIGN KEY (hall_id) REFERENCES halls(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no TEXT UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    session_id INTEGER NOT NULL,
    seats TEXT NOT NULL,
    seats_snapshot TEXT,
    total_amount DECIMAL(10,2) NOT NULL,
    pay_amount DECIMAL(10,2),
    pay_status INTEGER DEFAULT 0,
    pay_time DATETIME,
    verify_code TEXT,
    verify_status INTEGER DEFAULT 0,
    verify_time DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (session_id) REFERENCES movie_sessions(id)
  );

  CREATE TABLE IF NOT EXISTS seat_locks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    seat_key TEXT NOT NULL,
    order_no TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    expire_at DATETIME NOT NULL,
    status INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES movie_sessions(id)
  );

  CREATE TABLE IF NOT EXISTS coupons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    min_amount DECIMAL(10,2) DEFAULT 0,
    valid_from DATETIME,
    valid_to DATETIME,
    total_count INTEGER DEFAULT 0,
    used_count INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS user_coupons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    coupon_id INTEGER NOT NULL,
    status INTEGER DEFAULT 0,
    used_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (coupon_id) REFERENCES coupons(id)
  );

  CREATE TABLE IF NOT EXISTS benefit_packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    points_bonus INTEGER DEFAULT 0,
    coupons TEXT,
    privileges TEXT,
    valid_days INTEGER DEFAULT 30,
    status INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    movie_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    rating INTEGER NOT NULL,
    content TEXT,
    type TEXT DEFAULT 'ugc',
    status INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (movie_id) REFERENCES movies(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS operation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operator_id INTEGER,
    operator_name TEXT,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id INTEGER,
    old_value TEXT,
    new_value TEXT,
    ip TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_cinema_time ON movie_sessions(cinema_id, start_time);
  CREATE INDEX IF NOT EXISTS idx_sessions_movie ON movie_sessions(movie_id);
  CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
  CREATE INDEX IF NOT EXISTS idx_seat_locks_session ON seat_locks(session_id);
`)

console.log('Database initialized successfully')
db.close()
