require('dotenv').config({ path: '../../.env' });
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '../../../data/app.sqlite');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const initSql = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT,
  display_name TEXT,
  role TEXT DEFAULT 'user',
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS collaborators (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL,
  collaborator_id INTEGER NOT NULL,
  permission TEXT DEFAULT 'view',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id),
  FOREIGN KEY (collaborator_id) REFERENCES users(id),
  UNIQUE(owner_id, collaborator_id)
);

CREATE TABLE IF NOT EXISTS goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  year INTEGER NOT NULL,
  dimension TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  weight REAL DEFAULT 1,
  status TEXT DEFAULT 'pending',
  deadline TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS key_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  goal_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_value REAL,
  current_value REAL DEFAULT 0,
  unit TEXT,
  weight REAL DEFAULT 1,
  status TEXT DEFAULT 'pending',
  deadline TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS weekly_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  year INTEGER NOT NULL,
  week_number INTEGER NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  focus TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, year, week_number)
);

CREATE TABLE IF NOT EXISTS weekly_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  weekly_plan_id INTEGER NOT NULL,
  key_result_id INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  priority INTEGER DEFAULT 3,
  status TEXT DEFAULT 'pending',
  actual_progress REAL DEFAULT 0,
  completed_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (weekly_plan_id) REFERENCES weekly_plans(id) ON DELETE CASCADE,
  FOREIGN KEY (key_result_id) REFERENCES key_results(id)
);

CREATE TABLE IF NOT EXISTS milestones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key_result_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_date TEXT,
  target_value REAL,
  is_completed INTEGER DEFAULT 0,
  completed_at TEXT,
  evidence TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (key_result_id) REFERENCES key_results(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS habits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  key_result_id INTEGER,
  name TEXT NOT NULL,
  description TEXT,
  frequency TEXT DEFAULT 'daily',
  target_count INTEGER DEFAULT 1,
  unit TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (key_result_id) REFERENCES key_results(id)
);

CREATE TABLE IF NOT EXISTS habit_checkins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  habit_id INTEGER NOT NULL,
  checkin_date TEXT NOT NULL,
  count INTEGER DEFAULT 1,
  note TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
  UNIQUE(habit_id, checkin_date)
);

CREATE TABLE IF NOT EXISTS execution_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key_result_id INTEGER NOT NULL,
  record_date TEXT NOT NULL,
  progress_value REAL,
  description TEXT NOT NULL,
  time_spent INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (key_result_id) REFERENCES key_results(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS deviation_analyses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key_result_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  reason TEXT NOT NULL,
  impact TEXT,
  solution TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (key_result_id) REFERENCES key_results(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  record_type TEXT NOT NULL,
  record_id INTEGER NOT NULL,
  filename TEXT NOT NULL,
  original_name TEXT,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS annual_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  year INTEGER NOT NULL,
  summary TEXT,
  achievements TEXT,
  key_events TEXT,
  total_time_spent INTEGER DEFAULT 0,
  harvest TEXT,
  regrets TEXT,
  lessons TEXT,
  next_year_suggestions TEXT,
  is_completed INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, year)
);

CREATE TABLE IF NOT EXISTS operation_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id INTEGER,
  detail TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_goals_user_year ON goals(user_id, year);
CREATE INDEX IF NOT EXISTS idx_goals_dimension ON goals(dimension);
CREATE INDEX IF NOT EXISTS idx_key_results_goal ON key_results(goal_id);
CREATE INDEX IF NOT EXISTS idx_weekly_plans_user ON weekly_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_execution_records_kr ON execution_records(key_result_id);
CREATE INDEX IF NOT EXISTS idx_habit_checkins_date ON habit_checkins(checkin_date);
CREATE INDEX IF NOT EXISTS idx_operation_logs_user ON operation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_operation_logs_time ON operation_logs(created_at);
`;

db.exec(initSql);

const bcrypt = require('bcryptjs');
const saltRounds = 10;
const adminPass = bcrypt.hashSync('admin123', saltRounds);
const userPass = bcrypt.hashSync('user123', saltRounds);

const seedSql = `
INSERT OR IGNORE INTO users (username, password_hash, email, display_name, role) VALUES
('admin', '${adminPass}', 'admin@example.com', '系统管理员', 'admin'),
('demo', '${userPass}', 'demo@example.com', '演示用户', 'user');

