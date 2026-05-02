const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const initDatabase = () => {
  const dataDir = path.join(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = process.env.DB_PATH || path.join(dataDir, 'app.sqlite');
  const db = new Database(dbPath);

  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS vessel_plans (
      id TEXT PRIMARY KEY,
      plan_no TEXT UNIQUE NOT NULL,
      vessel_name TEXT NOT NULL,
      voyage_no TEXT NOT NULL,
      arrival_time DATETIME,
      departure_time DATETIME,
      expected_completion_time DATETIME,
      responsible_person TEXT,
      status TEXT DEFAULT 'DRAFT',
      current_node TEXT DEFAULT 'VESSEL_PLAN',
      description TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS containers (
      id TEXT PRIMARY KEY,
      container_no TEXT UNIQUE NOT NULL,
      size_type TEXT,
      weight REAL,
      seal_no TEXT,
      vessel_plan_id TEXT,
      status TEXT DEFAULT 'PENDING_ARRIVAL',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vessel_plan_id) REFERENCES vessel_plans(id)
    );

    CREATE TABLE IF NOT EXISTS yard_locations (
      id TEXT PRIMARY KEY,
      yard_code TEXT NOT NULL,
      bay TEXT NOT NULL,
      row TEXT NOT NULL,
      tier TEXT NOT NULL,
      status TEXT DEFAULT 'AVAILABLE',
      container_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (container_id) REFERENCES containers(id)
    );

    CREATE TABLE IF NOT EXISTS gate_appointments (
      id TEXT PRIMARY KEY,
      appointment_no TEXT UNIQUE NOT NULL,
      container_id TEXT,
      gate_no TEXT,
      appointment_time DATETIME,
      actual_time DATETIME,
      status TEXT DEFAULT 'SCHEDULED',
      driver_name TEXT,
      vehicle_no TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (container_id) REFERENCES containers(id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      task_no TEXT UNIQUE NOT NULL,
      vessel_plan_id TEXT,
      container_id TEXT,
      task_type TEXT NOT NULL,
      description TEXT,
      assigned_to TEXT,
      status TEXT DEFAULT 'PENDING',
      priority TEXT DEFAULT 'NORMAL',
      gate_no TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vessel_plan_id) REFERENCES vessel_plans(id),
      FOREIGN KEY (container_id) REFERENCES containers(id),
      FOREIGN KEY (assigned_to) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS status_flows (
      id TEXT PRIMARY KEY,
      vessel_plan_id TEXT,
      container_id TEXT,
      task_id TEXT,
      from_status TEXT,
      to_status TEXT NOT NULL,
      action TEXT NOT NULL,
      operator TEXT,
      operator_role TEXT,
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vessel_plan_id) REFERENCES vessel_plans(id),
      FOREIGN KEY (container_id) REFERENCES containers(id),
      FOREIGN KEY (task_id) REFERENCES tasks(id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      recipient_id TEXT,
      title TEXT NOT NULL,
      content TEXT,
      related_type TEXT,
      related_id TEXT,
      status TEXT DEFAULT 'UNREAD',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (recipient_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      vessel_plan_id TEXT,
      container_id TEXT,
      task_id TEXT,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_type TEXT,
      file_size INTEGER,
      uploaded_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vessel_plan_id) REFERENCES vessel_plans(id),
      FOREIGN KEY (container_id) REFERENCES containers(id),
      FOREIGN KEY (task_id) REFERENCES tasks(id),
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS gate_locks (
      id TEXT PRIMARY KEY,
      gate_no TEXT NOT NULL UNIQUE,
      locked_by TEXT,
      locked_at DATETIME,
      task_id TEXT,
      FOREIGN KEY (task_id) REFERENCES tasks(id)
    );

    CREATE TABLE IF NOT EXISTS exceptions (
      id TEXT PRIMARY KEY,
      exception_type TEXT NOT NULL,
      related_type TEXT,
      related_id TEXT,
      description TEXT,
      original_data TEXT,
      status TEXT DEFAULT 'PENDING',
      handled_by TEXT,
      handled_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_role TEXT,
      operation TEXT NOT NULL,
      table_name TEXT,
      record_id TEXT,
      before_data TEXT,
      after_data TEXT,
      ip TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (id, username, password, role, name)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertUser.run('u001', 'dispatcher', '123456', 'DISPATCHER', '码头调度员');
    insertUser.run('u002', 'yard_worker', '123456', 'YARD_WORKER', '堆场员');
    insertUser.run('u003', 'driver', '123456', 'DRIVER', '司机');
    insertUser.run('u004', 'admin', '123456', 'ADMIN', '管理员');
    insertUser.run('u005', 'auditor', '123456', 'AUDITOR', '审计员');
  }

  const yardCount = db.prepare('SELECT COUNT(*) as count FROM yard_locations').get();
  if (yardCount.count === 0) {
    const insertYard = db.prepare(`
      INSERT INTO yard_locations (id, yard_code, bay, row, tier, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (let bay = 1; bay <= 10; bay++) {
      for (let row = 1; row <= 6; row++) {
        for (let tier = 1; tier <= 4; tier++) {
          const id = `y${String(bay).padStart(2, '0')}${String(row).padStart(2, '0')}${String(tier).padStart(2, '0')}`;
          insertYard.run(id, 'A', String(bay), String(row), String(tier), 'AVAILABLE');
        }
      }
    }
  }

  console.log('数据库初始化完成');
  return db;
};

module.exports = initDatabase;
