const { db } = require('../models/database');

const getRates = (req, res) => {
  const rates = db.prepare(`
    SELECT r.*, u.name as user_name
    FROM rates r
    LEFT JOIN users u ON r.user_id = u.id
    ORDER BY r.created_at DESC
  `).all();
  res.json({ success: true, data: rates });
};

const createRate = (req, res) => {
  const { user_id, rate_amount, effective_date } = req.body;
  try {
    db.prepare('UPDATE rates SET is_active = 0 WHERE user_id = ?').run(user_id);
    const result = db.prepare(
      'INSERT INTO rates (user_id, rate_amount, effective_date) VALUES (?, ?, ?)'
    ).run(user_id, rate_amount, effective_date);
    res.json({ success: true, data: { id: result.lastInsertRowid, ...req.body } });
  } catch (err) {
    res.status(400).json({ success: false, message: '创建费率失败' });
  }
};

const getActiveRate = (req, res) => {
  const rate = db.prepare(`
    SELECT r.* FROM rates r
    WHERE r.user_id = ? AND r.is_active = 1
    ORDER BY r.effective_date DESC LIMIT 1
  `).get(req.params.user_id);
  res.json({ success: true, data: rate || null });
};

module.exports = { getRates, createRate, getActiveRate };
