const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const dbPath = path.join(__dirname, '..', '..', 'data', 'app.sqlite')
const dataDir = path.dirname(dbPath)

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      line TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cameras (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      station_id INTEGER REFERENCES stations(id),
      ip_address TEXT,
      status TEXT DEFAULT 'offline',
      last_heartbeat DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS model_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      version TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      description TEXT,
      metrics TEXT,
      file_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(name, version)
    );

    CREATE TABLE IF NOT EXISTS inspection_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      product_id INTEGER REFERENCES products(id),
      station_id INTEGER REFERENCES stations(id),
      camera_id INTEGER REFERENCES cameras(id),
      model_version_id INTEGER REFERENCES model_versions(id),
      status TEXT DEFAULT 'disabled',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS inspection_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER REFERENCES inspection_tasks(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      defect_type TEXT NOT NULL,
      threshold REAL NOT NULL DEFAULT 0.8,
      enabled INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS defect_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER REFERENCES inspection_tasks(id),
      image_path TEXT,
      defect_type TEXT NOT NULL,
      confidence REAL NOT NULL,
      position_x REAL,
      position_y REAL,
      position_w REAL,
      position_h REAL,
      batch_no TEXT,
      work_order TEXT,
      result TEXT DEFAULT 'pending',
      rejudge_result TEXT,
      rejudged_by TEXT,
      rejudged_at DATETIME,
      model_version_id INTEGER REFERENCES model_versions(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS device_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      camera_id INTEGER REFERENCES cameras(id),
      event_type TEXT NOT NULL,
      level TEXT NOT NULL,
      message TEXT,
      acknowledged INTEGER DEFAULT 0,
      acknowledged_by TEXT,
      acknowledged_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS maintenance_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_event_id INTEGER REFERENCES device_events(id),
      title TEXT NOT NULL,
      description TEXT,
      assignee TEXT,
      status TEXT DEFAULT 'pending',
      priority TEXT DEFAULT 'medium',
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_defect_records_batch ON defect_records(batch_no);
    CREATE INDEX IF NOT EXISTS idx_defect_records_type ON defect_records(defect_type);
    CREATE INDEX IF NOT EXISTS idx_defect_records_created ON defect_records(created_at);
    CREATE INDEX IF NOT EXISTS idx_device_events_camera ON device_events(camera_id);
  `)

  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count
  if (productCount === 0) {
    const insertProduct = db.prepare('INSERT INTO products (code, name, description) VALUES (?, ?, ?)')
    insertProduct.run('PCB-001', 'PCB主板-A型', '智能手机主板')
    insertProduct.run('PCB-002', 'PCB主板-B型', '平板电脑主板')

    const insertStation = db.prepare('INSERT INTO stations (code, name, line, description) VALUES (?, ?, ?, ?)')
    insertStation.run('ST-A1', 'A1检测站', '产线A', '正面外观检测')
    insertStation.run('ST-A2', 'A2检测站', '产线A', '背面外观检测')

    const insertCamera = db.prepare('INSERT INTO cameras (code, name, station_id, ip_address, status) VALUES (?, ?, ?, ?, ?)')
    insertCamera.run('CAM-A1-01', 'A1站主相机', 1, '192.168.1.101', 'online')
    insertCamera.run('CAM-A1-02', 'A1站副相机', 1, '192.168.1.102', 'online')
    insertCamera.run('CAM-A2-01', 'A2站主相机', 2, '192.168.1.103', 'offline')

    const insertModel = db.prepare('INSERT INTO model_versions (name, version, status, description) VALUES (?, ?, ?, ?)')
    insertModel.run('PCB-DefectNet', 'v1.0.0', 'published', '初始版本，支持5类缺陷')
    insertModel.run('PCB-DefectNet', 'v1.1.0', 'published', '优化焊点检测准确率')
    insertModel.run('PCB-DefectNet', 'v1.2.0', 'draft', '新增缺件检测')

    const insertTask = db.prepare('INSERT INTO inspection_tasks (code, name, product_id, station_id, camera_id, model_version_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)')
    insertTask.run('TASK-A1-001', 'A1站PCB正面检测', 1, 1, 1, 2, 'enabled')
    insertTask.run('TASK-A2-001', 'A2站PCB背面检测', 1, 2, 3, 1, 'disabled')

    const insertItem = db.prepare('INSERT INTO inspection_items (task_id, name, defect_type, threshold) VALUES (?, ?, ?, ?)')
    insertItem.run(1, '焊点检测', 'solder_joint', 0.85)
    insertItem.run(1, '划痕检测', 'scratch', 0.75)
    insertItem.run(1, '异物检测', 'foreign_material', 0.80)

    const insertDefect = db.prepare(`
      INSERT INTO defect_records (task_id, defect_type, confidence, position_x, position_y, position_w, position_h, batch_no, work_order, model_version_id, result, rejudge_result, rejudged_by, rejudged_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    const defectTypes = ['solder_joint', 'scratch', 'foreign_material', 'missing_component', 'short_circuit']
    const batchNos = ['BATCH-20240520-001', 'BATCH-20240520-002', 'BATCH-20240519-001', 'BATCH-20240519-002', 'BATCH-20240518-001']
    const results = ['pending', 'defect', 'defect', 'false_positive', 'defect']
    
    for (let i = 0; i < 35; i++) {
      const daysAgo = Math.floor(i / 7)
      const hoursAgo = Math.floor(Math.random() * 24)
      const date = new Date()
      date.setDate(date.getDate() - daysAgo)
      date.setHours(date.getHours() - hoursAgo)
      
      const result = results[i % results.length]
      const rejudgeResult = result !== 'pending' ? result : null
      const rejudgedBy = result !== 'pending' ? '质检工程师' : null
      const rejudgedAt = result !== 'pending' ? date.toISOString() : null
      
      insertDefect.run(
        1,
        defectTypes[i % defectTypes.length],
        0.7 + Math.random() * 0.28,
        50 + Math.random() * 200,
        50 + Math.random() * 150,
        20 + Math.random() * 50,
        20 + Math.random() * 40,
        batchNos[i % batchNos.length],
        'WO-2024-0' + (1 + Math.floor(i / 10)),
        2,
        result,
        rejudgeResult,
        rejudgedBy,
        rejudgedAt,
        date.toISOString()
      )
    }

    const insertEvent = db.prepare(`
      INSERT INTO device_events (camera_id, event_type, level, message, acknowledged, acknowledged_by, acknowledged_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    const events = [
      { camera_id: 3, event_type: 'camera_offline', level: 'critical', message: 'A2站主相机连接超时', ack: 1 },
      { camera_id: 1, event_type: 'light_error', level: 'warning', message: '光源亮度波动超过5%', ack: 0 },
      { camera_id: 2, event_type: 'capture_failed', level: 'error', message: '图像采集失败，重试3次后成功', ack: 0 },
      { camera_id: 1, event_type: 'camera_offline', level: 'error', message: '相机心跳中断10秒后恢复', ack: 1 },
    ]
    
    events.forEach((e, i) => {
      const date = new Date()
      date.setHours(date.getHours() - i * 2)
      insertEvent.run(
        e.camera_id, e.event_type, e.level, e.message, e.ack,
        e.ack ? '设备管理员' : null,
        e.ack ? date.toISOString() : null,
        date.toISOString()
      )
    })

    const insertMaintenance = db.prepare(`
      INSERT INTO maintenance_tasks (device_event_id, title, description, assignee, status, priority, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    
    insertMaintenance.run(
      null, '定期校准A1站相机', '按照SOP进行月度校准', '张工', 'pending', 'medium', new Date().toISOString()
    )
  }
}

initDatabase()

module.exports = db
