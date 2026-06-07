import db from './db.js';
import bcrypt from 'bcryptjs';

const tableNames = [
  'users',
  'fleets',
  'vehicles',
  'obu_devices',
  'toll_records',
  'toll_traces',
  'monthly_bills',
  'appeals',
  'etc_accounts',
  'obu_upgrade_tasks',
  'obu_upgrade_logs',
  'audit_logs',
];

const migrations = [
  `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'operation', 'maintenance', 'fleet_admin', 'owner')),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    fleet_id INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (fleet_id) REFERENCES fleets(id) ON DELETE SET NULL
  )`,
  `
  CREATE TABLE IF NOT EXISTS fleets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    contact_person TEXT,
    contact_phone TEXT,
    address TEXT,
    vehicle_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `
  CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plate_number TEXT NOT NULL UNIQUE,
    vehicle_type TEXT NOT NULL CHECK(vehicle_type IN ('passenger', 'truck')),
    vehicle_class TEXT NOT NULL CHECK(vehicle_class IN ('1', '2', '3', '4', '5', '6')),
    brand TEXT,
    model TEXT,
    color TEXT,
    register_date TEXT,
    fleet_id INTEGER,
    owner_id INTEGER,
    obu_id INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (fleet_id) REFERENCES fleets(id) ON DELETE SET NULL,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (obu_id) REFERENCES obu_devices(id) ON DELETE SET NULL
  )`,
  `
  CREATE TABLE IF NOT EXISTS obu_devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sn TEXT NOT NULL UNIQUE,
    manufacturer TEXT,
    model TEXT,
    firmware_version TEXT,
    status TEXT NOT NULL DEFAULT 'inventory' CHECK(status IN ('inventory', 'activated', 'deactivated', 'scrapped')),
    vehicle_id INTEGER,
    activated_at TEXT,
    deactivated_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL
  )`,
  `
  CREATE TABLE IF NOT EXISTS toll_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    record_no TEXT NOT NULL UNIQUE,
    vehicle_id INTEGER NOT NULL,
    obu_id INTEGER NOT NULL,
    toll_station TEXT NOT NULL,
    entry_station TEXT,
    exit_station TEXT,
    entry_time TEXT,
    exit_time TEXT,
    mileage REAL,
    vehicle_type TEXT NOT NULL CHECK(vehicle_type IN ('passenger', 'truck')),
    vehicle_class TEXT NOT NULL CHECK(vehicle_class IN ('1', '2', '3', '4', '5', '6')),
    base_fee REAL NOT NULL DEFAULT 0,
    bridge_fee REAL NOT NULL DEFAULT 0,
    tunnel_fee REAL NOT NULL DEFAULT 0,
    surcharge REAL NOT NULL DEFAULT 0,
    discount REAL NOT NULL DEFAULT 0,
    paid_amount REAL NOT NULL DEFAULT 0,
    payment_method TEXT,
    transaction_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (obu_id) REFERENCES obu_devices(id) ON DELETE CASCADE
  )`,
  `
  CREATE TABLE IF NOT EXISTS toll_traces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    toll_record_id INTEGER NOT NULL,
    gps_longitude REAL NOT NULL,
    gps_latitude REAL NOT NULL,
    speed REAL,
    heading REAL,
    altitude REAL,
    recorded_at TEXT NOT NULL,
    FOREIGN KEY (toll_record_id) REFERENCES toll_records(id) ON DELETE CASCADE
  )`,
  `
  CREATE TABLE IF NOT EXISTS monthly_bills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_no TEXT NOT NULL UNIQUE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    vehicle_id INTEGER NOT NULL,
    owner_id INTEGER,
    fleet_id INTEGER,
    total_trips INTEGER NOT NULL DEFAULT 0,
    total_mileage REAL NOT NULL DEFAULT 0,
    total_base_fee REAL NOT NULL DEFAULT 0,
    total_bridge_fee REAL NOT NULL DEFAULT 0,
    total_tunnel_fee REAL NOT NULL DEFAULT 0,
    total_surcharge REAL NOT NULL DEFAULT 0,
    total_discount REAL NOT NULL DEFAULT 0,
    total_amount REAL NOT NULL DEFAULT 0,
    paid_amount REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'unpaid' CHECK(status IN ('unpaid', 'paid', 'overdue', 'waived')),
    due_date TEXT NOT NULL,
    paid_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (fleet_id) REFERENCES fleets(id) ON DELETE SET NULL
  )`,
  `
  CREATE TABLE IF NOT EXISTS appeals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appeal_no TEXT NOT NULL UNIQUE,
    toll_record_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('overcharge', 'wrong_vehicle', 'duplicate', 'other')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'reviewing', 'approved', 'rejected', 'closed')),
    claimed_amount REAL NOT NULL DEFAULT 0,
    refund_amount REAL,
    handler_id INTEGER,
    handle_remark TEXT,
    handled_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (toll_record_id) REFERENCES toll_records(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (handler_id) REFERENCES users(id) ON DELETE SET NULL
  )`,
  `
  CREATE TABLE IF NOT EXISTS etc_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_no TEXT NOT NULL UNIQUE,
    user_id INTEGER NOT NULL,
    balance REAL NOT NULL DEFAULT 0,
    frozen_balance REAL NOT NULL DEFAULT 0,
    total_recharge REAL NOT NULL DEFAULT 0,
    total_consumption REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'normal' CHECK(status IN ('normal', 'frozen', 'disabled')),
    last_recharge_at TEXT,
    last_consumption_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `
  CREATE TABLE IF NOT EXISTS obu_upgrade_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_no TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    firmware_version TEXT NOT NULL,
    firmware_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'running', 'paused', 'completed', 'cancelled')),
    total_devices INTEGER NOT NULL DEFAULT 0,
    success_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    created_by INTEGER NOT NULL,
    started_at TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `
  CREATE TABLE IF NOT EXISTS obu_upgrade_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    obu_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'downloading', 'installing', 'success', 'failed')),
    progress INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    started_at TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (task_id) REFERENCES obu_upgrade_tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (obu_id) REFERENCES obu_devices(id) ON DELETE CASCADE
  )`,
  `
  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id INTEGER,
    detail TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
];

