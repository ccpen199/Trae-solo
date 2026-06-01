require('dotenv').config({ path: '../../.env' });
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath);

db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS violation_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    violation_id TEXT NOT NULL,
    violation_type TEXT NOT NULL,
    crew_member_id INTEGER,
    crew_name TEXT,
    description TEXT,
    reviewer TEXT,
    review_time DATETIME,
    review_status TEXT DEFAULT 'pending',
    handle_result TEXT,
    adjusted_schedule TEXT,
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crew_member_id) REFERENCES crew_members(id)
  );

  CREATE TABLE IF NOT EXISTS crew_scheduling_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crew_member_id INTEGER NOT NULL,
    review_type TEXT NOT NULL,
    review_date DATE,
    reviewer TEXT,
    health_status TEXT,
    qualification_status TEXT,
    vacation_conflict TEXT,
    schedule_scope TEXT,
    result TEXT,
    impact_description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crew_member_id) REFERENCES crew_members(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS shift_change_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shift_change_id INTEGER NOT NULL,
    before_schedule_json TEXT,
    after_schedule_json TEXT,
    coverage_impact TEXT,
    hours_impact TEXT,
    conflict_check_result TEXT,
    qualification_check_result TEXT,
    review_remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shift_change_id) REFERENCES shift_changes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS crew_route_gaps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crew_member_id INTEGER NOT NULL,
    route_name TEXT NOT NULL,
    position TEXT,
    gap_reason TEXT,
    priority TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crew_member_id) REFERENCES crew_members(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shift_change_id INTEGER,
    receiver_id INTEGER,
    receiver_name TEXT,
    role TEXT,
    method TEXT DEFAULT '系统通知',
    status TEXT DEFAULT 'pending',
    sent_time DATETIME,
    read_time DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shift_change_id) REFERENCES shift_changes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS approval_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shift_change_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    operator TEXT,
    operator_id INTEGER,
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shift_change_id) REFERENCES shift_changes(id) ON DELETE CASCADE
  );
`);

console.log('数据库结构更新完成');
db.close();
