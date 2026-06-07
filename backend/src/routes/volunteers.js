const express = require('express');
const router = express.Router();
const db = require('../database');
const { generateBlockchainHash } = require('../utils');

router.get('/', (req, res) => {
  const { page = 1, limit = 20, skill } = req.query;
  const offset = (page - 1) * limit;
  
  let query = 'SELECT * FROM volunteers';
  let params = [];
  
  if (skill) {
    query += ' WHERE skills LIKE ?';
    params.push(`%${skill}%`);
  }
  
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);
  
  const volunteers = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM volunteers').get().count;
  
  res.json({
    success: true,
    data: volunteers.map(v => ({
      ...v,
      skills: v.skills ? v.skills.split(',') : [],
      organization_history: v.organization_history ? JSON.parse(v.organization_history) : []
    })),
    total,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

router.get('/:id', (req, res) => {
  const volunteer = db.prepare('SELECT * FROM volunteers WHERE id = ?').get(req.params.id);
  if (!volunteer) {
    return res.status(404).json({ success: false, message: '志愿者不存在' });
  }
  
  volunteer.skills = volunteer.skills ? volunteer.skills.split(',') : [];
  volunteer.organization_history = volunteer.organization_history ? 
    JSON.parse(volunteer.organization_history) : [];
  
  const yicoin = db.prepare('SELECT * FROM yicoins WHERE volunteer_id = ?').get(req.params.id);
  
  res.json({
    success: true,
    data: { ...volunteer, yicoin }
  });
});

router.post('/', (req, res) => {
  const { name, phone, id_card, skills = [] } = req.body;
  
  try {
    const result = db.prepare(`
      INSERT INTO volunteers (name, phone, id_card, skills, last_active_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(name, phone, id_card, skills.join(','));
    
    db.prepare(`
      INSERT INTO yicoins (volunteer_id) VALUES (?)
    `).run(result.lastInsertRowid);
    
    res.json({
      success: true,
      data: { id: result.lastInsertRowid, name, phone }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { name, phone, skills = [] } = req.body;
  
  try {
    db.prepare(`
      UPDATE volunteers SET name = ?, phone = ?, skills = ?, last_active_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, phone, skills.join(','), req.params.id);
    
    res.json({ success: true, message: '更新成功' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.get('/:id/activities', (req, res) => {
  const activities = db.prepare(`
    SELECT a.*, asu.status, asu.checkin_time, asu.checkout_time, asu.actual_hours
    FROM activity_signups asu
    JOIN activities a ON asu.activity_id = a.id
    WHERE asu.volunteer_id = ?
    ORDER BY asu.created_at DESC
  `).all(req.params.id);
  
  res.json({ success: true, data: activities });
});

router.get('/:id/transactions', (req, res) => {
  const transactions = db.prepare(`
    SELECT * FROM yicoin_transactions
    WHERE volunteer_id = ?
    ORDER BY created_at DESC
    LIMIT 50
  `).all(req.params.id);
  
  res.json({ success: true, data: transactions });
});

module.exports = router;
