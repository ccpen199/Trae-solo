import Database from 'better-sqlite3'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataDir = path.join(__dirname, '..', 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'app.sqlite')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS batteries (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      model TEXT NOT NULL,
      supplier TEXT NOT NULL,
      purchase_batch TEXT NOT NULL,
      capacity REAL NOT NULL,
      warranty_date TEXT NOT NULL,
      initial_test_result TEXT DEFAULT 'pass',
      status TEXT DEFAULT 'in_stock',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_batteries_code ON batteries(code);
    CREATE INDEX IF NOT EXISTS idx_batteries_status ON batteries(status);
    CREATE INDEX IF NOT EXISTS idx_batteries_supplier ON batteries(supplier);

    CREATE TABLE IF NOT EXISTS usage_records (
      id TEXT PRIMARY KEY,
      battery_id TEXT NOT NULL,
      vehicle_id TEXT,
      station_id TEXT,
      order_id TEXT,
      charge_cycles INTEGER DEFAULT 0,
      temperature REAL,
      soc REAL,
      soh REAL,
      has_anomaly INTEGER DEFAULT 0,
      anomaly_desc TEXT,
      recorded_at TEXT DEFAULT (datetime('now')),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (battery_id) REFERENCES batteries(id)
    );
    CREATE INDEX IF NOT EXISTS idx_usage_battery ON usage_records(battery_id);
    CREATE INDEX IF NOT EXISTS idx_usage_recorded ON usage_records(recorded_at);

    CREATE TABLE IF NOT EXISTS maintenance_plans (
      id TEXT PRIMARY KEY,
      battery_id TEXT NOT NULL,
      trigger_type TEXT NOT NULL,
      trigger_condition TEXT NOT NULL,
      task_type TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      priority TEXT DEFAULT 'medium',
      description TEXT,
      scheduled_at TEXT,
      completed_at TEXT,
      completed_by TEXT,
      result TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (battery_id) REFERENCES batteries(id)
    );
    CREATE INDEX IF NOT EXISTS idx_maintenance_battery ON maintenance_plans(battery_id);
    CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_plans(status);

    CREATE TABLE IF NOT EXISTS safety_alerts (
      id TEXT PRIMARY KEY,
      battery_id TEXT NOT NULL,
      alert_type TEXT NOT NULL,
      severity TEXT NOT NULL,
      status TEXT DEFAULT 'open',
      description TEXT,
      resolution TEXT,
      disposition TEXT,
      reviewer TEXT,
      reviewed_at TEXT,
      alert_at TEXT DEFAULT (datetime('now')),
      resolved_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (battery_id) REFERENCES batteries(id)
    );
    CREATE INDEX IF NOT EXISTS idx_alert_battery ON safety_alerts(battery_id);
    CREATE INDEX IF NOT EXISTS idx_alert_status ON safety_alerts(status);
    CREATE INDEX IF NOT EXISTS idx_alert_severity ON safety_alerts(severity);
  `)

  const batteryCount = db.prepare('SELECT COUNT(*) as count FROM batteries').get() as { count: number }
  if (batteryCount.count === 0) {
    seedData()
  }

  const alertCols = db.prepare("PRAGMA table_info(safety_alerts)").all() as { name: string }[]
  const colNames = alertCols.map(c => c.name)
  if (!colNames.includes('disposition')) {
    db.exec("ALTER TABLE safety_alerts ADD COLUMN disposition TEXT")
  }
  if (!colNames.includes('reviewer')) {
    db.exec("ALTER TABLE safety_alerts ADD COLUMN reviewer TEXT")
  }
  if (!colNames.includes('reviewed_at')) {
    db.exec("ALTER TABLE safety_alerts ADD COLUMN reviewed_at TEXT")
  }
}

function seedData() {
  const batteries = [
    { id: uuidv4(), code: 'BAT-2024-001', model: 'LFP-72Ah', supplier: '宁德时代', purchase_batch: 'PB-2024-001', capacity: 72.0, warranty_date: '2027-06-30', initial_test_result: 'pass', status: 'in_use' },
    { id: uuidv4(), code: 'BAT-2024-002', model: 'LFP-100Ah', supplier: '比亚迪', purchase_batch: 'PB-2024-001', capacity: 100.0, warranty_date: '2027-06-30', initial_test_result: 'pass', status: 'in_use' },
    { id: uuidv4(), code: 'BAT-2024-003', model: 'NMC-50Ah', supplier: '国轩高科', purchase_batch: 'PB-2024-002', capacity: 50.0, warranty_date: '2027-03-31', initial_test_result: 'pass', status: 'in_stock' },
    { id: uuidv4(), code: 'BAT-2024-004', model: 'LFP-72Ah', supplier: '宁德时代', purchase_batch: 'PB-2024-002', capacity: 72.0, warranty_date: '2027-03-31', initial_test_result: 'pass', status: 'maintenance' },
    { id: uuidv4(), code: 'BAT-2024-005', model: 'NMC-80Ah', supplier: '亿纬锂能', purchase_batch: 'PB-2024-003', capacity: 80.0, warranty_date: '2027-09-30', initial_test_result: 'pass', status: 'in_use' },
    { id: uuidv4(), code: 'BAT-2023-006', model: 'LFP-100Ah', supplier: '比亚迪', purchase_batch: 'PB-2023-001', capacity: 100.0, warranty_date: '2026-06-30', initial_test_result: 'pass', status: 'retired' },
    { id: uuidv4(), code: 'BAT-2023-007', model: 'NMC-50Ah', supplier: '国轩高科', purchase_batch: 'PB-2023-002', capacity: 50.0, warranty_date: '2026-03-31', initial_test_result: 'fail', status: 'retired' },
    { id: uuidv4(), code: 'BAT-2024-008', model: 'LFP-150Ah', supplier: '宁德时代', purchase_batch: 'PB-2024-004', capacity: 150.0, warranty_date: '2028-01-31', initial_test_result: 'pass', status: 'cascaded' },
    { id: uuidv4(), code: 'BAT-2024-009', model: 'LFP-72Ah', supplier: '亿纬锂能', purchase_batch: 'PB-2024-005', capacity: 72.0, warranty_date: '2027-12-31', initial_test_result: 'pass', status: 'in_stock' },
    { id: uuidv4(), code: 'BAT-2024-010', model: 'NMC-80Ah', supplier: '比亚迪', purchase_batch: 'PB-2024-005', capacity: 80.0, warranty_date: '2027-12-31', initial_test_result: 'pass', status: 'in_use' },
  ]

  const insertBattery = db.prepare(`
    INSERT INTO batteries (id, code, model, supplier, purchase_batch, capacity, warranty_date, initial_test_result, status)
    VALUES (@id, @code, @model, @supplier, @purchase_batch, @capacity, @warranty_date, @initial_test_result, @status)
  `)

  const usageRecords = [
    { id: uuidv4(), battery_id: batteries[0].id, vehicle_id: 'VH-001', station_id: 'ST-BJ-01', order_id: 'OD-20240301', charge_cycles: 320, temperature: 35.2, soc: 82.5, soh: 95.3, has_anomaly: 0, anomaly_desc: null, recorded_at: '2024-12-01 08:30:00' },
    { id: uuidv4(), battery_id: batteries[0].id, vehicle_id: 'VH-001', station_id: 'ST-BJ-01', order_id: 'OD-20240315', charge_cycles: 335, temperature: 36.1, soc: 78.2, soh: 94.8, has_anomaly: 0, anomaly_desc: null, recorded_at: '2024-12-15 09:15:00' },
    { id: uuidv4(), battery_id: batteries[1].id, vehicle_id: 'VH-002', station_id: 'ST-SH-01', order_id: 'OD-20240302', charge_cycles: 210, temperature: 33.5, soc: 90.1, soh: 97.2, has_anomaly: 0, anomaly_desc: null, recorded_at: '2024-12-02 10:00:00' },
    { id: uuidv4(), battery_id: batteries[1].id, vehicle_id: 'VH-003', station_id: 'ST-SH-02', order_id: 'OD-20240320', charge_cycles: 225, temperature: 42.8, soc: 65.3, soh: 96.5, has_anomaly: 1, anomaly_desc: '充电温度过高，触发温控保护', recorded_at: '2024-12-20 14:30:00' },
    { id: uuidv4(), battery_id: batteries[2].id, vehicle_id: null, station_id: 'ST-BJ-02', order_id: null, charge_cycles: 0, temperature: 22.0, soc: 100.0, soh: 100.0, has_anomaly: 0, anomaly_desc: null, recorded_at: '2024-11-01 00:00:00' },
    { id: uuidv4(), battery_id: batteries[3].id, vehicle_id: 'VH-004', station_id: 'ST-GZ-01', order_id: 'OD-20240305', charge_cycles: 480, temperature: 38.6, soc: 55.2, soh: 78.4, has_anomaly: 1, anomaly_desc: 'SOH下降过快，需检修', recorded_at: '2024-12-05 16:45:00' },
    { id: uuidv4(), battery_id: batteries[3].id, vehicle_id: 'VH-004', station_id: 'ST-GZ-01', order_id: 'OD-20240325', charge_cycles: 502, temperature: 37.9, soc: 52.8, soh: 76.1, has_anomaly: 0, anomaly_desc: null, recorded_at: '2024-12-25 11:20:00' },
    { id: uuidv4(), battery_id: batteries[4].id, vehicle_id: 'VH-005', station_id: 'ST-CD-01', order_id: 'OD-20240306', charge_cycles: 150, temperature: 30.2, soc: 88.7, soh: 98.1, has_anomaly: 0, anomaly_desc: null, recorded_at: '2024-12-06 07:30:00' },
    { id: uuidv4(), battery_id: batteries[5].id, vehicle_id: 'VH-006', station_id: 'ST-SZ-01', order_id: 'OD-20240110', charge_cycles: 850, temperature: 40.5, soc: 42.3, soh: 52.7, has_anomaly: 1, anomaly_desc: '容量衰减严重，已达到退役标准', recorded_at: '2024-11-10 13:00:00' },
    { id: uuidv4(), battery_id: batteries[5].id, vehicle_id: 'VH-006', station_id: 'ST-SZ-01', order_id: 'OD-20240125', charge_cycles: 870, temperature: 41.2, soc: 38.1, soh: 50.2, has_anomaly: 1, anomaly_desc: 'SOH持续下降，建议退役', recorded_at: '2024-11-25 15:30:00' },
    { id: uuidv4(), battery_id: batteries[6].id, vehicle_id: 'VH-007', station_id: 'ST-WH-01', order_id: 'OD-20230801', charge_cycles: 920, temperature: 43.5, soc: 35.0, soh: 45.6, has_anomaly: 1, anomaly_desc: '初始检测不合格，已标记退役', recorded_at: '2024-10-01 09:00:00' },
    { id: uuidv4(), battery_id: batteries[7].id, vehicle_id: null, station_id: 'ST-CQ-01', order_id: null, charge_cycles: 600, temperature: 28.5, soc: 70.0, soh: 82.3, has_anomaly: 0, anomaly_desc: null, recorded_at: '2024-12-10 10:30:00' },
    { id: uuidv4(), battery_id: batteries[7].id, vehicle_id: null, station_id: 'ST-CQ-01', order_id: null, charge_cycles: 605, temperature: 27.8, soc: 72.5, soh: 81.9, has_anomaly: 0, anomaly_desc: null, recorded_at: '2024-12-15 10:00:00' },
    { id: uuidv4(), battery_id: batteries[8].id, vehicle_id: null, station_id: 'ST-BJ-03', order_id: null, charge_cycles: 0, temperature: 21.5, soc: 100.0, soh: 100.0, has_anomaly: 0, anomaly_desc: null, recorded_at: '2024-12-20 00:00:00' },
    { id: uuidv4(), battery_id: batteries[9].id, vehicle_id: 'VH-008', station_id: 'ST-HZ-01', order_id: 'OD-20240308', charge_cycles: 180, temperature: 32.8, soc: 85.4, soh: 96.7, has_anomaly: 0, anomaly_desc: null, recorded_at: '2024-12-08 08:45:00' },
    { id: uuidv4(), battery_id: batteries[9].id, vehicle_id: 'VH-008', station_id: 'ST-HZ-01', order_id: 'OD-20240322', charge_cycles: 195, temperature: 33.1, soc: 83.2, soh: 96.2, has_anomaly: 0, anomaly_desc: null, recorded_at: '2024-12-22 09:30:00' },
    { id: uuidv4(), battery_id: batteries[0].id, vehicle_id: 'VH-001', station_id: 'ST-BJ-01', order_id: 'OD-20240401', charge_cycles: 350, temperature: 37.5, soc: 76.8, soh: 93.9, has_anomaly: 0, anomaly_desc: null, recorded_at: '2025-01-01 08:00:00' },
    { id: uuidv4(), battery_id: batteries[4].id, vehicle_id: 'VH-005', station_id: 'ST-CD-01', order_id: 'OD-20240405', charge_cycles: 168, temperature: 31.0, soc: 87.3, soh: 97.8, has_anomaly: 0, anomaly_desc: null, recorded_at: '2025-01-05 07:45:00' },
    { id: uuidv4(), battery_id: batteries[3].id, vehicle_id: null, station_id: 'ST-GZ-01', order_id: null, charge_cycles: 510, temperature: 25.0, soc: 60.0, soh: 74.5, has_anomaly: 0, anomaly_desc: null, recorded_at: '2025-01-10 00:00:00' },
    { id: uuidv4(), battery_id: batteries[1].id, vehicle_id: 'VH-002', station_id: 'ST-SH-01', order_id: 'OD-20240410', charge_cycles: 240, temperature: 34.2, soc: 86.5, soh: 96.0, has_anomaly: 0, anomaly_desc: null, recorded_at: '2025-01-10 11:00:00' },
  ]

  const insertUsageRecord = db.prepare(`
    INSERT INTO usage_records (id, battery_id, vehicle_id, station_id, order_id, charge_cycles, temperature, soc, soh, has_anomaly, anomaly_desc, recorded_at)
    VALUES (@id, @battery_id, @vehicle_id, @station_id, @order_id, @charge_cycles, @temperature, @soc, @soh, @has_anomaly, @anomaly_desc, @recorded_at)
  `)

  const maintenancePlans = [
    { id: uuidv4(), battery_id: batteries[3].id, trigger_type: 'health_level', trigger_condition: 'SOH<80', task_type: 'inspect', status: 'pending', priority: 'high', description: 'SOH持续下降，需进行深度检测', scheduled_at: '2025-02-01 09:00:00', completed_at: null, completed_by: null, result: null },
    { id: uuidv4(), battery_id: batteries[5].id, trigger_type: 'health_level', trigger_condition: 'SOH<60', task_type: 'retire', status: 'completed', priority: 'critical', description: 'SOH已降至50%以下，建议退役处理', scheduled_at: '2024-12-15 10:00:00', completed_at: '2024-12-16 14:30:00', completed_by: '李运维', result: '已完成退役，转入梯次利用评估' },
    { id: uuidv4(), battery_id: batteries[6].id, trigger_type: 'fault_code', trigger_condition: '初始检测不合格', task_type: 'retire', status: 'completed', priority: 'critical', description: '初始测试未通过，直接退役', scheduled_at: '2024-10-05 09:00:00', completed_at: '2024-10-06 11:00:00', completed_by: '王安全', result: '已退役，安排回收处理' },
    { id: uuidv4(), battery_id: batteries[7].id, trigger_type: 'cycle_count', trigger_condition: '循环次数>500', task_type: 'cascade', status: 'pending', priority: 'medium', description: '循环次数超过500次，适合梯次利用', scheduled_at: '2025-03-01 09:00:00', completed_at: null, completed_by: null, result: null },
    { id: uuidv4(), battery_id: batteries[0].id, trigger_type: 'fault_code', trigger_condition: '外观检测发现鼓包', task_type: 'inspect', status: 'pending', priority: 'high', description: '鼓包检测，需确认安全风险', scheduled_at: '2025-01-15 09:00:00', completed_at: null, completed_by: null, result: null },
  ]

  const insertMaintenancePlan = db.prepare(`
    INSERT INTO maintenance_plans (id, battery_id, trigger_type, trigger_condition, task_type, status, priority, description, scheduled_at, completed_at, completed_by, result)
    VALUES (@id, @battery_id, @trigger_type, @trigger_condition, @task_type, @status, @priority, @description, @scheduled_at, @completed_at, @completed_by, @result)
  `)

  const safetyAlerts = [
    { id: uuidv4(), battery_id: batteries[3].id, alert_type: 'capacity_decay', severity: 'high', status: 'open', description: 'SOH快速下降至78.4%，需关注衰减趋势', resolution: null, disposition: null, reviewer: null, reviewed_at: null, alert_at: '2024-12-05 16:50:00', resolved_at: null },
    { id: uuidv4(), battery_id: batteries[1].id, alert_type: 'high_temp', severity: 'medium', status: 'resolved', description: '充电时温度达到42.8°C，触发温控保护', resolution: '已安排降低充电功率，温度恢复正常', disposition: '限制充电功率至0.5C，持续监控7天', reviewer: '张安全', reviewed_at: '2024-12-21 09:00:00', alert_at: '2024-12-20 14:35:00', resolved_at: '2024-12-20 16:00:00' },
    { id: uuidv4(), battery_id: batteries[5].id, alert_type: 'capacity_decay', severity: 'critical', status: 'resolved', description: 'SOH降至50.2%，已达退役阈值', resolution: '已执行退役流程，转入梯次利用', disposition: '强制退役，转梯次利用评估', reviewer: '李运维', reviewed_at: '2024-12-17 10:00:00', alert_at: '2024-11-25 15:45:00', resolved_at: '2024-12-16 14:30:00' },
    { id: uuidv4(), battery_id: batteries[6].id, alert_type: 'insulation', severity: 'critical', status: 'resolved', description: '初始检测绝缘电阻不达标', resolution: '已退役并安排回收处理', disposition: '禁止使用，立即退役回收', reviewer: '王安全', reviewed_at: '2024-10-07 08:30:00', alert_at: '2024-10-01 09:15:00', resolved_at: '2024-10-06 11:00:00' },
    { id: uuidv4(), battery_id: batteries[9].id, alert_type: 'high_temp', severity: 'low', status: 'open', description: '充电温度略高于正常范围，需持续观察', resolution: null, disposition: null, reviewer: null, reviewed_at: null, alert_at: '2025-01-10 11:10:00', resolved_at: null },
    { id: uuidv4(), battery_id: batteries[0].id, alert_type: 'bulging', severity: 'high', status: 'open', description: '外观检测发现轻微鼓包现象', resolution: null, disposition: null, reviewer: null, reviewed_at: null, alert_at: '2025-01-02 08:30:00', resolved_at: null },
    { id: uuidv4(), battery_id: batteries[4].id, alert_type: 'recall', severity: 'medium', status: 'open', description: '供应商通知该批次可能存在潜在缺陷，需排查', resolution: null, disposition: null, reviewer: null, reviewed_at: null, alert_at: '2024-12-28 10:00:00', resolved_at: null },
    { id: uuidv4(), battery_id: batteries[3].id, alert_type: 'high_temp', severity: 'high', status: 'open', description: '检修期间温度异常升高至39.5°C', resolution: null, disposition: null, reviewer: null, reviewed_at: null, alert_at: '2025-01-11 09:00:00', resolved_at: null },
  ]

  const insertSafetyAlert = db.prepare(`
    INSERT INTO safety_alerts (id, battery_id, alert_type, severity, status, description, resolution, disposition, reviewer, reviewed_at, alert_at, resolved_at)
    VALUES (@id, @battery_id, @alert_type, @severity, @status, @description, @resolution, @disposition, @reviewer, @reviewed_at, @alert_at, @resolved_at)
  `)

  const transaction = db.transaction(() => {
    for (const battery of batteries) {
      insertBattery.run(battery)
    }
    for (const record of usageRecords) {
      insertUsageRecord.run(record)
    }
    for (const plan of maintenancePlans) {
      insertMaintenancePlan.run(plan)
    }
    for (const alert of safetyAlerts) {
      insertSafetyAlert.run(alert)
    }
  })

  transaction()
}

export default db
