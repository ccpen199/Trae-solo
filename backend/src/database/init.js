const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const initDatabase = () => {
  db.exec(`
    DROP TABLE IF EXISTS notifications;
    DROP TABLE IF EXISTS schedule_changes;
    DROP TABLE IF EXISTS schedules;
    DROP TABLE IF EXISTS case_timeline;
    DROP TABLE IF EXISTS case_materials;
    DROP TABLE IF EXISTS cases;
    DROP TABLE IF EXISTS judge_leaves;
    DROP TABLE IF EXISTS clerks;
    DROP TABLE IF EXISTS judges;
    DROP TABLE IF EXISTS courts;
    DROP TABLE IF EXISTS holidays;
    
    CREATE TABLE IF NOT EXISTS courts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      location TEXT,
      type TEXT CHECK(type IN ('civil', 'criminal', 'administrative', 'general')) DEFAULT 'general',
      capacity INTEGER DEFAULT 20,
      has_video_system INTEGER DEFAULT 1,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS judges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      employee_id TEXT UNIQUE,
      title TEXT,
      court_type TEXT,
      phone TEXT,
      email TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS clerks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      employee_id TEXT UNIQUE,
      phone TEXT,
      email TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS judge_leaves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      judge_id INTEGER NOT NULL,
      start_date DATETIME NOT NULL,
      end_date DATETIME NOT NULL,
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (judge_id) REFERENCES judges(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_number TEXT NOT NULL UNIQUE,
      case_type TEXT CHECK(case_type IN ('civil', 'criminal', 'administrative', 'commercial', 'family')) NOT NULL,
      case_reason TEXT NOT NULL,
      judge_id INTEGER,
      clerk_id INTEGER,
      parties TEXT NOT NULL,
      agents TEXT,
      estimated_duration INTEGER NOT NULL,
      priority INTEGER CHECK(priority IN (1, 2, 3)) DEFAULT 2,
      status TEXT CHECK(status IN ('draft', 'pending_scheduling', 'scheduled', 'hearing', 'closed', 'postponed')) DEFAULT 'draft',
      materials_complete INTEGER DEFAULT 0,
      materials_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (judge_id) REFERENCES judges(id),
      FOREIGN KEY (clerk_id) REFERENCES clerks(id)
    );

    CREATE TABLE IF NOT EXISTS case_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      material_name TEXT NOT NULL,
      material_type TEXT,
      is_submitted INTEGER DEFAULT 0,
      submitted_at DATETIME,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS case_timeline (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      event_type TEXT NOT NULL,
      event_content TEXT NOT NULL,
      operator TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      court_id INTEGER NOT NULL,
      judge_id INTEGER NOT NULL,
      clerk_id INTEGER,
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      hearing_type TEXT CHECK(hearing_type IN ('in_person', 'online', 'hybrid')) DEFAULT 'in_person',
      status TEXT CHECK(status IN ('scheduled', 'ongoing', 'completed', 'cancelled', 'postponed')) DEFAULT 'scheduled',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
      FOREIGN KEY (court_id) REFERENCES courts(id),
      FOREIGN KEY (judge_id) REFERENCES judges(id),
      FOREIGN KEY (clerk_id) REFERENCES clerks(id)
    );

    CREATE TABLE IF NOT EXISTS schedule_changes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      original_schedule_id INTEGER NOT NULL,
      new_schedule_id INTEGER,
      application_reason TEXT NOT NULL,
      applicant TEXT NOT NULL,
      approver TEXT,
      approval_status TEXT CHECK(approval_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
      approval_time DATETIME,
      notification_status TEXT CHECK(notification_status IN ('pending', 'sent', 'failed', 'partial')) DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (original_schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
      FOREIGN KEY (new_schedule_id) REFERENCES schedules(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schedule_id INTEGER NOT NULL,
      recipient_type TEXT CHECK(recipient_type IN ('party', 'lawyer', 'judge', 'clerk', 'internal')) NOT NULL,
      recipient_name TEXT NOT NULL,
      recipient_contact TEXT NOT NULL,
      notification_type TEXT CHECK(notification_type IN ('scheduling', 'reminder', 'change', 'cancellation')) NOT NULL,
      content TEXT NOT NULL,
      status TEXT CHECK(status IN ('pending', 'sent', 'failed', 'read_receipt')) DEFAULT 'pending',
      send_time DATETIME,
      receipt_time DATETIME,
      failure_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS holidays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date DATE NOT NULL UNIQUE,
      name TEXT NOT NULL,
      type TEXT CHECK(type IN ('legal', 'weekend', 'special')) DEFAULT 'legal',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_schedules_court ON schedules(court_id);
    CREATE INDEX IF NOT EXISTS idx_schedules_judge ON schedules(judge_id);
    CREATE INDEX IF NOT EXISTS idx_schedules_time ON schedules(start_time, end_time);
    CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
    CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
  `);

  const insertCourt = db.prepare('INSERT OR IGNORE INTO courts (name, location, type) VALUES (?, ?, ?)');
  insertCourt.run('第一法庭', 'A座3层', 'civil');
  insertCourt.run('第二法庭', 'A座3层', 'criminal');
  insertCourt.run('第三法庭', 'A座4层', 'administrative');
  insertCourt.run('第四法庭', 'B座2层', 'general');
  insertCourt.run('第五法庭', 'B座2层', 'general');

  const insertJudge = db.prepare('INSERT OR IGNORE INTO judges (name, employee_id, title, court_type) VALUES (?, ?, ?, ?)');
  insertJudge.run('张明', 'J001', '审判员', 'civil');
  insertJudge.run('李华', 'J002', '审判员', 'criminal');
  insertJudge.run('王芳', 'J003', '副庭长', 'administrative');
  insertJudge.run('刘强', 'J004', '庭长', 'civil');

  const insertClerk = db.prepare('INSERT OR IGNORE INTO clerks (name, employee_id) VALUES (?, ?)');
  insertClerk.run('赵晓', 'C001');
  insertClerk.run('陈雨', 'C002');
  insertClerk.run('孙月', 'C003');

  const insertHoliday = db.prepare('INSERT OR IGNORE INTO holidays (date, name, type) VALUES (?, ?, ?)');
  const holidays = [
    ['2026-01-01', '元旦', 'legal'],
    ['2026-01-28', '春节', 'legal'],
    ['2026-01-29', '春节', 'legal'],
    ['2026-01-30', '春节', 'legal'],
    ['2026-04-04', '清明节', 'legal'],
    ['2026-05-01', '劳动节', 'legal'],
    ['2026-06-10', '端午节', 'legal'],
    ['2026-10-01', '国庆节', 'legal'],
    ['2026-10-02', '国庆节', 'legal'],
    ['2026-10-03', '国庆节', 'legal'],
  ];
  holidays.forEach(([date, name, type]) => insertHoliday.run(date, name, type));

  const insertCase = db.prepare(`
    INSERT OR IGNORE INTO cases (case_number, case_type, case_reason, judge_id, parties, agents, estimated_duration, priority, status, materials_complete)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertCase.run('(2026)京民初字第001号', 'civil', '买卖合同纠纷', 1, '原告：北京某科技有限公司；被告：上海某贸易有限公司', '原告代理人：张三律师；被告代理人：李四律师', 120, 2, 'pending_scheduling', 1);
  insertCase.run('(2026)京刑初字第002号', 'criminal', '盗窃案', 2, '公诉人：北京市人民检察院；被告人：王五', '辩护人：赵六律师', 180, 1, 'pending_scheduling', 1);
  insertCase.run('(2026)京行初字第003号', 'administrative', '行政处罚争议', 3, '原告：孙七；被告：北京市某区市场监督管理局', null, 90, 3, 'pending_scheduling', 1);
  insertCase.run('(2026)京民初字第004号', 'civil', '民间借贷纠纷', 4, '原告：周八；被告：吴九', '原告代理人：郑十律师', 60, 2, 'scheduled', 1);
  insertCase.run('(2026)京商初字第005号', 'commercial', '股权转让纠纷', 1, '原告：某投资公司；被告：某实业公司', null, 240, 1, 'scheduled', 1);

  const insertSchedule = db.prepare(`
    INSERT OR IGNORE INTO schedules (case_id, court_id, judge_id, clerk_id, start_time, end_time, hearing_type, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().split('T')[0];

  insertSchedule.run(4, 1, 4, 1, `${tomorrowStr} 09:00:00`, `${tomorrowStr} 10:00:00`, 'in_person', 'scheduled');
  insertSchedule.run(5, 2, 1, 2, `${tomorrowStr} 14:00:00`, `${tomorrowStr} 16:00:00`, 'online', 'scheduled');
  insertSchedule.run(1, 3, 1, 1, `${nextWeekStr} 09:30:00`, `${nextWeekStr} 11:30:00`, 'in_person', 'scheduled');
  insertSchedule.run(2, 4, 2, 2, `${nextWeekStr} 14:30:00`, `${nextWeekStr} 17:30:00`, 'in_person', 'scheduled');
};

initDatabase();

module.exports = db;