const indexes = [
  'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)',
  'CREATE INDEX IF NOT EXISTS idx_users_fleet ON users(fleet_id)',
  'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)',
  'CREATE INDEX IF NOT EXISTS idx_fleets_code ON fleets(code)',
  'CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(plate_number)',
  'CREATE INDEX IF NOT EXISTS idx_vehicles_fleet ON vehicles(fleet_id)',
  'CREATE INDEX IF NOT EXISTS idx_vehicles_owner ON vehicles(owner_id)',
  'CREATE INDEX IF NOT EXISTS idx_vehicles_obu ON vehicles(obu_id)',
  'CREATE INDEX IF NOT EXISTS idx_vehicles_type ON vehicles(vehicle_type)',
  'CREATE INDEX IF NOT EXISTS idx_obu_sn ON obu_devices(sn)',
  'CREATE INDEX IF NOT EXISTS idx_obu_status ON obu_devices(status)',
  'CREATE INDEX IF NOT EXISTS idx_obu_vehicle ON obu_devices(vehicle_id)',
  'CREATE INDEX IF NOT EXISTS idx_toll_records_no ON toll_records(record_no)',
  'CREATE INDEX IF NOT EXISTS idx_toll_records_vehicle ON toll_records(vehicle_id)',
  'CREATE INDEX IF NOT EXISTS idx_toll_records_obu ON toll_records(obu_id)',
  'CREATE INDEX IF NOT EXISTS idx_toll_records_created ON toll_records(created_at)',
  'CREATE INDEX IF NOT EXISTS idx_toll_records_exit_time ON toll_records(exit_time)',
  'CREATE INDEX IF NOT EXISTS idx_toll_traces_record ON toll_traces(toll_record_id)',
  'CREATE INDEX IF NOT EXISTS idx_toll_traces_recorded ON toll_traces(recorded_at)',
  'CREATE INDEX IF NOT EXISTS idx_monthly_bills_no ON monthly_bills(bill_no)',
  'CREATE INDEX IF NOT EXISTS idx_monthly_bills_vehicle ON monthly_bills(vehicle_id)',
  'CREATE INDEX IF NOT EXISTS idx_monthly_bills_owner ON monthly_bills(owner_id)',
  'CREATE INDEX IF NOT EXISTS idx_monthly_bills_fleet ON monthly_bills(fleet_id)',
  'CREATE INDEX IF NOT EXISTS idx_monthly_bills_period ON monthly_bills(year, month)',
  'CREATE INDEX IF NOT EXISTS idx_monthly_bills_status ON monthly_bills(status)',
  'CREATE INDEX IF NOT EXISTS idx_appeals_no ON appeals(appeal_no)',
  'CREATE INDEX IF NOT EXISTS idx_appeals_record ON appeals(toll_record_id)',
  'CREATE INDEX IF NOT EXISTS idx_appeals_user ON appeals(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_appeals_status ON appeals(status)',
  'CREATE INDEX IF NOT EXISTS idx_appeals_created ON appeals(created_at)',
  'CREATE INDEX IF NOT EXISTS idx_etc_accounts_no ON etc_accounts(account_no)',
  'CREATE INDEX IF NOT EXISTS idx_etc_accounts_user ON etc_accounts(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_etc_accounts_status ON etc_accounts(status)',
  'CREATE INDEX IF NOT EXISTS idx_obu_upgrade_tasks_no ON obu_upgrade_tasks(task_no)',
  'CREATE INDEX IF NOT EXISTS idx_obu_upgrade_tasks_status ON obu_upgrade_tasks(status)',
  'CREATE INDEX IF NOT EXISTS idx_obu_upgrade_tasks_created ON obu_upgrade_tasks(created_at)',
  'CREATE INDEX IF NOT EXISTS idx_obu_upgrade_logs_task ON obu_upgrade_logs(task_id)',
  'CREATE INDEX IF NOT EXISTS idx_obu_upgrade_logs_obu ON obu_upgrade_logs(obu_id)',
  'CREATE INDEX IF NOT EXISTS idx_obu_upgrade_logs_status ON obu_upgrade_logs(status)',
  'CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)',
  'CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id)',
  'CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at)',
];

export function runMigrations(): void {
  const tx = db.transaction(() => {
    for (const sql of migrations) {
      db.exec(sql);
    }
    for (const sql of indexes) {
      db.exec(sql);
    }

    const adminCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    if (adminCount.count === 0) {
      const hash = bcrypt.hashSync('admin123', 10);
      db.prepare(
        "INSERT INTO users (username, password_hash, role, name, phone, email) VALUES ('admin', ?, 'admin', '系统管理员', '13800000000', 'admin@etc.com')"
      ).run(hash);
    }
  });

  tx();
}

export function dropAllTables(): void {
  const tx = db.transaction(() => {
    for (const table of [...tableNames].reverse()) {
      db.exec(`DROP TABLE IF EXISTS ${table}`);
    }
  });
  tx();
}

export function getTableCount(): number {
  return tableNames.length;
}
