const express = require('express');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const { date } = req.query;
  let query = 'SELECT * FROM time_slots';
  let params = [];
  
  if (date) {
    query += ' WHERE date = ?';
    params.push(date);
  }
  
  query += ' ORDER BY date, time';
  const slots = db.prepare(query).all(...params);
  res.json(slots);
});

router.get('/available', (req, res) => {
  const { date, package_id } = req.query;
  
  if (!date) {
    return res.status(400).json({ error: '请提供日期' });
  }
  
  const slots = db.prepare(`
    SELECT ts.*, 
           (ts.capacity - ts.booked) as available
    FROM time_slots ts
    WHERE ts.date = ? AND (ts.capacity - ts.booked) > 0
    ORDER BY ts.time
  `).all(date);
  
  res.json(slots);
});

router.post('/', authenticateToken, (req, res) => {
  const { date, time, capacity } = req.body;
  
  try {
    const result = db.prepare('INSERT INTO time_slots (date, time, capacity) VALUES (?, ?, ?)').run(date, time, capacity || 10);
    res.json({ id: result.lastInsertRowid, message: '时间槽创建成功' });
  } catch (err) {
    res.status(400).json({ error: '该时间槽已存在' });
  }
});

module.exports = router;
