import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || './data/app.sqlite';
const db = new Database(dbPath);

db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    nickname TEXT,
    avatar TEXT,
    is_vip INTEGER DEFAULT 0,
    vip_expire_at DATETIME,
    daily_stamina INTEGER DEFAULT 100,
    last_stamina_refresh DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    avatar TEXT,
    role TEXT NOT NULL,
    personality TEXT,
    is_default INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT,
    type TEXT NOT NULL,
    is_default INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    icon TEXT,
    balance REAL DEFAULT 0,
    is_default INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    contact_id INTEGER,
    category_id INTEGER NOT NULL,
    account_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    type TEXT NOT NULL,
    name TEXT,
    remark TEXT,
    transaction_date DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (account_id) REFERENCES accounts(id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    contact_id INTEGER,
    sender_type TEXT NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    transaction_id INTEGER,
    is_favorited INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS medals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    icon TEXT,
    description TEXT,
    unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

const defaultCategories = [
  { name: '餐饮', icon: '🍜', type: 'expense', sort: 0 },
  { name: '交通', icon: '🚗', type: 'expense', sort: 1 },
  { name: '购物', icon: '🛒', type: 'expense', sort: 2 },
  { name: '娱乐', icon: '🎮', type: 'expense', sort: 3 },
  { name: '医疗', icon: '💊', type: 'expense', sort: 4 },
  { name: '教育', icon: '📚', type: 'expense', sort: 5 },
  { name: '居住', icon: '🏠', type: 'expense', sort: 6 },
  { name: '通讯', icon: '📱', type: 'expense', sort: 7 },
  { name: '工资', icon: '💰', type: 'income', sort: 0 },
  { name: '奖金', icon: '🎁', type: 'income', sort: 1 },
  { name: '投资', icon: '📈', type: 'income', sort: 2 },
  { name: '兼职', icon: '💼', type: 'income', sort: 3 },
];

const checkCategory = db.prepare('SELECT id FROM categories WHERE name = ? AND type = ?');
const insertCategory = db.prepare('INSERT INTO categories (name, icon, type, sort_order) VALUES (?, ?, ?, ?)');

defaultCategories.forEach((cat) => {
  const existing = checkCategory.get(cat.name, cat.type);
  if (!existing) {
    insertCategory.run(cat.name, cat.icon, cat.type, cat.sort);
  }
});

export const runQuery = (sql: string, params: any[] = []): any => {
  const stmt = db.prepare(sql);
  const result = stmt.run(...params);
  return { lastID: result.lastInsertRowid, changes: result.changes };
};

export const getOne = (sql: string, params: any[] = []): any => {
  const stmt = db.prepare(sql);
  return stmt.get(...params);
};

export const getAll = (sql: string, params: any[] = []): any[] => {
  const stmt = db.prepare(sql);
  return stmt.all(...params);
};

export default db;