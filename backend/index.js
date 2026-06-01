require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const PORT = parseInt(process.env.BACKEND_PORT, 10);
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = path.join(DATA_DIR, 'app.sqlite');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

const app = express();
app.use(cors({ origin: `http://127.0.0.1:${process.env.FRONTEND_PORT}` }));
app.use(express.json({ limit: '2mb' }));

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  level INTEGER DEFAULT 1,
  last_visit TEXT,
  tags TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  type TEXT DEFAULT 'manual',
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  jump_url TEXT,
  style TEXT DEFAULT 'info',
  channels TEXT DEFAULT '["in_app"]',
  audience_config TEXT NOT NULL,
  schedule_time TEXT,
  freq_config TEXT DEFAULT '{}',
  status TEXT DEFAULT 'draft',
  created_by TEXT DEFAULT 'admin',
  created_at TEXT DEFAULT (datetime('now','localtime')),
  updated_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS approvals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  approver TEXT,
  status TEXT DEFAULT 'pending',
  sensitive_check INTEGER DEFAULT 0,
  duplicate_check INTEGER DEFAULT 0,
  url_check INTEGER DEFAULT 0,
  freq_check INTEGER DEFAULT 0,
  gray_check INTEGER DEFAULT 0,
  comment TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime')),
  FOREIGN KEY (task_id) REFERENCES tasks(id)
);

CREATE TABLE IF NOT EXISTS send_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  channel TEXT NOT NULL,
  delivered INTEGER DEFAULT 0,
  displayed INTEGER DEFAULT 0,
  clicked INTEGER DEFAULT 0,
  closed INTEGER DEFAULT 0,
  failed INTEGER DEFAULT 0,
  unsubscribed INTEGER DEFAULT 0,
  fail_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now','localtime')),
  FOREIGN KEY (task_id) REFERENCES tasks(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS task_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  version INTEGER NOT NULL,
  title TEXT,
  content TEXT,
  jump_url TEXT,
  operator_note TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime')),
  FOREIGN KEY (task_id) REFERENCES tasks(id)
);

CREATE TABLE IF NOT EXISTS freq_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  channel TEXT NOT NULL,
  task_id INTEGER,
  sent_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS system_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);
