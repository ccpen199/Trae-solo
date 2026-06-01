const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, 'data');
const dbPath = path.join(dbDir, 'app.sqlite');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nickname TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      role TEXT DEFAULT 'user',
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL DEFAULT 'direct',
      name TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      is_pinned INTEGER DEFAULT 0,
      is_archived INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS conversation_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      is_muted INTEGER DEFAULT 0,
      is_blocked INTEGER DEFAULT 0,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(conversation_id, user_id),
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER,
      type TEXT NOT NULL DEFAULT 'text',
      content TEXT NOT NULL,
      status TEXT DEFAULT 'sent',
      fail_reason TEXT DEFAULT '',
      is_recalled INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES users(id),
      FOREIGN KEY (receiver_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS message_status (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      status TEXT DEFAULT 'delivered',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(message_id, user_id),
      FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS friendships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      friend_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, friend_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS blacklist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      blocked_user_id INTEGER NOT NULL,
      reason TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, blocked_user_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (blocked_user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reporter_id INTEGER NOT NULL,
      reported_user_id INTEGER NOT NULL,
      message_id INTEGER,
      reason TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT DEFAULT 'pending',
      moderator_id INTEGER,
      action TEXT DEFAULT '',
      action_note TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reporter_id) REFERENCES users(id),
      FOREIGN KEY (reported_user_id) REFERENCES users(id),
      FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE SET NULL,
      FOREIGN KEY (moderator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS punishments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      report_id INTEGER,
      type TEXT NOT NULL,
      reason TEXT DEFAULT '',
      duration INTEGER DEFAULT 0,
      expires_at DATETIME,
      moderator_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE SET NULL,
      FOREIGN KEY (moderator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS rate_limits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      count INTEGER DEFAULT 0,
      window_start DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, action),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id INTEGER,
      details TEXT DEFAULT '',
      ip_address TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS sensitive_words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word TEXT UNIQUE NOT NULL,
      severity INTEGER DEFAULT 1,
      category TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_messages_conv_time ON messages(conversation_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
    CREATE INDEX IF NOT EXISTS idx_conversation_members_user ON conversation_members(user_id);
    CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (username, password, nickname, avatar, role, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const users = [
      ['admin', 'admin123', '系统管理员', '', 'admin', 'active'],
      ['moderator1', 'mod123', '审核员小明', '', 'moderator', 'active'],
      ['cs1', 'cs123', '客服小红', '', 'cs', 'active'],
      ['platform', 'admin123', '社区运营', '', 'moderator', 'active'],
      ['ops', 'admin123', '运营专员', '', 'cs', 'active'],
      ['user1', 'user123', '张三', '', 'user', 'active'],
      ['user2', 'user123', '李四', '', 'user', 'active'],
      ['user3', 'user123', '王五', '', 'user', 'active'],
    ];
    const insertMany = db.transaction((users) => {
      for (const u of users) insertUser.run(...u);
    });
    insertMany(users);

    const makeFriends = db.prepare(`
      INSERT INTO friendships (user_id, friend_id, status) VALUES (?, ?, 'accepted')
    `);
    const friendships = [
      [4, 5], [5, 4], [4, 6], [6, 4], [5, 6], [6, 5],
      [1, 2], [2, 1], [1, 3], [3, 1], [2, 3], [3, 2],
    ];
    const insertFriendships = db.transaction((list) => {
      for (const f of list) makeFriends.run(...f);
    });
    insertFriendships(friendships);

    const insertConv = db.prepare(`
      INSERT INTO conversations (type, name, avatar) VALUES (?, ?, ?)
    `);
    const conv1 = insertConv.run('direct', '', '').lastInsertRowid;
    const conv2 = insertConv.run('group', '技术交流群', '').lastInsertRowid;
    const conv3 = insertConv.run('cs', '客服会话', '').lastInsertRowid;
    const conv4 = insertConv.run('direct', '', '').lastInsertRowid;
    const conv5 = insertConv.run('group', '运营工作群', '').lastInsertRowid;

    const addMember = db.prepare(`
      INSERT INTO conversation_members (conversation_id, user_id) VALUES (?, ?)
    `);
    const members = [
      [conv1, 4], [conv1, 5],
      [conv2, 4], [conv2, 5], [conv2, 6],
      [conv3, 4], [conv3, 3],
      [conv4, 1], [conv4, 2],
      [conv5, 1], [conv5, 2], [conv5, 3],
    ];
    const insertMembers = db.transaction((list) => {
      for (const m of list) addMember.run(...m);
    });
    insertMembers(members);

    const insertMsg = db.prepare(`
      INSERT INTO messages (conversation_id, sender_id, receiver_id, type, content, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const messages = [
      [conv1, 4, 5, 'text', '你好，李四！最近怎么样？', 'read'],
      [conv1, 5, 4, 'text', '挺好的，你呢？', 'read'],
      [conv1, 4, 5, 'text', '我也不错，周末有空一起吃饭吗？', 'delivered'],
      [conv2, 4, null, 'text', '大家好，欢迎加入技术交流群！', 'read'],
      [conv2, 5, null, 'text', '谢谢群主！', 'read'],
      [conv2, 6, null, 'text', '有什么技术问题可以在这里讨论', 'delivered'],
      [conv3, 4, null, 'text', '您好，请问有什么可以帮助您的？', 'read'],
      [conv3, 3, null, 'text', '我的订单出现了问题，能帮我处理吗？', 'delivered'],
      [conv4, 1, 2, 'text', '小明，今天的举报审核进度怎么样了？', 'read'],
      [conv4, 2, 1, 'text', '管理员好，今天已处理 12 条举报，还有 3 条待处理。', 'delivered'],
      [conv5, 1, null, 'text', '各位同事，本周重点关注骚扰消息拦截效果。', 'read'],
      [conv5, 2, null, 'text', '好的，我会重点跟进敏感词检测。', 'read'],
      [conv5, 3, null, 'text', '客服这边也会注意收集用户反馈。', 'delivered'],
    ];
    const insertMessages = db.transaction((list) => {
      for (const m of list) insertMsg.run(...m);
    });
    insertMessages(messages);

    const insertWord = db.prepare(`
      INSERT OR IGNORE INTO sensitive_words (word, severity, category) VALUES (?, ?, ?)
    `);
    const words = [
      ['违禁词1', 3, '政治'],
      ['违禁词2', 3, '色情'],
      ['垃圾信息', 2, '广告'],
      ['诈骗', 3, '违法'],
      ['赌博', 3, '违法'],
    ];
    const insertWords = db.transaction((list) => {
      for (const w of list) insertWord.run(...w);
    });
    insertWords(words);
  }
}

initDatabase();

module.exports = db;
