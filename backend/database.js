const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const initDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      type TEXT NOT NULL DEFAULT 'single',
      is_pinned INTEGER DEFAULT 0,
      is_muted INTEGER DEFAULT 0,
      last_message_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS conversation_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      unread_count INTEGER DEFAULT 0,
      is_muted INTEGER DEFAULT 0,
      is_pinned INTEGER DEFAULT 0,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(conversation_id, user_id)
    );

    PRAGMA table_info(conversation_members);
    INSERT OR IGNORE INTO conversation_members (conversation_id, user_id, unread_count, is_muted, is_pinned)
    SELECT conversation_id, user_id, unread_count, 0, 0 FROM conversation_members;
    UPDATE conversation_members SET is_muted = 0 WHERE is_muted IS NULL;
    UPDATE conversation_members SET is_pinned = 0 WHERE is_pinned IS NULL;

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      status TEXT DEFAULT 'sent',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS drafts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(conversation_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, key)
    );
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const insertUser = db.prepare('INSERT INTO users (name, avatar) VALUES (?, ?)');
    const users = [
      ['张三', 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan'],
      ['李四', 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisi'],
      ['王五', 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangwu'],
      ['赵六', 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhaoliu']
    ];
    users.forEach(([name, avatar]) => insertUser.run(name, avatar));

    const insertConversation = db.prepare('INSERT INTO conversations (name, type, is_pinned, is_muted, last_message_at) VALUES (?, ?, ?, ?, ?)');
    const convId1 = insertConversation.run('产品需求讨论', 'group', 1, 0, '2024-01-15 10:30:00').lastInsertRowid;
    const convId2 = insertConversation.run(null, 'single', 0, 1, '2024-01-15 09:15:00').lastInsertRowid;
    const convId3 = insertConversation.run('技术架构组', 'group', 0, 0, '2024-01-14 16:45:00').lastInsertRowid;

    const insertMember = db.prepare('INSERT INTO conversation_members (conversation_id, user_id, unread_count) VALUES (?, ?, ?)');
    insertMember.run(convId1, 1, 3);
    insertMember.run(convId1, 2, 0);
    insertMember.run(convId1, 3, 5);
    insertMember.run(convId2, 1, 0);
    insertMember.run(convId2, 2, 1);
    insertMember.run(convId3, 1, 0);
    insertMember.run(convId3, 3, 2);
    insertMember.run(convId3, 4, 0);

    const insertMessage = db.prepare('INSERT INTO messages (conversation_id, sender_id, content, status, created_at) VALUES (?, ?, ?, ?, ?)');
    const messages = [
      [convId1, 2, '新版本需求文档已经上传，请各位查收', 'sent', '2024-01-15 10:20:00'],
      [convId1, 3, '收到，我下午看一下', 'sent', '2024-01-15 10:25:00'],
      [convId1, 4, '有几个接口需要确认，明天约个会吧', 'sending', '2024-01-15 10:30:00'],
      [convId2, 2, '昨天那个bug修复了吗？', 'sent', '2024-01-15 09:10:00'],
      [convId2, 1, '还在排查中，预计下午能搞定', 'failed', '2024-01-15 09:15:00'],
      [convId3, 3, '微服务架构方案已更新', 'sent', '2024-01-14 16:30:00'],
      [convId3, 4, '网关层需要增加限流', 'sent', '2024-01-14 16:40:00'],
      [convId3, 1, '同意，下周开始实施', 'sent', '2024-01-14 16:45:00']
    ];
    messages.forEach(msg => insertMessage.run(...msg));

    const insertDraft = db.prepare('INSERT INTO drafts (conversation_id, user_id, content) VALUES (?, ?, ?)');
    insertDraft.run(convId1, 1, '我明天下午有空，三点怎么样？');
  }
};

const migrateDatabase = () => {
  const tableInfo = db.prepare('PRAGMA table_info(conversation_members)').all();
  const hasMuted = tableInfo.some(col => col.name === 'is_muted');
  const hasPinned = tableInfo.some(col => col.name === 'is_pinned');
  
  if (!hasMuted) {
    db.prepare('ALTER TABLE conversation_members ADD COLUMN is_muted INTEGER DEFAULT 0').run();
  }
  if (!hasPinned) {
    db.prepare('ALTER TABLE conversation_members ADD COLUMN is_pinned INTEGER DEFAULT 0').run();
  }
};

try {
  migrateDatabase();
} catch (e) {
  console.log('Migration skipped:', e.message);
}

initDatabase();

module.exports = db;
