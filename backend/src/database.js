const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('patrol', 'repair', 'customer_service', 'manager')),
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS buildings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      area TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS checkpoints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      building_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      qr_code TEXT UNIQUE NOT NULL,
      location TEXT,
      latitude REAL,
      longitude REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (building_id) REFERENCES buildings(id)
    );

    CREATE TABLE IF NOT EXISTS check_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      checkpoint_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      type TEXT DEFAULT 'boolean',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (checkpoint_id) REFERENCES checkpoints(id)
    );

    CREATE TABLE IF NOT EXISTS patrol_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      building_id INTEGER NOT NULL,
      frequency TEXT NOT NULL CHECK(frequency IN ('daily', 'weekly', 'monthly')),
      time_window_start TEXT NOT NULL,
      time_window_end TEXT NOT NULL,
      assigned_user_id INTEGER,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (building_id) REFERENCES buildings(id),
      FOREIGN KEY (assigned_user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS plan_checkpoints (
      plan_id INTEGER NOT NULL,
      checkpoint_id INTEGER NOT NULL,
      order_num INTEGER DEFAULT 0,
      PRIMARY KEY (plan_id, checkpoint_id),
      FOREIGN KEY (plan_id) REFERENCES patrol_plans(id),
      FOREIGN KEY (checkpoint_id) REFERENCES checkpoints(id)
    );

    CREATE TABLE IF NOT EXISTS patrol_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER NOT NULL,
      checkpoint_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      scan_time DATETIME NOT NULL,
      actual_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      latitude REAL,
      longitude REAL,
      location_accuracy REAL,
      is_offline INTEGER DEFAULT 0,
      status TEXT DEFAULT 'normal' CHECK(status IN ('normal', 'late', 'missed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (plan_id) REFERENCES patrol_plans(id),
      FOREIGN KEY (checkpoint_id) REFERENCES checkpoints(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS check_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patrol_record_id INTEGER NOT NULL,
      check_item_id INTEGER NOT NULL,
      result TEXT NOT NULL,
      is_abnormal INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patrol_record_id) REFERENCES patrol_records(id),
      FOREIGN KEY (check_item_id) REFERENCES check_items(id)
    );

    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patrol_record_id INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patrol_record_id) REFERENCES patrol_records(id)
    );

    CREATE TABLE IF NOT EXISTS work_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patrol_record_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL CHECK(type IN ('repair', 'cleaning', 'security')),
      priority TEXT DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'urgent')),
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'assigned', 'processing', 'completed', 'verified', 'closed')),
      assigned_user_id INTEGER,
      created_by INTEGER NOT NULL,
      due_time DATETIME,
      completed_time DATETIME,
      verified_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patrol_record_id) REFERENCES patrol_records(id),
      FOREIGN KEY (assigned_user_id) REFERENCES users(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS work_order_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      work_order_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (work_order_id) REFERENCES work_orders(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('missed_patrol', 'late_patrol', 'overdue_workorder')),
      related_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_patrol_records_user_time ON patrol_records(user_id, scan_time);
    CREATE INDEX IF NOT EXISTS idx_patrol_records_plan ON patrol_records(plan_id);
    CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
    CREATE INDEX IF NOT EXISTS idx_alerts_unread ON alerts(is_read);
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync('123456', 10);
    
    const insertUser = db.prepare(`
      INSERT INTO users (username, password, name, role, phone)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertUser.run('manager', hashedPassword, '项目经理', 'manager', '13800138000');
    insertUser.run('patrol1', hashedPassword, '巡更员张三', 'patrol', '13800138001');
    insertUser.run('patrol2', hashedPassword, '巡更员李四', 'patrol', '13800138002');
    insertUser.run('repair1', hashedPassword, '维修工王五', 'repair', '13800138003');
    insertUser.run('service1', hashedPassword, '客服赵六', 'customer_service', '13800138004');
  }

  const buildingCount = db.prepare('SELECT COUNT(*) as count FROM buildings').get().count;
  if (buildingCount === 0) {
    const insertBuilding = db.prepare('INSERT INTO buildings (name, address, area) VALUES (?, ?, ?)');
    const building1 = insertBuilding.run('1号楼', '小区东区', 'A区');
    const building2 = insertBuilding.run('2号楼', '小区东区', 'A区');
    const building3 = insertBuilding.run('3号楼', '小区西区', 'B区');

    const insertCheckpoint = db.prepare('INSERT INTO checkpoints (building_id, name, qr_code, location, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?)');
    const cp1 = insertCheckpoint.run(building1.lastInsertRowid, '一楼大厅', 'CP001', '1号楼一楼入口', 31.2304, 121.4737);
    const cp2 = insertCheckpoint.run(building1.lastInsertRowid, '电梯间', 'CP002', '1号楼电梯间', 31.2305, 121.4738);
    const cp3 = insertCheckpoint.run(building1.lastInsertRowid, '天台', 'CP003', '1号楼天台', 31.2306, 121.4739);
    const cp4 = insertCheckpoint.run(building2.lastInsertRowid, '消防通道', 'CP004', '2号楼消防通道', 31.2307, 121.4740);
    const cp5 = insertCheckpoint.run(building3.lastInsertRowid, '地下室', 'CP005', '3号楼地下室', 31.2308, 121.4741);

    const insertCheckItem = db.prepare('INSERT INTO check_items (checkpoint_id, name, description, type) VALUES (?, ?, ?, ?)');
    insertCheckItem.run(cp1.lastInsertRowid, '门禁正常', '检查门禁系统是否正常工作', 'boolean');
    insertCheckItem.run(cp1.lastInsertRowid, '地面清洁', '检查大厅地面是否清洁', 'boolean');
    insertCheckItem.run(cp1.lastInsertRowid, '照明正常', '检查照明设备是否正常', 'boolean');
    insertCheckItem.run(cp2.lastInsertRowid, '电梯运行', '检查电梯运行是否正常', 'boolean');
    insertCheckItem.run(cp2.lastInsertRowid, '应急电话', '检查应急电话是否可用', 'boolean');
    insertCheckItem.run(cp3.lastInsertRowid, '消防设施', '检查消防设施是否完好', 'boolean');
    insertCheckItem.run(cp3.lastInsertRowid, '门锁正常', '检查天台门锁是否正常', 'boolean');
    insertCheckItem.run(cp4.lastInsertRowid, '通道畅通', '检查消防通道是否畅通', 'boolean');
    insertCheckItem.run(cp4.lastInsertRowid, '应急照明', '检查应急照明是否正常', 'boolean');
    insertCheckItem.run(cp5.lastInsertRowid, '排水系统', '检查地下室排水是否正常', 'boolean');
    insertCheckItem.run(cp5.lastInsertRowid, '照明正常', '检查地下室照明是否正常', 'boolean');

    const insertPlan = db.prepare('INSERT INTO patrol_plans (name, building_id, frequency, time_window_start, time_window_end, assigned_user_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const plan1 = insertPlan.run('1号楼日常巡检', building1.lastInsertRowid, 'daily', '08:00', '10:00', 2, 'active');
    const plan2 = insertPlan.run('2号楼周巡检', building2.lastInsertRowid, 'weekly', '09:00', '12:00', 3, 'active');
    const plan3 = insertPlan.run('3号楼月巡检', building3.lastInsertRowid, 'monthly', '10:00', '15:00', 2, 'active');

    const insertPlanCheckpoint = db.prepare('INSERT INTO plan_checkpoints (plan_id, checkpoint_id, order_num) VALUES (?, ?, ?)');
    insertPlanCheckpoint.run(plan1.lastInsertRowid, cp1.lastInsertRowid, 1);
    insertPlanCheckpoint.run(plan1.lastInsertRowid, cp2.lastInsertRowid, 2);
    insertPlanCheckpoint.run(plan1.lastInsertRowid, cp3.lastInsertRowid, 3);
    insertPlanCheckpoint.run(plan2.lastInsertRowid, cp4.lastInsertRowid, 1);
    insertPlanCheckpoint.run(plan3.lastInsertRowid, cp5.lastInsertRowid, 1);
  }
}

module.exports = { db, initDatabase };