`);

const SENSITIVE_WORDS = ['违禁', '赌博', '色情', '诈骗', '传销', '暴力'];

function checkSensitive(text) {
  return SENSITIVE_WORDS.filter(w => text.includes(w));
}

function computeAudience(config) {
  const { tags = [], behaviors = [], minLevel = 0, lastVisitDays = 0, exclude = {} } = config;
  const conditions = [];
  const params = [];

  if (minLevel > 0) { conditions.push('level >= ?'); params.push(minLevel); }
  if (lastVisitDays > 0) { conditions.push(`last_visit >= datetime('now','localtime',?)`); params.push(`-${lastVisitDays} days`); }
  if (tags.length > 0) {
    const tagConds = tags.map(() => 'json_extract(tags, ?) IS NOT NULL');
    conditions.push('(' + tagConds.join(' OR ') + ')');
    tags.forEach((_, i) => params.push(`$[${i}]`));
  }
  if (behaviors.length > 0) {
    conditions.push("json_extract(tags, '$') LIKE ?");
    params.push('%\"behavior%');
  }

  let sql = 'SELECT id, username, name, level, last_visit, tags FROM users';
  if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');

  let rows = db.prepare(sql).all(...params);
  if (tags.length > 0) {
    rows = rows.filter(r => {
      const userTags = JSON.parse(r.tags || '[]');
      return tags.some(t => userTags.includes(t));
    });
  }
  if (exclude.tags && exclude.tags.length > 0) {
    rows = rows.filter(r => {
      const userTags = JSON.parse(r.tags || '[]');
      return !exclude.tags.some(t => userTags.includes(t));
    });
  }
  if (exclude.behaviors && exclude.behaviors.length > 0) {
    rows = rows.filter(r => {
      const userTags = JSON.parse(r.tags || '[]');
      return !exclude.behaviors.some(b => userTags.some(t => t.includes(b)));
    });
  }

  return rows;
}

function checkFreqConflict(taskId, config) {
  const channels = config.channels || ['in_app'];
  const conflicts = [];
  for (const ch of channels) {
    const recent = db.prepare(`SELECT COUNT(*) as cnt FROM freq_log WHERE channel = ? AND sent_at >= datetime('now','localtime','-1 days')`).get(ch);
    if (recent.cnt > 100) conflicts.push(`${ch}: 24h内已发送${recent.cnt}次`);
  }
  return conflicts;
}

function initDemoData() {
  const userCount = db.prepare('SELECT COUNT(*) as cnt FROM users').get().cnt;
  if (userCount === 0) {
    const insertUser = db.prepare('INSERT INTO users (username, name, level, last_visit, tags) VALUES (?, ?, ?, ?, ?)');
    const levels = [1, 2, 3, 4, 5];
    const tagPool = ['vip', 'new_user', 'active', 'inactive', 'browsed_product', 'abandoned_cart', 'paid_user'];
    for (let i = 1; i <= 200; i++) {
      const username = `user_${String(i).padStart(4, '0')}`;
      const name = `用户${i}`;
      const level = levels[i % levels.length];
      const daysAgo = i % 15;
      const lastVisit = daysAgo === 0
        ? new Date().toISOString().replace('T', ' ').slice(0, 19)
        : new Date(Date.now() - daysAgo * 86400000).toISOString().replace('T', ' ').slice(0, 19);
      const userTags = [];
      if (i % 3 === 0) userTags.push('vip');
      if (i % 4 === 0) userTags.push('new_user');
      if (i % 5 === 0) userTags.push('browsed_product');
      if (i % 7 === 0) userTags.push('abandoned_cart');
      if (i % 2 === 0) userTags.push('active');
      if (i % 6 === 0) userTags.push('paid_user');
      if (userTags.length === 0) userTags.push('inactive');
      insertUser.run(username, name, level, lastVisit, JSON.stringify(userTags));
    }

    const insertTag = db.prepare('INSERT OR IGNORE INTO tags (name, type) VALUES (?, ?)');
    tagPool.forEach(t => insertTag.run(t, 'auto'));

    const insertTask = db.prepare(`INSERT INTO tasks (title, content, jump_url, style, channels, audience_config, schedule_time, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
    const task1 = insertTask.run(
      '限时优惠活动',
      '尊敬的用户，您有一个限时优惠待领取！点击查看详情。',
      '/promotions/2024',
      'warning',
      '["in_app","browser"]',
      JSON.stringify({ tags: ['vip'], minLevel: 2, lastVisitDays: 7, exclude: { tags: ['inactive'] } }),
      null,
      'approved'
    );
    const task2 = insertTask.run(
      '新用户专享福利',
      '欢迎加入！新用户专享5折优惠券已发放至您的账户。',
      '/welcome',
      'success',
      '["in_app"]',
      JSON.stringify({ tags: ['new_user'], minLevel: 1, lastVisitDays: 3 }),
      null,
      'approved'
    );

    db.prepare('INSERT INTO approvals (task_id, approver, status, sensitive_check, duplicate_check, url_check, freq_check, gray_check, comment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(task1.lastInsertRowid, 'admin', 'approved', 1, 1, 1, 1, 1, '审批通过');
    db.prepare('INSERT INTO approvals (task_id, approver, status, sensitive_check, duplicate_check, url_check, freq_check, gray_check, comment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(task2.lastInsertRowid, 'admin', 'approved', 1, 1, 1, 1, 1, '审批通过');

    const insertRecord = db.prepare(`INSERT INTO send_records (task_id, user_id, channel, delivered, displayed, clicked, closed, failed, unsubscribed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    for (let i = 1; i <= 50; i++) {
      const delivered = Math.random() > 0.1 ? 1 : 0;
      const displayed = delivered ? (Math.random() > 0.2 ? 1 : 0) : 0;
      const clicked = displayed ? (Math.random() > 0.5 ? 1 : 0) : 0;
      const closed = displayed && !clicked ? 1 : 0;
      const failed = delivered ? 0 : 1;
      insertRecord.run(task1.lastInsertRowid, i, 'in_app', delivered, displayed, clicked, closed, failed, 0);
    }

    const insertSysUser = db.prepare('INSERT OR IGNORE INTO system_users (username, password, name, role) VALUES (?, ?, ?, ?)');
    insertSysUser.run('operator', '123456', '运营专员', 'operator');
    insertSysUser.run('approver', '123456', '审批专员', 'approver');
  }
}

initDemoData();

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), db: DB_PATH });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: '请输入账号密码' });
  }
  const user = db.prepare('SELECT id, username, name, role FROM system_users WHERE username = ? AND password = ?').get(username, password);
  if (!user) {
    return res.status(401).json({ success: false, message: '账号或密码错误' });
  }
  if (role && user.role !== role) {
    return res.status(403).json({ success: false, message: '该账号无此角色权限' });
  }
  res.json({ success: true, user: { id: user.id, username: user.username, name: user.name, role: user.role } });
});

function requireRole(roles) {
  return (req, res, next) => {
    next();
  };
}

app.get('/api/users', (req, res) => {
  const { page = 1, pageSize = 20, keyword, level } = req.query;
  const conditions = [];
  const params = [];
  if (keyword) { conditions.push('(name LIKE ? OR username LIKE ?)'); params.push(`%${keyword}%`, `%${keyword}%`); }
  if (level) { conditions.push('level = ?'); params.push(level); }
  let sql = 'SELECT id, username, name, level, last_visit, tags FROM users';
  if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
  const total = db.prepare('SELECT COUNT(*) as cnt FROM (' + sql + ')').get(...params).cnt;
  const limit = parseInt(pageSize);
  const offset = (parseInt(page) - 1) * limit;
  const list = db.prepare(sql + ' ORDER BY id LIMIT ' + limit + ' OFFSET ' + offset).all(...params);
  res.json({ total, list, page: parseInt(page), pageSize: parseInt(pageSize) });
});

app.get('/api/tags', (req, res) => {
  const list = db.prepare('SELECT * FROM tags ORDER BY id').all();
  res.json({ list });
});

app.get('/api/tasks', (req, res) => {
  const { page = 1, pageSize = 20, status, keyword } = req.query;
  const conditions = [];
  const params = [];
  if (status) { conditions.push('t.status = ?'); params.push(status); }
  if (keyword) { conditions.push('t.title LIKE ?'); params.push(`%${keyword}%`); }
  let sql = 'SELECT t.*, (SELECT COUNT(*) FROM send_records sr WHERE sr.task_id = t.id) as send_count FROM tasks t';
  if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
  const total = db.prepare('SELECT COUNT(*) as cnt FROM (' + sql + ')').get(...params).cnt;
  const limit = parseInt(pageSize);
  const offset = (parseInt(page) - 1) * limit;
  const list = db.prepare(sql + ' ORDER BY t.id DESC LIMIT ' + limit + ' OFFSET ' + offset).all(...params);
  res.json({
    total,
    list: list.map(t => ({
      ...t,
      channels: JSON.parse(t.channels),
      audience_config: JSON.parse(t.audience_config),
      freq_config: JSON.parse(t.freq_config)
    })),
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

app.get('/api/tasks/:id', (req, res) => {
  const t = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!t) return res.status(404).json({ error: '任务不存在' });
  res.json({
    ...t,
    channels: JSON.parse(t.channels),
    audience_config: JSON.parse(t.audience_config),
    freq_config: JSON.parse(t.freq_config)
  });
});

app.post('/api/tasks', (req, res) => {
  const { title, content, jump_url, style, channels, audience_config, schedule_time, freq_config } = req.body;
  if (!title || !content) return res.status(400).json({ error: '标题和正文必填' });
  const sensitive = checkSensitive(title + content);
  const info = db.prepare(`INSERT INTO tasks (title, content, jump_url, style, channels, audience_config, schedule_time, freq_config, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    title, content, jump_url || '', style || 'info',
    JSON.stringify(channels || ['in_app']),
    JSON.stringify(audience_config || {}),
    schedule_time || null,
    JSON.stringify(freq_config || {}),
    sensitive.length > 0 ? 'draft' : 'pending_approval'
  );
  db.prepare('INSERT INTO task_versions (task_id, version, title, content, jump_url, operator_note) VALUES (?, 1, ?, ?, ?, ?)').run(
    info.lastInsertRowid, title, content, jump_url || '', '创建任务'
  );
  if (sensitive.length > 0) {
    db.prepare('INSERT INTO approvals (task_id, status, sensitive_check, comment) VALUES (?, ?, ?, ?)').run(
      info.lastInsertRowid, 'rejected', 0, `包含敏感词: ${sensitive.join(',')}`
    );
  }
  res.json({ id: info.lastInsertRowid, status: sensitive.length > 0 ? 'draft' : 'pending_approval', sensitive });
});

app.put('/api/tasks/:id', (req, res) => {
  const { title, content, jump_url, style, channels, audience_config, schedule_time, freq_config, operator_note } = req.body;
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: '任务不存在' });
  const maxVer = db.prepare('SELECT MAX(version) as v FROM task_versions WHERE task_id = ?').get(req.params.id).v || 0;
  db.prepare('INSERT INTO task_versions (task_id, version, title, content, jump_url, operator_note) VALUES (?, ?, ?, ?, ?, ?)').run(
    req.params.id, maxVer + 1, title, content, jump_url || '', operator_note || '修改任务'
  );
  db.prepare(`UPDATE tasks SET title=?, content=?, jump_url=?, style=?, channels=?, audience_config=?, schedule_time=?, freq_config=?, status='draft', updated_at=datetime('now','localtime') WHERE id=?`).run(
    title, content, jump_url || '', style || 'info',
    JSON.stringify(channels || ['in_app']),
    JSON.stringify(audience_config || {}),
    schedule_time || null,
    JSON.stringify(freq_config || {}),
    req.params.id
  );
  res.json({ id: req.params.id });
});

