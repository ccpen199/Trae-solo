import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'data', 'app.sqlite');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      nickname TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      avatar TEXT DEFAULT '',
      balance REAL NOT NULL DEFAULT 0,
      banned INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic TEXT NOT NULL,
      category TEXT NOT NULL,
      host_id INTEGER NOT NULL,
      mic_count INTEGER NOT NULL DEFAULT 8,
      popularity INTEGER NOT NULL DEFAULT 0,
      online_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'open',
      password TEXT DEFAULT '',
      max_viewers INTEGER NOT NULL DEFAULT 500,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      closed_at TEXT,
      FOREIGN KEY (host_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS mic_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      slot_index INTEGER NOT NULL,
      user_id INTEGER,
      locked INTEGER NOT NULL DEFAULT 0,
      muted INTEGER NOT NULL DEFAULT 0,
      joined_at TEXT,
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS mic_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      requested_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      decided_at TEXT,
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS room_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      event_type TEXT NOT NULL,
      user_id INTEGER,
      target_id INTEGER,
      data TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS gifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      icon TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      from_user_id INTEGER NOT NULL,
      to_user_id INTEGER,
      content TEXT,
      gift_id INTEGER,
      quantity INTEGER NOT NULL DEFAULT 1,
      amount REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (room_id) REFERENCES rooms(id),
      FOREIGN KEY (from_user_id) REFERENCES users(id),
      FOREIGN KEY (to_user_id) REFERENCES users(id),
      FOREIGN KEY (gift_id) REFERENCES gifts(id)
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_by INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS room_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      reward REAL NOT NULL DEFAULT 0,
      completed INTEGER NOT NULL DEFAULT 0,
      created_by INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      reporter_id INTEGER NOT NULL,
      target_user_id INTEGER,
      reason TEXT NOT NULL,
      description TEXT,
      evidence TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      reviewed_at TEXT,
      reviewed_by INTEGER,
      conclusion TEXT,
      FOREIGN KEY (room_id) REFERENCES rooms(id),
      FOREIGN KEY (reporter_id) REFERENCES users(id),
      FOREIGN KEY (target_user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS review_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      room_id INTEGER,
      user_id INTEGER,
      description TEXT,
      audio_index TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      reviewed_at TEXT,
      reviewed_by INTEGER,
      conclusion TEXT,
      FOREIGN KEY (room_id) REFERENCES rooms(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS violations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      room_id INTEGER,
      type TEXT NOT NULL,
      description TEXT,
      severity TEXT NOT NULL DEFAULT 'minor',
      action TEXT NOT NULL DEFAULT 'warning',
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (room_id) REFERENCES rooms(id)
    );

    CREATE TABLE IF NOT EXISTS room_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      joined_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      left_at TEXT,
      duration_seconds INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (room_id) REFERENCES rooms(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      room_id INTEGER,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (room_id) REFERENCES rooms(id)
    );
  `);
}

function seedData() {
  const userCount = db.prepare('SELECT COUNT(*) as cnt FROM users').get().cnt;
  if (userCount > 0) return;

  const insertUser = db.prepare(`
    INSERT INTO users (username, nickname, role, avatar, balance, banned)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const users = [
    { username: 'admin', nickname: '系统管理员', role: 'admin', balance: 0 },
    { username: 'host1', nickname: '夜猫子主播', role: 'host', balance: 1200 },
    { username: 'host2', nickname: '音乐达人', role: 'host', balance: 850 },
    { username: 'user1', nickname: '小王', role: 'user', balance: 200 },
    { username: 'user2', nickname: '阿强', role: 'user', balance: 550 },
    { username: 'user3', nickname: '小美', role: 'user', balance: 1000 },
    { username: 'user4', nickname: '老张', role: 'user', balance: 320 },
    { username: 'user5', nickname: '丽丽', role: 'user', balance: 780 },
    { username: 'reviewer1', nickname: '审核员A', role: 'reviewer', balance: 0 },
    { username: 'reviewer2', nickname: '审核员B', role: 'reviewer', balance: 0 },
    { username: 'operator1', nickname: '运营小李', role: 'operator', balance: 0 },
  ];

  const insertMany = db.transaction((rows) => {
    for (const u of rows) {
      insertUser.run(u.username, u.nickname, u.role, '', u.balance, 0);
    }
  });
  insertMany(users);

  const insertGift = db.prepare(`
    INSERT INTO gifts (name, price, icon) VALUES (?, ?, ?)
  `);
  const gifts = [
    { name: '玫瑰花', price: 5, icon: '🌹' },
    { name: '棒棒糖', price: 10, icon: '🍭' },
    { name: '皇冠', price: 100, icon: '👑' },
    { name: '火箭', price: 500, icon: '🚀' },
    { name: '城堡', price: 1000, icon: '🏰' },
  ];
  const insertGifts = db.transaction((rows) => {
    for (const g of rows) insertGift.run(g.name, g.price, g.icon);
  });
  insertGifts(gifts);

  const insertRoom = db.prepare(`
    INSERT INTO rooms (topic, category, host_id, mic_count, popularity, online_count, status, max_viewers)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const rooms = [
    { topic: '深夜聊天室 - 谈谈你的故事', category: '情感', hostId: 2, micCount: 8, popularity: 1520, online: 23, status: 'open' },
    { topic: '音乐派对 - 点歌K歌', category: '音乐', hostId: 3, micCount: 9, popularity: 890, online: 15, status: 'open' },
    { topic: '游戏开黑 - 王者上分', category: '游戏', hostId: 2, micCount: 5, popularity: 450, online: 8, status: 'open' },
    { topic: '学习分享 - 英语口语练习', category: '教育', hostId: 3, micCount: 6, popularity: 320, online: 5, status: 'closed' },
  ];
  const insertRooms = db.transaction((rows) => {
    for (const r of rows) {
      insertRoom.run(r.topic, r.category, r.hostId, r.micCount, r.popularity, r.online, r.status, 500);
    }
  });
  insertRooms(rooms);

  const insertMicSlot = db.prepare(`
    INSERT INTO mic_slots (room_id, slot_index, user_id, locked, muted)
    VALUES (?, ?, ?, ?, ?)
  `);
  const slots = [
    { roomId: 1, idx: 0, userId: 2, locked: 0, muted: 0 },
    { roomId: 1, idx: 1, userId: 4, locked: 0, muted: 0 },
    { roomId: 1, idx: 2, userId: 5, locked: 0, muted: 0 },
    { roomId: 1, idx: 3, userId: null, locked: 0, muted: 0 },
    { roomId: 1, idx: 4, userId: null, locked: 1, muted: 0 },
    { roomId: 1, idx: 5, userId: 6, locked: 0, muted: 1 },
    { roomId: 2, idx: 0, userId: 3, locked: 0, muted: 0 },
    { roomId: 2, idx: 1, userId: 7, locked: 0, muted: 0 },
    { roomId: 2, idx: 2, userId: 8, locked: 0, muted: 0 },
  ];
  const insertSlots = db.transaction((rows) => {
    for (const s of rows) {
      insertMicSlot.run(s.roomId, s.idx, s.userId, s.locked, s.muted);
    }
  });
  insertSlots(slots);

  const insertQueue = db.prepare(`
    INSERT INTO mic_queue (room_id, user_id, status) VALUES (?, ?, ?)
  `);
  const queue = [
    { roomId: 1, userId: 7, status: 'pending' },
    { roomId: 1, userId: 8, status: 'pending' },
  ];
  const insertQueueTx = db.transaction((rows) => {
    for (const q of rows) insertQueue.run(q.roomId, q.userId, q.status);
  });
  insertQueueTx(queue);

  const insertEvent = db.prepare(`
    INSERT INTO room_events (room_id, event_type, user_id, data) VALUES (?, ?, ?, ?)
  `);
  const events = [
    { roomId: 1, type: 'room_open', userId: 2, data: '{}' },
    { roomId: 1, type: 'mic_join', userId: 4, data: '{"slot":1}' },
    { roomId: 1, type: 'mic_join', userId: 5, data: '{"slot":2}' },
    { roomId: 1, type: 'gift', userId: 4, data: '{"gift":"玫瑰花","to":2,"amount":5}' },
    { roomId: 1, type: 'barrage', userId: 6, data: '{"content":"大家好呀"}' },
    { roomId: 2, type: 'room_open', userId: 3, data: '{}' },
    { roomId: 2, type: 'mic_join', userId: 7, data: '{"slot":1}' },
  ];
  const insertEvents = db.transaction((rows) => {
    for (const e of rows) insertEvent.run(e.roomId, e.type, e.userId, e.data);
  });
  insertEvents(events);

  const insertReport = db.prepare(`
    INSERT INTO reports (room_id, reporter_id, target_user_id, reason, description, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const reports = [
    { roomId: 1, reporterId: 6, targetUserId: 5, reason: '恶意霸麦', description: '用户长时间占用麦克风不说话', status: 'pending' },
    { roomId: 1, reporterId: 7, targetUserId: 4, reason: '骚扰言论', description: '对其他用户发表不当言论', status: 'reviewing' },
  ];
  const insertReports = db.transaction((rows) => {
    for (const r of rows) insertReport.run(r.roomId, r.reporterId, r.targetUserId, r.reason, r.description, r.status);
  });
  insertReports(reports);

  const insertReviewItem = db.prepare(`
    INSERT INTO review_items (type, room_id, user_id, description, audio_index, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const reviewItems = [
    { type: 'voice', roomId: 1, userId: 5, description: '涉敏语音片段检测', audioIndex: 'audio_001_20240101', status: 'pending' },
    { type: 'dominate_mic', roomId: 1, userId: 5, description: '霸麦超过30分钟未发言', audioIndex: 'audio_002_20240101', status: 'pending' },
  ];
  const insertReviewItems = db.transaction((rows) => {
    for (const r of rows) insertReviewItem.run(r.type, r.roomId, r.userId, r.description, r.audioIndex, r.status);
  });
  insertReviewItems(reviewItems);

  const insertViolation = db.prepare(`
    INSERT INTO violations (user_id, room_id, type, description, severity, action)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const violations = [
    { userId: 4, roomId: 2, type: 'spam', description: '发送广告信息', severity: 'minor', action: 'mute_10min' },
    { userId: 5, roomId: 1, type: 'harassment', description: '骚扰其他用户', severity: 'major', action: 'kick_room' },
  ];
  const insertViolations = db.transaction((rows) => {
    for (const v of rows) insertViolation.run(v.userId, v.roomId, v.type, v.description, v.severity, v.action);
  });
  insertViolations(violations);

  const insertPayment = db.prepare(`
    INSERT INTO payments (user_id, room_id, amount, type, description)
    VALUES (?, ?, ?, ?, ?)
  `);
  const payments = [
    { userId: 4, roomId: 1, amount: 50, type: 'gift', description: '购买礼物玫瑰花x10' },
    { userId: 5, roomId: 1, amount: 100, type: 'gift', description: '购买礼物皇冠x1' },
    { userId: 6, roomId: 2, amount: 200, type: 'recharge', description: '账户充值' },
  ];
  const insertPayments = db.transaction((rows) => {
    for (const p of rows) insertPayment.run(p.userId, p.roomId, p.amount, p.type, p.description);
  });
  insertPayments(payments);

  const insertAnnouncement = db.prepare(`
    INSERT INTO announcements (room_id, content, created_by) VALUES (?, ?, ?)
  `);
  const announcements = [
    { roomId: 1, content: '欢迎来到深夜聊天室，注意文明发言哦~', createdBy: 2 },
    { roomId: 2, content: '今晚8点有K歌比赛，欢迎参与！', createdBy: 3 },
  ];
  const insertAnnouncements = db.transaction((rows) => {
    for (const a of rows) insertAnnouncement.run(a.roomId, a.content, a.createdBy);
  });
  insertAnnouncements(announcements);

  const insertTask = db.prepare(`
    INSERT INTO room_tasks (room_id, title, description, reward, created_by)
    VALUES (?, ?, ?, ?, ?)
  `);
  const tasks = [
    { roomId: 1, title: '送10朵玫瑰', description: '给房主送10朵玫瑰花', reward: 50, createdBy: 2 },
    { roomId: 2, title: '唱一首歌', description: '在麦上唱一首歌', reward: 30, createdBy: 3 },
  ];
  const insertTasks = db.transaction((rows) => {
    for (const t of rows) insertTask.run(t.roomId, t.title, t.description, t.reward, t.createdBy);
  });
  insertTasks(tasks);

  const insertSession = db.prepare(`
    INSERT INTO room_sessions (room_id, user_id, joined_at, left_at, duration_seconds)
    VALUES (?, ?, ?, ?, ?)
  `);
  const now = new Date();
  const sessions = [];
  for (let day = 0; day < 30; day++) {
    const date = new Date(now);
    date.setDate(date.getDate() - day);
    const dateStr = date.toISOString().split('T')[0];
    for (let i = 0; i < 8; i++) {
      const roomId = (i % 4) + 1;
      const userId = (i % 5) + 4;
      const duration = 300 + Math.floor(Math.random() * 3600);
      const hour = 18 + (i % 4);
      sessions.push({
        roomId,
        userId,
        joinedAt: `${dateStr} ${hour.toString().padStart(2, '0')}:00:00`,
        leftAt: `${dateStr} ${(hour + 1).toString().padStart(2, '0')}:00:00`,
        duration
      });
    }
  }
  const insertSessions = db.transaction((rows) => {
    for (const s of rows) insertSession.run(s.roomId, s.userId, s.joinedAt, s.leftAt, s.duration);
  });
  insertSessions(sessions);

  db.prepare("UPDATE payments SET created_at = ? WHERE id = 1").run(`${new Date(new Date().setDate(new Date().getDate() - 2)).toISOString().split('T')[0]} 20:30:00`);
  db.prepare("UPDATE payments SET created_at = ? WHERE id = 2").run(`${new Date(new Date().setDate(new Date().getDate() - 5)).toISOString().split('T')[0]} 21:15:00`);
  db.prepare("UPDATE payments SET created_at = ? WHERE id = 3").run(`${new Date(new Date().setDate(new Date().getDate() - 10)).toISOString().split('T')[0]} 19:00:00`);
  const insertPayment2 = db.prepare(`
    INSERT INTO payments (user_id, room_id, amount, type, description, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const extraPayments = [];
  for (let day = 0; day < 14; day++) {
    const date = new Date();
    date.setDate(date.getDate() - day);
    const dateStr = date.toISOString().split('T')[0];
    extraPayments.push({ userId: 4, roomId: 1, amount: 50, type: 'gift', desc: '购买礼物', date: `${dateStr} 20:00:00` });
    extraPayments.push({ userId: 5, roomId: 2, amount: 100, type: 'gift', desc: '购买礼物', date: `${dateStr} 21:00:00` });
  }
  const insertExtraPayments = db.transaction((rows) => {
    for (const p of rows) insertPayment2.run(p.userId, p.roomId, p.amount, p.type, p.desc, p.date);
  });
  insertExtraPayments(extraPayments);

  db.prepare("UPDATE violations SET created_at = ? WHERE id = 1").run(`${new Date(new Date().setDate(new Date().getDate() - 3)).toISOString().split('T')[0]} 22:00:00`);
  db.prepare("UPDATE violations SET created_at = ? WHERE id = 2").run(`${new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0]} 23:00:00`);

  db.prepare("UPDATE reports SET evidence = ?, created_at = ? WHERE id = 1").run('audio_room1_20260520_001.mp3', `${new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0]} 21:30:00`);
  db.prepare("UPDATE reports SET evidence = ?, created_at = ? WHERE id = 2").run('audio_room1_20260518_002.mp3', `${new Date(new Date().setDate(new Date().getDate() - 4)).toISOString().split('T')[0]} 20:00:00`);
}

initSchema();
seedData();

export default db;