INSERT OR IGNORE INTO goals (user_id, year, dimension, title, description, weight, status, deadline) VALUES
(2, 2026, '事业', '晋升高级工程师', '通过技术能力提升和项目贡献，争取年内晋升', 1.5, 'in_progress', '2026-12-31'),
(2, 2026, '健康', '每周运动3次', '保持规律运动，提升身体素质', 1.0, 'in_progress', '2026-12-31'),
(2, 2026, '财务', '年度储蓄10万', '控制支出，增加被动收入', 1.2, 'in_progress', '2026-12-31'),
(2, 2026, '学习', '阅读24本书', '每月阅读2本书，涵盖技术、人文、商业', 1.0, 'in_progress', '2026-12-31'),
(2, 2026, '关系', '每月陪伴家人4次', '平衡工作与生活，维护家庭关系', 1.0, 'in_progress', '2026-12-31');

INSERT OR IGNORE INTO key_results (goal_id, title, description, target_value, current_value, unit, weight, status, deadline) VALUES
(1, '完成3个核心项目', '主导或深度参与3个公司级核心项目', 3, 1, '个', 0.4, 'in_progress', '2026-12-31'),
(1, '技术分享8次', '在团队或公司层面做技术分享', 8, 2, '次', 0.3, 'in_progress', '2026-12-31'),
(1, '获得正面绩效评估', '连续两个季度绩效为优秀', 2, 1, '次', 0.3, 'in_progress', '2026-12-31'),
(2, '跑步累计200公里', '全年跑步总里程达到200公里', 200, 45, '公里', 0.5, 'in_progress', '2026-12-31'),
(2, '体重维持在70kg以内', '控制饮食，保持健康体重', 70, 72, 'kg', 0.5, 'in_progress', '2026-12-31'),
(3, '工资储蓄6万', '每月从工资中储蓄5000元', 60000, 25000, '元', 0.6, 'in_progress', '2026-12-31'),
(3, '副业收入4万', '通过技术咨询或课程获得额外收入', 40000, 8000, '元', 0.4, 'in_progress', '2026-12-31'),
(4, '技术书籍12本', '阅读技术相关书籍，提升专业能力', 12, 3, '本', 0.5, 'in_progress', '2026-12-31'),
(4, '非技术书籍12本', '阅读人文、历史、商业类书籍', 12, 2, '本', 0.5, 'in_progress', '2026-12-31'),
(5, '家庭聚餐12次', '每月组织一次家庭聚餐', 12, 3, '次', 0.5, 'in_progress', '2026-12-31'),
(5, '旅行2次', '安排两次家庭旅行', 2, 0, '次', 0.5, 'in_progress', '2026-12-31');

INSERT OR IGNORE INTO habits (user_id, key_result_id, name, description, frequency, target_count, unit) VALUES
(2, 4, '每日晨跑', '早上跑步3公里', 'daily', 1, '次'),
(2, 4, '每周力量训练', '每周2次力量训练', 'weekly', 2, '次'),
(2, 7, '每日阅读', '每天阅读至少30分钟', 'daily', 1, '次');

INSERT OR IGNORE INTO milestones (key_result_id, title, target_date, target_value) VALUES
(1, '完成Q1项目A', '2026-03-31', 1),
(1, '完成Q2项目B', '2026-06-30', 1),
(1, '完成Q4项目C', '2026-12-31', 1),
(4, '上半年完成100公里', '2026-06-30', 100),
(4, '全年完成200公里', '2026-12-31', 200);

INSERT OR IGNORE INTO deviation_analyses (key_result_id, type, reason, impact, solution) VALUES
(5, '延期', '春节期间饮食不规律，体重反弹', '需要额外2个月恢复到目标体重', '调整饮食结构，增加有氧训练'),
(7, '延期', 'Q1项目繁忙，副业时间不足', 'Q1收入目标只完成20%', 'Q2-Q4增加时间投入，开拓新渠道');
`;

db.exec(seedSql);

console.log('数据库初始化完成！');
console.log('数据库路径:', dbPath);
console.log('默认账号: admin/admin123, demo/user123');

db.close();
