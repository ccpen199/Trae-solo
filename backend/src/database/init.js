module.exports = function(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      real_name TEXT,
      id_card TEXT,
      phone TEXT,
      email TEXT,
      user_type TEXT NOT NULL DEFAULT 'citizen',
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS enterprises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      unified_credit_code TEXT UNIQUE NOT NULL,
      legal_person TEXT,
      legal_person_id_card TEXT,
      industry TEXT,
      scale TEXT,
      registered_capital REAL,
      tax_amount REAL DEFAULT 0,
      address TEXT,
      contact_phone TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS enterprise_org (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enterprise_id INTEGER NOT NULL,
      parent_id INTEGER DEFAULT 0,
      name TEXT NOT NULL,
      type TEXT,
      manager TEXT,
      phone TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS enterprise_bindings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      enterprise_id INTEGER NOT NULL,
      role TEXT DEFAULT 'employee',
      status TEXT DEFAULT 'pending',
      verified_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE,
      UNIQUE(user_id, enterprise_id)
    );

    CREATE TABLE IF NOT EXISTS policies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      summary TEXT,
      department TEXT,
      publish_date DATE,
      valid_from DATE,
      valid_to DATE,
      industry_tags TEXT,
      scale_tags TEXT,
      tax_min REAL,
      tax_max REAL,
      benefit_amount REAL,
      benefit_type TEXT,
      status TEXT DEFAULT 'published',
      view_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS policy_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      policy_id INTEGER NOT NULL,
      enterprise_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      application_data TEXT,
      status TEXT DEFAULT 'submitted',
      current_stage TEXT DEFAULT 'review',
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      reviewed_at DATETIME,
      approved_at DATETIME,
      paid_at DATETIME,
      reject_reason TEXT,
      FOREIGN KEY (policy_id) REFERENCES policies(id),
      FOREIGN KEY (enterprise_id) REFERENCES enterprises(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS policy_application_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL,
      stage TEXT NOT NULL,
      status TEXT NOT NULL,
      operator TEXT,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES policy_applications(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS service_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      department TEXT,
      category TEXT,
      description TEXT,
      required_materials TEXT,
      handling_time TEXT,
      online_available INTEGER DEFAULT 1,
      offline_available INTEGER DEFAULT 1,
      status TEXT DEFAULT 'active',
      version INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS service_branches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      district TEXT,
      phone TEXT,
      work_hours TEXT,
      gis_latitude REAL,
      gis_longitude REAL,
      total_windows INTEGER DEFAULT 5,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reservation_no TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      service_item_id INTEGER,
      branch_id INTEGER NOT NULL,
      reservation_date DATE NOT NULL,
      time_slot TEXT NOT NULL,
      window_no INTEGER,
      status TEXT DEFAULT 'reserved',
      queue_number TEXT,
      checkin_time DATETIME,
      complete_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (service_item_id) REFERENCES service_items(id),
      FOREIGN KEY (branch_id) REFERENCES service_branches(id)
    );

    CREATE TABLE IF NOT EXISTS queue_status (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER NOT NULL,
      window_no INTEGER NOT NULL,
      current_queue TEXT,
      waiting_count INTEGER DEFAULT 0,
      avg_wait_time INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (branch_id) REFERENCES service_branches(id)
    );

    CREATE TABLE IF NOT EXISTS chat_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      session_id TEXT UNIQUE NOT NULL,
      title TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      intent TEXT,
      related_service TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES chat_sessions(session_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS api_monitor_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      method TEXT,
      path TEXT,
      status_code INTEGER,
      duration INTEGER,
      user_id INTEGER,
      ip TEXT,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS publish_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_type TEXT NOT NULL,
      item_id INTEGER NOT NULL,
      platform TEXT NOT NULL,
      version TEXT,
      status TEXT DEFAULT 'published',
      published_by TEXT,
      published_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_policies_tags ON policies(industry_tags, scale_tags);
    CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(reservation_date, branch_id);
    CREATE INDEX IF NOT EXISTS idx_applications_status ON policy_applications(status);
    CREATE INDEX IF NOT EXISTS idx_monitor_created ON api_monitor_logs(created_at);
  `);

  const initData = require('./initData');
  initData(db);
};
