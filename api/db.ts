import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH || './api/data/app.sqlite';
const db = new Database(path.resolve(__dirname, '..', dbPath));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS canal_systems (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL UNIQUE,
      length REAL NOT NULL,
      capacity REAL NOT NULL,
      status TEXT DEFAULT 'active',
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pump_stations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL UNIQUE,
      canal_id INTEGER REFERENCES canal_systems(id),
      capacity REAL NOT NULL,
      power REAL NOT NULL,
      status TEXT DEFAULT 'normal',
      last_maintenance TEXT,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS gates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL UNIQUE,
      canal_id INTEGER REFERENCES canal_systems(id),
      max_opening REAL NOT NULL,
      current_opening REAL DEFAULT 0,
      status TEXT DEFAULT 'normal',
      location TEXT,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS farm_zones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL UNIQUE,
      area REAL NOT NULL,
      crop_type_id INTEGER,
      canal_id INTEGER REFERENCES canal_systems(id),
      soil_type TEXT,
      location TEXT,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS crop_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL UNIQUE,
      growth_cycle INTEGER NOT NULL,
      water_quota REAL NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS water_quotas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      crop_type_id INTEGER REFERENCES crop_types(id),
      zone_id INTEGER REFERENCES farm_zones(id),
      season TEXT NOT NULL,
      quota_per_acre REAL NOT NULL,
      effective_date TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(crop_type_id, zone_id, season, effective_date)
    );

    CREATE TABLE IF NOT EXISTS water_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      applicant_name TEXT NOT NULL,
      applicant_type TEXT NOT NULL,
      zone_id INTEGER REFERENCES farm_zones(id),
      crop_type_id INTEGER REFERENCES crop_types(id),
      irrigation_area REAL NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      estimated_water REAL NOT NULL,
      priority INTEGER DEFAULT 5,
      status TEXT DEFAULT 'pending',
      reason TEXT,
      created_by TEXT,
      reviewed_by TEXT,
      reviewed_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS water_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER REFERENCES water_applications(id),
      gate_id INTEGER REFERENCES gates(id),
      zone_id INTEGER REFERENCES farm_zones(id),
      scheduled_date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      planned_flow REAL NOT NULL,
      planned_volume REAL NOT NULL,
      status TEXT DEFAULT 'scheduled',
      sequence INTEGER,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS dispatch_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_date TEXT NOT NULL,
      water_source TEXT NOT NULL,
      water_level REAL NOT NULL,
      pump_capacity REAL NOT NULL,
      rotation_rule TEXT,
      total_planned_volume REAL NOT NULL,
      status TEXT DEFAULT 'draft',
      generated_by TEXT,
      adjusted_by TEXT,
      adjust_reason TEXT,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS dispatch_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER REFERENCES dispatch_plans(id) ON DELETE CASCADE,
      schedule_id INTEGER REFERENCES water_schedules(id),
      zone_id INTEGER REFERENCES farm_zones(id),
      gate_id INTEGER REFERENCES gates(id),
      pump_station_id INTEGER REFERENCES pump_stations(id),
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      flow_rate REAL NOT NULL,
      volume REAL NOT NULL,
      sequence INTEGER,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS dispatch_adjustments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER REFERENCES dispatch_plans(id) ON DELETE CASCADE,
      item_id INTEGER REFERENCES dispatch_items(id),
      original_value TEXT,
      new_value TEXT,
      adjust_reason TEXT NOT NULL,
      adjusted_by TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS device_status (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_type TEXT NOT NULL,
      device_id INTEGER NOT NULL,
      device_code TEXT NOT NULL,
      gate_opening REAL,
      flow_rate REAL,
      water_level REAL,
      pump_status TEXT,
      voltage REAL,
      current REAL,
      temperature REAL,
      status TEXT DEFAULT 'normal',
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(device_type, device_id, timestamp)
    );

    CREATE TABLE IF NOT EXISTS alarms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_type TEXT NOT NULL,
      device_id INTEGER NOT NULL,
      device_code TEXT NOT NULL,
      alarm_type TEXT NOT NULL,
      alarm_level TEXT NOT NULL,
      alarm_message TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      acknowledged_by TEXT,
      acknowledged_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      resolved_at TEXT,
      resolution TEXT
    );

    CREATE TABLE IF NOT EXISTS work_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alarm_id INTEGER REFERENCES alarms(id),
      device_type TEXT NOT NULL,
      device_id INTEGER NOT NULL,
      device_code TEXT NOT NULL,
      order_type TEXT NOT NULL,
      priority TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      description TEXT NOT NULL,
      assignee TEXT,
      completed_by TEXT,
      completed_at TEXT,
      created_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS irrigation_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schedule_id INTEGER REFERENCES water_schedules(id),
      dispatch_item_id INTEGER REFERENCES dispatch_items(id),
      zone_id INTEGER REFERENCES farm_zones(id),
      gate_id INTEGER REFERENCES gates(id),
      start_time TEXT,
      end_time TEXT,
      actual_flow REAL,
      actual_volume REAL,
      planned_volume REAL,
      status TEXT DEFAULT 'in_progress',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS water_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_type TEXT NOT NULL,
      report_period TEXT NOT NULL,
      report_date TEXT NOT NULL,
      zone_id INTEGER REFERENCES farm_zones(id),
      planned_water REAL DEFAULT 0,
      actual_water REAL DEFAULT 0,
      water_loss REAL DEFAULT 0,
      deficit REAL DEFAULT 0,
      completion_rate REAL DEFAULT 0,
      irrigation_area REAL DEFAULT 0,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(report_type, report_period, zone_id)
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      user_name TEXT,
      module TEXT NOT NULL,
      action TEXT NOT NULL,
      target_id INTEGER,
      details TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_canal_code ON canal_systems(code);
    CREATE INDEX IF NOT EXISTS idx_pump_code ON pump_stations(code);
    CREATE INDEX IF NOT EXISTS idx_gate_code ON gates(code);
    CREATE INDEX IF NOT EXISTS idx_zone_code ON farm_zones(code);
    CREATE INDEX IF NOT EXISTS idx_crop_code ON crop_types(code);
    CREATE INDEX IF NOT EXISTS idx_application_status ON water_applications(status);
    CREATE INDEX IF NOT EXISTS idx_schedule_date ON water_schedules(scheduled_date);
    CREATE INDEX IF NOT EXISTS idx_plan_date ON dispatch_plans(plan_date);
    CREATE INDEX IF NOT EXISTS idx_device_status_time ON device_status(timestamp);
    CREATE INDEX IF NOT EXISTS idx_alarm_status ON alarms(status);
    CREATE INDEX IF NOT EXISTS idx_work_order_status ON work_orders(status);
    CREATE INDEX IF NOT EXISTS idx_report_period ON water_reports(report_period);
    CREATE INDEX IF NOT EXISTS idx_log_module ON operation_logs(module);
  `);

  const canalCount = (db.prepare('SELECT COUNT(*) as count FROM canal_systems').get() as any).count;
  if (canalCount === 0) {
    const insertCanal = db.prepare('INSERT INTO canal_systems (name, code, length, capacity, status, description) VALUES (?, ?, ?, ?, ?, ?)');
    insertCanal.run('东干渠', 'CAN-001', 25.5, 50.0, 'active', '灌区主输水渠道');
    insertCanal.run('西干渠', 'CAN-002', 18.2, 35.0, 'active', '灌区西部输水渠道');
    insertCanal.run('南支渠', 'CAN-003', 12.8, 20.0, 'active', '南部农田支渠');
    insertCanal.run('北支渠', 'CAN-004', 15.3, 25.0, 'active', '北部农田支渠');

    const insertPump = db.prepare('INSERT INTO pump_stations (name, code, canal_id, capacity, power, status, description) VALUES (?, ?, ?, ?, ?, ?, ?)');
    insertPump.run('一级泵站', 'PMP-001', 1, 50.0, 250.0, 'normal', '主干渠一级提水泵站');
    insertPump.run('二级泵站', 'PMP-002', 1, 35.0, 180.0, 'normal', '主干渠二级提水泵站');
    insertPump.run('西干渠泵站', 'PMP-003', 2, 30.0, 150.0, 'normal', '西干渠提水泵站');

    const insertGate = db.prepare('INSERT INTO gates (name, code, canal_id, max_opening, current_opening, status, location, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    insertGate.run('东干渠首闸', 'GAT-001', 1, 100.0, 0, 'normal', '干渠起点', '东干渠总控制闸');
    insertGate.run('一分闸', 'GAT-002', 1, 80.0, 0, 'normal', '5km处', '东干渠第一分水闸');
    insertGate.run('二分闸', 'GAT-003', 1, 80.0, 0, 'normal', '12km处', '东干渠第二分水闸');
    insertGate.run('西干渠首闸', 'GAT-004', 2, 100.0, 0, 'normal', '西干渠起点', '西干渠总控制闸');
    insertGate.run('南支渠闸', 'GAT-005', 3, 60.0, 0, 'normal', '支渠入口', '南支渠进水闸');
    insertGate.run('北支渠闸', 'GAT-006', 4, 60.0, 0, 'normal', '支渠入口', '北支渠进水闸');

    const insertCrop = db.prepare('INSERT INTO crop_types (name, code, growth_cycle, water_quota, description) VALUES (?, ?, ?, ?, ?)');
    insertCrop.run('水稻', 'CRP-001', 120, 800.0, '一季稻，需水量大');
    insertCrop.run('小麦', 'CRP-002', 180, 450.0, '冬小麦，生育期长');
    insertCrop.run('玉米', 'CRP-003', 100, 350.0, '春玉米，旱作物');
    insertCrop.run('蔬菜', 'CRP-004', 60, 500.0, '蔬菜类，频繁灌溉');
    insertCrop.run('棉花', 'CRP-005', 150, 400.0, '棉花，耐旱作物');

    const insertZone = db.prepare('INSERT INTO farm_zones (name, code, area, crop_type_id, canal_id, soil_type, location, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    insertZone.run('东一灌区', 'ZN-001', 1200.0, 1, 1, '壤土', '干渠东侧', '主要水稻种植区');
    insertZone.run('东二灌区', 'ZN-002', 950.0, 2, 1, '壤土', '干渠中游', '小麦玉米轮作区');
    insertZone.run('西一灌区', 'ZN-003', 800.0, 1, 2, '砂壤土', '西干渠北侧', '水稻高产区');
    insertZone.run('西二灌区', 'ZN-004', 650.0, 4, 2, '壤土', '西干渠南侧', '蔬菜种植基地');
    insertZone.run('南灌区', 'ZN-005', 500.0, 3, 3, '砂壤土', '南支渠', '玉米种植区');
    insertZone.run('北灌区', 'ZN-006', 700.0, 5, 4, '壤土', '北支渠', '棉花种植区');

    const insertQuota = db.prepare('INSERT INTO water_quotas (crop_type_id, zone_id, season, quota_per_acre, effective_date, description) VALUES (?, ?, ?, ?, ?, ?)');
    insertQuota.run(1, 1, '夏季', 800.0, '2025-01-01', '水稻夏季灌溉定额');
    insertQuota.run(2, 2, '冬季', 450.0, '2025-01-01', '小麦冬季灌溉定额');
    insertQuota.run(1, 3, '夏季', 850.0, '2025-01-01', '西灌区水稻灌溉定额');
    insertQuota.run(4, 4, '全年', 500.0, '2025-01-01', '蔬菜全年灌溉定额');
    insertQuota.run(3, 5, '春季', 350.0, '2025-01-01', '玉米春季灌溉定额');
    insertQuota.run(5, 6, '夏季', 400.0, '2025-01-01', '棉花夏季灌溉定额');

    const insertApplication = db.prepare(`
      INSERT INTO water_applications 
      (applicant_name, applicant_type, zone_id, crop_type_id, irrigation_area, start_date, end_date, estimated_water, priority, status, reason, created_by, reviewed_by, reviewed_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertApplication.run('张村合作社', 'cooperative', 1, 1, 500.0, '2025-06-01', '2025-06-05', 4000.0, 1, 'approved', '水稻插秧期需水', '张三', '调度员李明', '2025-05-30 10:30:00');
    insertApplication.run('李村农户', 'farmer', 2, 2, 200.0, '2025-06-06', '2025-06-08', 900.0, 3, 'approved', '小麦返青水', '李四', '调度员李明', '2025-05-31 09:00:00');
    insertApplication.run('王家农场', 'farm', 3, 1, 300.0, '2025-06-03', '2025-06-07', 2550.0, 2, 'pending', '水稻分蘖期灌溉', '王五', null, null);
    insertApplication.run('绿源蔬菜基地', 'enterprise', 4, 4, 150.0, '2025-06-01', '2025-06-30', 7500.0, 1, 'approved', '蔬菜日常灌溉', '赵六', '调度员李明', '2025-05-29 16:00:00');

    const insertSchedule = db.prepare(`
      INSERT INTO water_schedules 
      (application_id, gate_id, zone_id, scheduled_date, start_time, end_time, planned_flow, planned_volume, status, sequence, description) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertSchedule.run(1, 2, 1, '2025-06-01', '08:00', '18:00', 400.0, 4000.0, 'completed', 1, '张村合作社轮灌');
    insertSchedule.run(2, 3, 2, '2025-06-06', '08:00', '14:00', 150.0, 900.0, 'scheduled', 2, '李村农户灌溉');
    insertSchedule.run(4, 4, 4, '2025-06-01', '06:00', '10:00', 125.0, 500.0, 'in_progress', 3, '蔬菜基地日常灌溉');
    insertSchedule.run(1, 1, 1, '2025-06-02', '07:00', '17:00', 350.0, 3500.0, 'scheduled', 4, '张村合作社续灌');
    insertSchedule.run(4, 5, 4, '2025-06-02', '08:00', '12:00', 112.5, 450.0, 'scheduled', 5, '蔬菜基地次日灌溉');

    const insertPlan = db.prepare(`
      INSERT INTO dispatch_plans 
      (plan_date, water_source, water_level, pump_capacity, rotation_rule, total_planned_volume, status, generated_by, description) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertPlan.run('2025-06-01', '水库', 78.5, 85.0, '轮灌', 5400.0, 'executing', '系统自动', '6月1日调度计划');
    insertPlan.run('2025-06-02', '水库', 78.2, 85.0, '轮灌', 5200.0, 'draft', '系统自动', '6月2日调度计划');

    const insertDispatchItem = db.prepare(`
      INSERT INTO dispatch_items 
      (plan_id, schedule_id, zone_id, gate_id, pump_station_id, start_time, end_time, flow_rate, volume, sequence, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertDispatchItem.run(1, 1, 1, 2, 1, '2025-06-01 08:00', '2025-06-01 18:00', 400.0, 4000.0, 1, 'completed');
    insertDispatchItem.run(1, 3, 4, 4, 3, '2025-06-01 06:00', '2025-06-01 10:00', 125.0, 500.0, 2, 'in_progress');
    insertDispatchItem.run(2, 4, 1, 1, 1, '2025-06-02 07:00', '2025-06-02 17:00', 350.0, 3500.0, 1, 'pending');
    insertDispatchItem.run(2, 5, 4, 5, 3, '2025-06-02 08:00', '2025-06-02 12:00', 112.5, 450.0, 2, 'pending');

    const insertDeviceStatus = db.prepare(`
      INSERT INTO device_status 
      (device_type, device_id, device_code, gate_opening, flow_rate, water_level, pump_status, voltage, current, temperature, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertDeviceStatus.run('gate', 1, 'GAT-001', 60.0, 25.0, 78.5, null, 380.0, 45.0, 25.0, 'normal');
    insertDeviceStatus.run('gate', 2, 'GAT-002', 80.0, 400.0, 78.3, null, 380.0, 48.0, 26.0, 'normal');
    insertDeviceStatus.run('gate', 4, 'GAT-004', 50.0, 125.0, 78.5, null, 378.0, 42.0, 25.0, 'normal');
    insertDeviceStatus.run('pump', 1, 'PMP-001', null, 50.0, 78.5, 'running', 380.0, 120.0, 65.0, 'normal');
    insertDeviceStatus.run('pump', 3, 'PMP-003', null, 30.0, 78.5, 'running', 380.0, 85.0, 58.0, 'normal');

    const insertAlarm = db.prepare(`
      INSERT INTO alarms 
      (device_type, device_id, device_code, alarm_type, alarm_level, alarm_message, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertAlarm.run('pump', 2, 'PMP-002', 'temperature', 'warning', '水泵温度偏高，当前68℃', 'active');
    insertAlarm.run('gate', 3, 'GAT-003', 'communication', 'error', '闸门通讯中断', 'active');

    const insertWorkOrder = db.prepare(`
      INSERT INTO work_orders 
      (alarm_id, device_type, device_id, device_code, order_type, priority, status, description, assignee, created_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertWorkOrder.run(1, 'pump', 2, 'PMP-002', 'maintenance', 'high', 'pending', '检查水泵冷却系统，处理温度偏高问题', '维修组王工', '调度中心');
    insertWorkOrder.run(2, 'gate', 3, 'GAT-003', 'repair', 'critical', 'pending', '修复闸门通讯模块，恢复远程控制', '信息组李工', '调度中心');

    const insertIrrigationRecord = db.prepare(`
      INSERT INTO irrigation_records 
      (schedule_id, dispatch_item_id, zone_id, gate_id, start_time, end_time, actual_flow, actual_volume, planned_volume, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertIrrigationRecord.run(1, 1, 1, 2, '2025-06-01 08:00', '2025-06-01 18:00', 395.0, 3950.0, 4000.0, 'completed');
    insertIrrigationRecord.run(3, 2, 4, 4, '2025-06-01 06:00', null, 120.0, 360.0, 500.0, 'in_progress');

    const insertAdjustment = db.prepare(`
      INSERT INTO dispatch_adjustments 
      (plan_id, item_id, original_value, new_value, adjust_reason, adjusted_by) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertAdjustment.run(1, 2, '{"flow_rate":125.0,"end_time":"2025-06-01 10:00"}', '{"flow_rate":120.0,"end_time":"2025-06-01 12:00"}', '西二灌区渠道限流，降低流量并延长灌溉时间', '调度员李明');

    const insertReport = db.prepare(`
      INSERT INTO water_reports 
      (report_type, report_period, report_date, zone_id, planned_water, actual_water, water_loss, deficit, completion_rate, irrigation_area, description) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertReport.run('daily', '2025-06-01', '2025-06-01', 1, 4000.0, 3950.0, 50.0, 50.0, 98.75, 500.0, '东一灌区日报');
    insertReport.run('daily', '2025-06-01', '2025-06-01', 4, 500.0, 360.0, 20.0, 140.0, 72.0, 150.0, '西二灌区日报');
    insertReport.run('monthly', '2025-05', '2025-05-31', null, 125000.0, 118750.0, 6250.0, 6250.0, 95.0, 15000.0, '5月全灌区月报');

    const insertLog = db.prepare(`
      INSERT INTO operation_logs 
      (user_name, module, action, target_id, details, ip_address) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertLog.run('管理员', '灌区档案', '新增', 1, '新增东干渠渠道', '127.0.0.1');
    insertLog.run('调度员李明', '用水申请', '审批', 1, '审批通过张村合作社用水申请', '127.0.0.1');
    insertLog.run('系统', '调度计划', '生成', 1, '自动生成6月1日调度计划', 'system');
    insertLog.run('调度员李明', '用水申请', '审批', 2, '审批通过李村农户用水申请', '127.0.0.1');
    insertLog.run('调度员李明', '用水申请', '审批', 4, '审批通过绿源蔬菜基地用水申请', '127.0.0.1');
    insertLog.run('调度员李明', '调度计划', '调整', 1, '调整计划1第2项：流量125→120，延长灌溉时间', '127.0.0.1');
    insertLog.run('系统', '调度计划', '生成', 2, '自动生成6月2日调度计划（草稿）', 'system');
  }
}

initDatabase();

export default db;
