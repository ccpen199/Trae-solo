const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '../../data/app.sqlite')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS cranes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_code TEXT UNIQUE NOT NULL,
      install_location TEXT NOT NULL,
      record_info TEXT,
      driver_name TEXT,
      driver_phone TEXT,
      maintenance_unit TEXT,
      maintenance_phone TEXT,
      test_valid_until DATE,
      status TEXT DEFAULT 'normal',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS monitor_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      crane_id INTEGER NOT NULL,
      weight REAL,
      weight_status TEXT DEFAULT 'normal',
      range REAL,
      range_status TEXT DEFAULT 'normal',
      height REAL,
      height_status TEXT DEFAULT 'normal',
      wind_speed REAL,
      wind_speed_status TEXT DEFAULT 'normal',
      tilt_angle REAL,
      tilt_status TEXT DEFAULT 'normal',
      collision_risk INTEGER DEFAULT 0,
      data_source TEXT,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (crane_id) REFERENCES cranes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      crane_id INTEGER NOT NULL,
      alert_type TEXT NOT NULL,
      alert_level TEXT DEFAULT 'warning',
      message TEXT,
      status TEXT DEFAULT 'pending',
      handler TEXT,
      handle_result TEXT,
      handled_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (crane_id) REFERENCES cranes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS maintenance_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      crane_id INTEGER NOT NULL,
      plan_date DATE NOT NULL,
      check_items TEXT,
      found_problems TEXT,
      rectify_photos TEXT,
      recheck_result TEXT,
      status TEXT DEFAULT 'pending',
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (crane_id) REFERENCES cranes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS handle_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alert_id INTEGER NOT NULL,
      operator TEXT,
      action TEXT,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE
    );
  `)

  const craneCount = db.prepare('SELECT COUNT(*) as count FROM cranes').get().count
  if (craneCount === 0) {
    const insertCrane = db.prepare(`
      INSERT INTO cranes (device_code, install_location, record_info, driver_name, driver_phone, maintenance_unit, maintenance_phone, test_valid_until, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const today = new Date()
    const validDate = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate())
    const expiredDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())

    insertCrane.run('TC-001', 'A区1号楼北侧', '备案号: AJ2024001', '张三', '13800138001', '诚信维保公司', '400-800-0001', validDate.toISOString().split('T')[0], 'normal')
    insertCrane.run('TC-002', 'B区2号楼东侧', '备案号: AJ2024002', '李四', '13800138002', '诚信维保公司', '400-800-0001', expiredDate.toISOString().split('T')[0], 'warning')
    insertCrane.run('TC-003', 'C区3号楼南侧', '备案号: AJ2024003', '王五', '13800138003', '安全维保公司', '400-800-0002', validDate.toISOString().split('T')[0], 'offline')

    const insertMonitor = db.prepare(`
      INSERT INTO monitor_data (crane_id, weight, weight_status, range, range_status, height, height_status, wind_speed, wind_speed_status, tilt_angle, tilt_status, collision_risk, data_source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    for (let i = 0; i < 10; i++) {
      insertMonitor.run(1, 2.5 + Math.random(), 'normal', 30 + Math.random() * 10, 'normal', 40 + Math.random() * 20, 'normal', 3 + Math.random() * 2, 'normal', 0.5 + Math.random(), 'normal', 0, 'sensor')
      insertMonitor.run(2, 3.5 + Math.random(), 'normal', 35 + Math.random() * 5, 'normal', 45 + Math.random() * 15, 'normal', 8 + Math.random() * 3, 'warning', 1.2 + Math.random(), 'warning', 1, 'sensor')
      insertMonitor.run(3, 0, 'offline', 0, 'offline', 0, 'offline', 0, 'offline', 0, 'offline', 0, 'system')
    }

    const insertAlert = db.prepare(`
      INSERT INTO alerts (crane_id, alert_type, alert_level, message, status)
      VALUES (?, ?, ?, ?, ?)
    `)

    insertAlert.run(1, 'overload', 'warning', '当前载重接近额定上限', 'pending')
    insertAlert.run(2, 'strong_wind', 'danger', '风速超过安全阈值', 'pending')
    insertAlert.run(2, 'expired_cert', 'warning', '设备检测证件已过期', 'pending')
    insertAlert.run(3, 'offline', 'danger', '设备离线超过30分钟', 'pending')

    const insertMaintenance = db.prepare(`
      INSERT INTO maintenance_plans (crane_id, plan_date, check_items, status)
      VALUES (?, ?, ?, ?)
    `)

    const nextWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7)
    const lastWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7)

    insertMaintenance.run(1, nextWeek.toISOString().split('T')[0], '钢丝绳,制动器,限位装置', 'pending')
    insertMaintenance.run(2, lastWeek.toISOString().split('T')[0], '钢结构,电气系统,安全装置', 'overdue')
    insertMaintenance.run(3, nextWeek.toISOString().split('T')[0], '全面检查', 'pending')
  }
}

initDatabase()

module.exports = db