app.delete('/api/tasks/:id', (req, res) => {
  db.prepare('DELETE FROM approvals WHERE task_id = ?').run(req.params.id);
  db.prepare('DELETE FROM send_records WHERE task_id = ?').run(req.params.id);
  db.prepare('DELETE FROM task_versions WHERE task_id = ?').run(req.params.id);
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.post('/api/audience/preview', (req, res) => {
  const config = req.body;
  const users = computeAudience(config);
  const sample = users.slice(0, 5).map(u => ({ ...u, tags: JSON.parse(u.tags || '[]') }));
  res.json({ estimatedCount: users.length, sample });
});

app.get('/api/approvals', (req, res) => {
  const { status } = req.query;
  const conditions = [];
  const params = [];
  if (status) { conditions.push('a.status = ?'); params.push(status); }
  let sql = 'SELECT a.*, t.title as task_title FROM approvals a JOIN tasks t ON a.task_id = t.id';
  if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
  const list = db.prepare(sql + ' ORDER BY a.id DESC').all(...params);
  res.json({ list });
});

app.get('/api/approvals/:id', (req, res) => {
  const a = db.prepare('SELECT * FROM approvals WHERE id = ?').get(req.params.id);
  if (!a) return res.status(404).json({ error: '审批不存在' });
  res.json(a);
});

app.post('/api/approvals/:taskId/submit', (req, res) => {
  const taskId = req.params.taskId;
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  if (!task) return res.status(404).json({ error: '任务不存在' });
  const existing = db.prepare('SELECT * FROM approvals WHERE task_id = ?').get(taskId);
  const sensitive = checkSensitive(task.title + task.content);
  const channels = JSON.parse(task.channels);
  const freqConflicts = checkFreqConflict(taskId, { channels });
  const duplicate = db.prepare("SELECT COUNT(*) as cnt FROM tasks WHERE title = ? AND id != ? AND status IN ('approved','sending','sent')").get(task.title, taskId).cnt;

  const checks = {
    sensitive_check: sensitive.length === 0 ? 1 : 0,
    duplicate_check: duplicate === 0 ? 1 : 0,
    url_check: task.jump_url && task.jump_url.startsWith('/') ? 1 : 0,
    freq_check: freqConflicts.length === 0 ? 1 : 0,
    gray_check: 1
  };
  const allPass = Object.values(checks).every(v => v === 1);

  if (existing) {
    db.prepare('UPDATE approvals SET sensitive_check=?, duplicate_check=?, url_check=?, freq_check=?, gray_check=?, status=?, comment=? WHERE task_id=?').run(
      checks.sensitive_check, checks.duplicate_check, checks.url_check, checks.freq_check, checks.gray_check,
      allPass ? 'pending' : 'rejected',
      allPass ? '待审批' : `检查未通过: 敏感词[${sensitive.join(',')}] 重复[${duplicate}] 频控[${freqConflicts.join(',')}]`,
      taskId
    );
  } else {
    db.prepare('INSERT INTO approvals (task_id, sensitive_check, duplicate_check, url_check, freq_check, gray_check, status, comment) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
      taskId, checks.sensitive_check, checks.duplicate_check, checks.url_check, checks.freq_check, checks.gray_check,
      allPass ? 'pending' : 'rejected',
      allPass ? '待审批' : `检查未通过: 敏感词[${sensitive.join(',')}] 重复[${duplicate}] 频控[${freqConflicts.join(',')}]`
    );
  }
  db.prepare("UPDATE tasks SET status=? WHERE id=?").run(allPass ? 'pending_approval' : 'draft', taskId);
  res.json({ checks, allPass, sensitive, duplicate, freqConflicts });
});

app.post('/api/approvals/:id/approve', (req, res) => {
  const { approver, comment } = req.body;
  db.prepare("UPDATE approvals SET approver=?, status='approved', comment=? WHERE id=?").run(approver || 'admin', comment || '审批通过', req.params.id);
  const a = db.prepare('SELECT * FROM approvals WHERE id = ?').get(req.params.id);
  if (a) db.prepare("UPDATE tasks SET status='approved', updated_at=datetime('now','localtime') WHERE id=?").run(a.task_id);
  res.json({ ok: true });
});

app.post('/api/approvals/:id/reject', (req, res) => {
  const { approver, comment } = req.body;
  db.prepare("UPDATE approvals SET approver=?, status='rejected', comment=? WHERE id=?").run(approver || 'admin', comment || '审批驳回', req.params.id);
  const a = db.prepare('SELECT * FROM approvals WHERE id = ?').get(req.params.id);
  if (a) db.prepare("UPDATE tasks SET status='draft', updated_at=datetime('now','localtime') WHERE id=?").run(a.task_id);
  res.json({ ok: true });
});

app.post('/api/tasks/:id/send', (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: '任务不存在' });
  if (task.status !== 'approved') return res.status(400).json({ error: '任务未审批通过，不能发送' });
  const config = JSON.parse(task.audience_config);
  const channels = JSON.parse(task.channels);
  const users = computeAudience(config);
  const insertRecord = db.prepare(`INSERT INTO send_records (task_id, user_id, channel, delivered, displayed, clicked, closed, failed, fail_reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertFreq = db.prepare('INSERT INTO freq_log (user_id, channel, task_id) VALUES (?, ?, ?)');
  let count = 0;
  for (const u of users) {
    for (const ch of channels) {
      const delivered = Math.random() > 0.05 ? 1 : 0;
      const displayed = delivered ? (Math.random() > 0.15 ? 1 : 0) : 0;
      const clicked = displayed ? (Math.random() > 0.4 ? 1 : 0) : 0;
      const closed = displayed && !clicked ? 1 : 0;
      const failed = delivered ? 0 : 1;
      const reason = failed ? '模拟失败：用户设备离线' : null;
      insertRecord.run(task.id, u.id, ch, delivered, displayed, clicked, closed, failed, reason);
      if (delivered) insertFreq.run(u.id, ch, task.id);
      count++;
    }
  }
  db.prepare("UPDATE tasks SET status='sent', updated_at=datetime('now','localtime') WHERE id=?").run(task.id);
  res.json({ sentCount: count, userCount: users.length });
});

app.get('/api/send-records', (req, res) => {
  const { taskId, page = 1, pageSize = 20 } = req.query;
  const conditions = [];
  const params = [];
  if (taskId) { conditions.push('sr.task_id = ?'); params.push(taskId); }
  let sql = 'SELECT sr.*, u.name as user_name, u.username, t.title as task_title FROM send_records sr JOIN users u ON sr.user_id = u.id JOIN tasks t ON sr.task_id = t.id';
  if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
  const total = db.prepare('SELECT COUNT(*) as cnt FROM (' + sql + ')').get(...params).cnt;
  const limit = parseInt(pageSize);
  const offset = (parseInt(page) - 1) * limit;
  const list = db.prepare(sql + ' ORDER BY sr.id DESC LIMIT ' + limit + ' OFFSET ' + offset).all(...params);
  res.json({ total, list, page: parseInt(page), pageSize: parseInt(pageSize) });
});

app.get('/api/send-records/stats', (req, res) => {
  const { taskId } = req.query;
  const conditions = [];
  const params = [];
  if (taskId) { conditions.push('task_id = ?'); params.push(taskId); }
  let sql = 'SELECT SUM(delivered) as delivered, SUM(displayed) as displayed, SUM(clicked) as clicked, SUM(closed) as closed, SUM(failed) as failed, SUM(unsubscribed) as unsubscribed, COUNT(*) as total FROM send_records';
  if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
  const stats = db.prepare(sql).get(...params);
  res.json({
    stats: {
      ...stats,
      ctr: stats.displayed ? (stats.clicked / stats.displayed * 100).toFixed(2) + '%' : '0%'
    }
  });
});

app.post('/api/send-records/:id/retry', (req, res) => {
  const record = db.prepare('SELECT * FROM send_records WHERE id = ?').get(req.params.id);
  if (!record) return res.status(404).json({ error: '记录不存在' });
  if (!record.failed) return res.status(400).json({ error: '该记录未失败，无需重试' });
  db.prepare('UPDATE send_records SET failed=0, delivered=1, fail_reason=NULL, retry_count=retry_count+1 WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

app.get('/api/task-versions/:taskId', (req, res) => {
  const list = db.prepare('SELECT * FROM task_versions WHERE task_id = ? ORDER BY version DESC').all(req.params.taskId);
  res.json({ list });
});

app.get('/api/reports/overview', (req, res) => {
  const { taskId, channel, groupBy } = req.query;
  const conditions = [];
  const params = [];
  if (taskId) { conditions.push('task_id = ?'); params.push(taskId); }
  if (channel) { conditions.push('channel = ?'); params.push(channel); }
  let sql = 'SELECT task_id, channel, SUM(delivered) as delivered, SUM(displayed) as displayed, SUM(clicked) as clicked, SUM(closed) as closed, SUM(failed) as failed, COUNT(*) as total FROM send_records';
  if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
  let groupField = 'task_id';
  if (groupBy === 'channel') groupField = 'channel';
  const list = db.prepare(sql + ' GROUP BY ' + groupField + ' ORDER BY total DESC').all(...params);

  const tasks = db.prepare('SELECT id, title FROM tasks').all();
  const taskMap = {};
  tasks.forEach(t => taskMap[t.id] = t.title);

  res.json({
    list: list.map(r => ({
      ...r,
      task_title: taskMap[r.task_id] || `任务#${r.task_id}`,
      ctr: r.displayed ? (r.clicked / r.displayed * 100).toFixed(2) + '%' : '0%',
      cvr: r.delivered ? (r.clicked / r.delivered * 100).toFixed(2) + '%' : '0%'
    }))
  });
});

app.get('/api/reports/page-analysis', (req, res) => {
  const list = db.prepare(`SELECT t.jump_url, t.title, COUNT(*) as visits, SUM(sr.clicked) as clicks FROM tasks t JOIN send_records sr ON t.id = sr.task_id WHERE t.jump_url != '' AND sr.clicked = 1 GROUP BY t.jump_url ORDER BY clicks DESC`).all();
  res.json({ list });
});

app.post('/api/tasks/:id/note', (req, res) => {
  const { note } = req.body;
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: '任务不存在' });
  const maxVer = db.prepare('SELECT MAX(version) as v FROM task_versions WHERE task_id = ?').get(req.params.id).v || 0;
  db.prepare('INSERT INTO task_versions (task_id, version, title, content, jump_url, operator_note) VALUES (?, ?, ?, ?, ?, ?)').run(
    req.params.id, maxVer + 1, task.title, task.content, task.jump_url, note
  );
  res.json({ ok: true });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Push Platform Backend running on http://127.0.0.1:${PORT}`);
  console.log(`Database: ${DB_PATH}`);
});