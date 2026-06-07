const express = require('express');
const router = express.Router();
const { getDB } = require('../db');

router.get('/profiles', (req, res) => {
  const db = getDB();
  const { keyword, type, credit_level, page = 1, pageSize = 10 } = req.query;
  let where = '1=1';
  const params = [];
  if (keyword) { where += ' AND (name LIKE ? OR id_card LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`); }
  if (type) { where += ' AND type = ?'; params.push(type); }
  if (credit_level) { where += ' AND credit_level = ?'; params.push(credit_level); }
  const total = db.prepare(`SELECT COUNT(*) as cnt FROM credit_profiles WHERE ${where}`).get(...params).cnt;
  const rows = db.prepare(`SELECT * FROM credit_profiles WHERE ${where} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...params, Number(pageSize), (Number(page) - 1) * Number(pageSize));
  res.json({ data: rows, total, page: Number(page), pageSize: Number(pageSize) });
});

router.get('/profiles/:id', (req, res) => {
  const db = getDB();
  const profile = db.prepare('SELECT * FROM credit_profiles WHERE id = ?').get(req.params.id);
  if (!profile) return res.status(404).json({ error: '未找到该信用档案' });
  const flows = db.prepare('SELECT * FROM credit_flows WHERE profile_id = ? ORDER BY flow_date DESC').all(req.params.id);
  res.json({ data: { ...profile, flows } });
});

router.post('/profiles', (req, res) => {
  const db = getDB();
  const { name, id_card, type, village, town, county, land_area, land_cert_no, subsidy_total, business_income, credit_score, credit_level } = req.body;
  try {
    const r = db.prepare(`INSERT INTO credit_profiles (name, id_card, type, village, town, county, land_area, land_cert_no, subsidy_total, business_income, credit_score, credit_level) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(name, id_card, type, village, town, county, land_area || 0, land_cert_no || '', subsidy_total || 0, business_income || 0, credit_score || 0, credit_level || 'C');
    db.prepare('INSERT INTO system_logs (module, action, operator, detail) VALUES (?,?,?,?)').run('credit', 'create_profile', 'system', `创建${name}信用画像`);
    res.json({ data: { id: r.lastInsertRowid } });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(400).json({ error: '身份证号已存在' });
    res.status(500).json({ error: e.message });
  }
});

router.put('/profiles/:id', (req, res) => {
  const db = getDB();
  const fields = Object.keys(req.body).filter(k => ['name','type','village','town','county','land_area','land_cert_no','subsidy_total','business_income','credit_score','credit_level','status'].includes(k));
  if (fields.length === 0) return res.status(400).json({ error: '无有效更新字段' });
  const sets = fields.map(f => `${f} = ?`).join(', ');
  const vals = fields.map(f => req.body[f]);
  vals.push(req.params.id);
  db.prepare(`UPDATE credit_profiles SET ${sets}, updated_at = datetime('now','localtime') WHERE id = ?`).run(...vals);
  db.prepare('INSERT INTO system_logs (module, action, operator, detail) VALUES (?,?,?,?)').run('credit', 'update_profile', 'system', `更新信用档案ID=${req.params.id}`);
  res.json({ data: { id: req.params.id } });
});

router.post('/profiles/:id/flows', (req, res) => {
  const db = getDB();
  const { flow_type, amount, description, flow_date } = req.body;
  db.prepare('INSERT INTO credit_flows (profile_id, flow_type, amount, description, flow_date) VALUES (?,?,?,?,?)').run(req.params.id, flow_type, amount, description, flow_date);
  res.json({ data: { profile_id: req.params.id } });
});

router.get('/credit-level-stats', (req, res) => {
  const db = getDB();
  const rows = db.prepare('SELECT credit_level, COUNT(*) as count FROM credit_profiles GROUP BY credit_level ORDER BY credit_level').all();
  res.json({ data: rows });
});

module.exports = router;
