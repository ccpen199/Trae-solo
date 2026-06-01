require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.BACKEND_PORT || 53412;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 43412}`,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const dbPath = path.join(__dirname, 'data', 'app.sqlite');
const db = new Database(dbPath);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/creators/:id', (req, res) => {
  const creator = db.prepare('SELECT * FROM creators WHERE id = ?').get(req.params.id);
  if (!creator) {
    return res.status(404).json({ error: 'Creator not found' });
  }
  res.json(creator);
});

app.get('/api/creators/:id/works', (req, res) => {
  const { status } = req.query;
  let query = 'SELECT * FROM works WHERE creator_id = ?';
  const params = [req.params.id];
  
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY created_at DESC';
  const works = db.prepare(query).all(...params);
  res.json(works);
});

app.get('/api/works/:id', (req, res) => {
  const work = db.prepare('SELECT * FROM works WHERE id = ?').get(req.params.id);
  if (!work) {
    return res.status(404).json({ error: 'Work not found' });
  }
  res.json(work);
});

app.post('/api/works', (req, res) => {
  const { creator_id, title, content, cover_url, video_url, type, topics, copyright_declaration, scheduled_at } = req.body;
  
  const status = scheduled_at ? 'scheduled' : 'auditing';
  
  const result = db.prepare(`
    INSERT INTO works (creator_id, title, content, cover_url, video_url, type, status, topics, copyright_declaration, scheduled_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(creator_id, title, content, cover_url, video_url, type, status, topics, copyright_declaration, scheduled_at);

  if (status === 'auditing') {
    db.prepare('INSERT INTO audits (work_id, status) VALUES (?, ?)').run(result.lastInsertRowid, 'pending');
  }

  db.prepare(`
    INSERT INTO activities (creator_id, type, action, related_id, description)
    VALUES (?, ?, ?, ?, ?)
  `).run(creator_id, 'publish', status === 'scheduled' ? '定时发布' : '提交审核', result.lastInsertRowid, `提交了作品《${title}》`);

  const work = db.prepare('SELECT * FROM works WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(work);
});

