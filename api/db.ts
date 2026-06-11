import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.join(__dirname, 'data.db')

const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nickname TEXT NOT NULL,
  avatar TEXT DEFAULT '',
  credit_score INTEGER DEFAULT 60,
  credit_level TEXT DEFAULT 'bronze' CHECK(credit_level IN ('bronze','silver','gold','diamond')),
  help_coins INTEGER DEFAULT 0,
  is_verifier BOOLEAN DEFAULT FALSE,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  publisher_id TEXT NOT NULL REFERENCES users(id),
  assignee_id TEXT REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('physical','online','skill')),
  tags TEXT DEFAULT '[]',
  bounty_type TEXT DEFAULT 'coins' CHECK(bounty_type IN ('coins','cash')),
  bounty_amount INTEGER DEFAULT 0,
  deadline TEXT NOT NULL,
  geo_fence TEXT DEFAULT '{}',
  verify_rules TEXT DEFAULT '[]',
  status TEXT DEFAULT 'open' CHECK(status IN ('open','in_progress','verifying','completed','disputed','cancelled')),
  exposure_weight REAL DEFAULT 1.0,
  view_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS evidence (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL CHECK(type IN ('photo','location','timestamp')),
  data TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ratings (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id),
  rater_id TEXT NOT NULL REFERENCES users(id),
  score INTEGER NOT NULL CHECK(score BETWEEN 1 AND 5),
  comment TEXT DEFAULT '',
  type TEXT NOT NULL CHECK(type IN ('publisher','verifier')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS credit_records (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  task_id TEXT REFERENCES tasks(id),
  change INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS coin_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  task_id TEXT REFERENCES tasks(id),
  type TEXT NOT NULL CHECK(type IN ('earn','spend','exchange')),
  amount INTEGER NOT NULL,
  balance INTEGER NOT NULL,
  description TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS risk_alerts (
  id TEXT PRIMARY KEY,
  task_id TEXT REFERENCES tasks(id),
  user_id TEXT REFERENCES users(id),
  type TEXT NOT NULL CHECK(type IN ('brush_order','fake_location','duplicate_submit')),
  risk_level TEXT NOT NULL CHECK(risk_level IN ('low','medium','high')),
  detail TEXT DEFAULT '',
  resolved BOOLEAN DEFAULT FALSE,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
CREATE INDEX IF NOT EXISTS idx_tasks_publisher ON tasks(publisher_id);
CREATE INDEX IF NOT EXISTS idx_tasks_exposure ON tasks(exposure_weight DESC);
CREATE INDEX IF NOT EXISTS idx_credit_records_user ON credit_records(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user ON coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_risk_alerts_resolved ON risk_alerts(resolved);
`)

const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }

if (userCount.count === 0) {
  const passwordHash = bcrypt.hashSync('123456', 10)

  const users = [
    { id: uuidv4(), phone: '13800000001', email: 'zhangsan@example.com', password_hash: passwordHash, nickname: '张三', avatar: '', credit_score: 75, credit_level: 'silver', help_coins: 120, is_verifier: 0 },
    { id: uuidv4(), phone: '13800000002', email: 'lisi@example.com', password_hash: passwordHash, nickname: '李四', avatar: '', credit_score: 90, credit_level: 'gold', help_coins: 350, is_verifier: 1 },
    { id: uuidv4(), phone: '13800000003', email: 'wangwu@example.com', password_hash: passwordHash, nickname: '王五', avatar: '', credit_score: 60, credit_level: 'bronze', help_coins: 50, is_verifier: 0 },
    { id: uuidv4(), phone: '13800000004', email: 'zhaoliu@example.com', password_hash: passwordHash, nickname: '赵六', avatar: '', credit_score: 95, credit_level: 'diamond', help_coins: 800, is_verifier: 1 },
    { id: uuidv4(), phone: '13800000005', email: 'sunqi@example.com', password_hash: passwordHash, nickname: '孙七', avatar: '', credit_score: 45, credit_level: 'bronze', help_coins: 10, is_verifier: 0 },
  ]

  const insertUser = db.prepare(`
    INSERT INTO users (id, phone, email, password_hash, nickname, avatar, credit_score, credit_level, help_coins, is_verifier)
    VALUES (@id, @phone, @email, @password_hash, @nickname, @avatar, @credit_score, @credit_level, @help_coins, @is_verifier)
  `)

  const insertTask = db.prepare(`
    INSERT INTO tasks (id, publisher_id, assignee_id, title, description, category, tags, bounty_type, bounty_amount, deadline, geo_fence, verify_rules, status, exposure_weight, view_count)
    VALUES (@id, @publisher_id, @assignee_id, @title, @description, @category, @tags, @bounty_type, @bounty_amount, @deadline, @geo_fence, @verify_rules, @status, @exposure_weight, @view_count)
  `)

  const transaction = db.transaction(() => {
    for (const user of users) {
      insertUser.run(user)
    }

    const tasks = [
      { id: uuidv4(), publisher_id: users[0].id, assignee_id: null, title: '帮取快递', description: '需要帮忙从菜鸟驿站取一个快递，大约3公斤', category: 'physical', tags: JSON.stringify(['快递', '搬运']), bounty_type: 'coins', bounty_amount: 20, deadline: '2024-12-31T18:00:00Z', geo_fence: JSON.stringify({ lat: 39.9042, lng: 116.4074, radius: 3000 }), verify_rules: JSON.stringify(['photo']), status: 'open', exposure_weight: 1.0, view_count: 15 },
      { id: uuidv4(), publisher_id: users[1].id, assignee_id: users[2].id, title: '代写文档', description: '需要帮忙整理一份项目文档，大约2000字', category: 'online', tags: JSON.stringify(['文档', '写作']), bounty_type: 'coins', bounty_amount: 50, deadline: '2024-12-25T23:59:00Z', geo_fence: JSON.stringify({}), verify_rules: JSON.stringify(['timestamp']), status: 'in_progress', exposure_weight: 1.2, view_count: 30 },
      { id: uuidv4(), publisher_id: users[2].id, assignee_id: users[0].id, title: '修电脑', description: '笔记本电脑开不了机，需要专业人士帮忙检修', category: 'skill', tags: JSON.stringify(['电脑', '维修']), bounty_type: 'cash', bounty_amount: 100, deadline: '2025-01-05T20:00:00Z', geo_fence: JSON.stringify({ lat: 31.2304, lng: 121.4737, radius: 5000 }), verify_rules: JSON.stringify(['photo', 'location']), status: 'verifying', exposure_weight: 1.5, view_count: 45 },
      { id: uuidv4(), publisher_id: users[3].id, assignee_id: users[4].id, title: '遛狗服务', description: '周末需要人帮忙遛金毛犬两小时', category: 'physical', tags: JSON.stringify(['宠物', '遛狗']), bounty_type: 'coins', bounty_amount: 30, deadline: '2025-01-10T10:00:00Z', geo_fence: JSON.stringify({ lat: 39.9042, lng: 116.4074, radius: 2000 }), verify_rules: JSON.stringify(['photo', 'location']), status: 'completed', exposure_weight: 1.0, view_count: 22 },
      { id: uuidv4(), publisher_id: users[4].id, assignee_id: null, title: '数据录入', description: '需要将纸质表格数据录入Excel，大约100条记录', category: 'online', tags: JSON.stringify(['数据', 'Excel']), bounty_type: 'coins', bounty_amount: 80, deadline: '2025-01-15T23:59:00Z', geo_fence: JSON.stringify({}), verify_rules: JSON.stringify(['timestamp']), status: 'open', exposure_weight: 0.8, view_count: 8 },
      { id: uuidv4(), publisher_id: users[0].id, assignee_id: users[1].id, title: '翻译文档', description: '需要将一份英文技术文档翻译成中文，约5000词', category: 'skill', tags: JSON.stringify(['翻译', '英语']), bounty_type: 'cash', bounty_amount: 200, deadline: '2025-01-20T23:59:00Z', geo_fence: JSON.stringify({}), verify_rules: JSON.stringify(['timestamp']), status: 'completed', exposure_weight: 2.0, view_count: 60 },
      { id: uuidv4(), publisher_id: users[3].id, assignee_id: users[2].id, title: '搬家帮手', description: '周末搬家需要两个人帮忙搬家具，约3小时', category: 'physical', tags: JSON.stringify(['搬家', '搬运']), bounty_type: 'cash', bounty_amount: 150, deadline: '2025-01-08T08:00:00Z', geo_fence: JSON.stringify({ lat: 31.2304, lng: 121.4737, radius: 10000 }), verify_rules: JSON.stringify(['photo', 'location', 'timestamp']), status: 'disputed', exposure_weight: 1.3, view_count: 35 },
      { id: uuidv4(), publisher_id: users[1].id, assignee_id: null, title: 'PS修图', description: '需要修5张产品照片，要求精修', category: 'skill', tags: JSON.stringify(['PS', '修图', '设计']), bounty_type: 'coins', bounty_amount: 60, deadline: '2025-02-01T23:59:00Z', geo_fence: JSON.stringify({}), verify_rules: JSON.stringify(['photo']), status: 'open', exposure_weight: 1.1, view_count: 18 },
      { id: uuidv4(), publisher_id: users[4].id, assignee_id: null, title: '代排队', description: '需要帮忙在网红店排队买奶茶，大约1小时', category: 'physical', tags: JSON.stringify(['排队', '代购']), bounty_type: 'coins', bounty_amount: 15, deadline: '2025-01-12T14:00:00Z', geo_fence: JSON.stringify({ lat: 22.5431, lng: 114.0579, radius: 3000 }), verify_rules: JSON.stringify(['photo', 'location']), status: 'cancelled', exposure_weight: 0.5, view_count: 5 },
      { id: uuidv4(), publisher_id: users[2].id, assignee_id: users[3].id, title: '线上辅导', description: '需要高中数学辅导，每周两次每次1小时', category: 'skill', tags: JSON.stringify(['辅导', '数学', '教育']), bounty_type: 'coins', bounty_amount: 100, deadline: '2025-03-01T23:59:00Z', geo_fence: JSON.stringify({}), verify_rules: JSON.stringify(['timestamp']), status: 'in_progress', exposure_weight: 1.8, view_count: 42 },
    ]

    for (const task of tasks) {
      insertTask.run(task)
    }
  })

  transaction()
}

export default db
