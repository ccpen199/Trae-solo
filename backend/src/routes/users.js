import express from 'express';
import { db } from '../database.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.get('/', (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  
  const users = db.prepare(`
    SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).all(Number(limit), Number(offset));
  
  users.forEach(u => {
    u.preference_tags = u.preference_tags ? u.preference_tags.split(',') : [];
  });
  
  const total = db.prepare('SELECT COUNT(*) as count FROM users').get();
  
  res.json({ data: users, total: total.count, page: Number(page), limit: Number(limit) });
});

router.get('/:id', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  user.preference_tags = user.preference_tags ? user.preference_tags.split(',') : [];
  
  const orderStats = db.prepare(`
    SELECT COUNT(*) as order_count,
           SUM(total_amount) as total_spent,
           SUM(CASE WHEN status = 'refunded' THEN 1 ELSE 0 END) as refund_count
    FROM orders WHERE user_id = ?
  `).get(req.params.id);
  
  const categoryStats = db.prepare(`
    SELECT e.category, e.type, COUNT(*) as count
    FROM orders o
    JOIN sessions s ON s.id = o.session_id
    JOIN events e ON e.id = s.event_id
    WHERE o.user_id = ? AND o.status = 'paid'
    GROUP BY e.category, e.type
  `).all(req.params.id);
  
  const riskRecords = db.prepare(`
    SELECT * FROM user_risk_records WHERE user_id = ? ORDER BY created_at DESC LIMIT 10
  `).all(req.params.id);
  
  user.order_stats = orderStats;
  user.category_stats = categoryStats;
  user.risk_records = riskRecords;
  
  res.json(user);
});

router.post('/', (req, res) => {
  const { phone, email, nickname } = req.body;
  
  if (!phone) return res.status(400).json({ error: 'Phone is required' });
  
  const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
  if (existing) {
    return res.json(existing);
  }
  
  const id = uuidv4();
  db.prepare(`
    INSERT INTO users (id, phone, email, nickname)
    VALUES (?, ?, ?, ?)
  `).run(id, phone, email || '', nickname || '');
  
  res.status(201).json({ id, phone, email, nickname });
});

router.patch('/:id/preferences', (req, res) => {
  const { tags } = req.body;
  const tagStr = Array.isArray(tags) ? tags.join(',') : tags;
  
  db.prepare('UPDATE users SET preference_tags = ? WHERE id = ?').run(tagStr, req.params.id);
  
  res.json({ success: true, tags: tagStr ? tagStr.split(',') : [] });
});

export default router;