app.put('/api/works/:id', (req, res) => {
  const { title, content, cover_url, video_url, type, topics, copyright_declaration, scheduled_at, status } = req.body;
  const workId = req.params.id;
  
  const oldWork = db.prepare('SELECT * FROM works WHERE id = ?').get(workId);
  
  db.prepare(`
    UPDATE works 
    SET title = ?, content = ?, cover_url = ?, video_url = ?, type = ?, topics = ?, copyright_declaration = ?, scheduled_at = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(title, content, cover_url, video_url, type, topics, copyright_declaration, scheduled_at, status || oldWork.status, workId);

  if (status === 'auditing' && oldWork.status !== 'auditing') {
    db.prepare('INSERT INTO audits (work_id, status) VALUES (?, ?)').run(workId, 'pending');
    db.prepare(`
      INSERT INTO activities (creator_id, type, action, related_id, description)
      VALUES (?, ?, ?, ?, ?)
    `).run(oldWork.creator_id, 'publish', '提交审核', workId, `重新提交作品《${title}》审核`);
  }

  const work = db.prepare('SELECT * FROM works WHERE id = ?').get(workId);
  res.json(work);
});

app.delete('/api/works/:id', (req, res) => {
  const work = db.prepare('SELECT * FROM works WHERE id = ?').get(req.params.id);
  if (!work) {
    return res.status(404).json({ error: 'Work not found' });
  }
  
  try {
    db.prepare('DELETE FROM audits WHERE work_id = ?').run(req.params.id);
    db.prepare('DELETE FROM daily_data WHERE work_id = ?').run(req.params.id);
    db.prepare('DELETE FROM incomes WHERE work_id = ?').run(req.params.id);
    db.prepare('DELETE FROM violations WHERE work_id = ?').run(req.params.id);
    db.prepare('DELETE FROM works WHERE id = ?').run(req.params.id);
    
    db.prepare(`
      INSERT INTO activities (creator_id, type, action, related_id, description)
      VALUES (?, ?, ?, ?, ?)
    `).run(work.creator_id, 'delete', '删除作品', req.params.id, `删除了作品《${work.title}》`);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete work error:', error);
    res.status(500).json({ error: '删除失败：' + error.message });
  }
});

app.get('/api/creators/:id/violations', (req, res) => {
  const violations = db.prepare('SELECT * FROM violations WHERE creator_id = ? ORDER BY created_at DESC').all(req.params.id);
  res.json(violations);
});

app.get('/api/creators/:id/incomes', (req, res) => {
  const { type } = req.query;
  let query = 'SELECT * FROM incomes WHERE creator_id = ?';
  const params = [req.params.id];
  
  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  
  query += ' ORDER BY created_at DESC';
  const incomes = db.prepare(query).all(...params);
  res.json(incomes);
});

app.get('/api/creators/:id/incomes/summary', (req, res) => {
  const creatorId = req.params.id;
  const result = db.prepare(`
    SELECT 
      type,
      SUM(amount) as total
    FROM incomes 
    WHERE creator_id = ?
    GROUP BY type
  `).all(creatorId);
  
  const summary = {};
  result.forEach(r => {
    summary[r.type] = r.total;
  });
  
  const total = db.prepare('SELECT SUM(amount) as total FROM incomes WHERE creator_id = ?').get(creatorId);
  summary.total = total.total || 0;
  
  const pending = db.prepare('SELECT SUM(amount) as total FROM incomes WHERE creator_id = ? AND status = ?').get(creatorId, 'pending');
  summary.pending = pending.total || 0;
  
  res.json(summary);
});

app.get('/api/creators/:id/withdrawals', (req, res) => {
  const withdrawals = db.prepare('SELECT * FROM withdrawals WHERE creator_id = ? ORDER BY created_at DESC').all(req.params.id);
  res.json(withdrawals);
});

app.post('/api/creators/:id/withdrawals', (req, res) => {
  const { amount, bank_info } = req.body;
  const result = db.prepare(`
    INSERT INTO withdrawals (creator_id, amount, bank_info, status)
    VALUES (?, ?, ?, ?)
  `).run(req.params.id, amount, bank_info, 'pending');

  db.prepare(`
    INSERT INTO activities (creator_id, type, action, related_id, description)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.params.id, 'withdraw', '申请提现', result.lastInsertRowid, `申请提现 ¥${amount}`);

  const withdrawal = db.prepare('SELECT * FROM withdrawals WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(withdrawal);
});

app.get('/api/creators/:id/fan-profiles', (req, res) => {
  const profiles = db.prepare('SELECT * FROM fan_profiles WHERE creator_id = ?').all(req.params.id);
  res.json(profiles);
});

app.get('/api/creators/:id/activities', (req, res) => {
  const { limit = 20, offset = 0 } = req.query;
  const activities = db.prepare(`
    SELECT * FROM activities 
    WHERE creator_id = ? 
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `).all(req.params.id, parseInt(limit), parseInt(offset));
  res.json(activities);
});

app.get('/api/works/:id/daily-data', (req, res) => {
  const { start_date, end_date } = req.query;
  let query = 'SELECT * FROM daily_data WHERE work_id = ?';
  const params = [req.params.id];
  
  if (start_date) {
    query += ' AND date >= ?';
    params.push(start_date);
  }
  if (end_date) {
    query += ' AND date <= ?';
    params.push(end_date);
  }
  
  query += ' ORDER BY date ASC';
  const data = db.prepare(query).all(...params);
  res.json(data);
});

app.get('/api/works/:id/audit', (req, res) => {
  const audit = db.prepare('SELECT * FROM audits WHERE work_id = ? ORDER BY created_at DESC LIMIT 1').get(req.params.id);
  res.json(audit || null);
});

app.get('/api/campaigns', (req, res) => {
  const campaigns = db.prepare('SELECT * FROM campaigns WHERE status = ? ORDER BY created_at DESC').all('active');
  res.json(campaigns);
});

app.post('/api/campaigns/:id/signup', (req, res) => {
  const { creator_id } = req.body;
  const result = db.prepare(`
    INSERT OR IGNORE INTO campaign_signups (campaign_id, creator_id, status)
    VALUES (?, ?, ?)
  `).run(req.params.id, creator_id, 'pending');

  const campaign = db.prepare('SELECT name FROM campaigns WHERE id = ?').get(req.params.id);
  db.prepare(`
    INSERT INTO activities (creator_id, type, action, related_id, description)
    VALUES (?, ?, ?, ?, ?)
  `).run(creator_id, 'campaign', '报名活动', req.params.id, `报名参加《${campaign.name}》`);

  res.status(201).json({ success: true });
});

app.post('/api/appeals', (req, res) => {
  const { creator_id, violation_id, content } = req.body;
  const result = db.prepare(`
    INSERT INTO appeals (creator_id, violation_id, content, status)
    VALUES (?, ?, ?, ?)
  `).run(creator_id, violation_id, content, 'pending');

  db.prepare(`
    INSERT INTO activities (creator_id, type, action, related_id, description)
    VALUES (?, ?, ?, ?, ?)
  `).run(creator_id, 'appeal', '提交申诉', violation_id, '提交违规申诉');

  const appeal = db.prepare('SELECT * FROM appeals WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(appeal);
});

app.get('/api/dashboard/:id', (req, res) => {
  const creatorId = req.params.id;
  
  const creator = db.prepare('SELECT * FROM creators WHERE id = ?').get(creatorId);
  const drafts = db.prepare('SELECT COUNT(*) as count FROM works WHERE creator_id = ? AND status = ?').get(creatorId, 'draft');
  const published = db.prepare('SELECT COUNT(*) as count FROM works WHERE creator_id = ? AND status = ?').get(creatorId, 'published');
  const auditing = db.prepare('SELECT COUNT(*) as count FROM works WHERE creator_id = ? AND status = ?').get(creatorId, 'auditing');
  const violations = db.prepare('SELECT COUNT(*) as count FROM violations WHERE creator_id = ? AND status = ?').get(creatorId, 'active');
  
  res.json({
    creator,
    counts: {
      drafts: drafts.count,
      published: published.count,
      auditing: auditing.count,
      active_violations: violations.count
    }
  });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`);
});
