import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  try {
    const { member_level } = req.query;
    let sql = 'SELECT * FROM audiences WHERE 1=1';
    const params = [];
    if (member_level) { sql += ' AND member_level = ?'; params.push(member_level); }
    sql += ' ORDER BY id';
    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const audience = db.prepare('SELECT * FROM audiences WHERE id = ?').get(req.params.id);
    if (!audience) return res.status(404).json({ error: 'Audience not found' });

    const cards = db.prepare('SELECT * FROM wallet_cards WHERE audience_id = ?').all(req.params.id);
    const orderCount = db.prepare("SELECT COUNT(*) as count FROM orders WHERE audience_id = ? AND status = 'paid'").get(req.params.id);

    res.json({
      ...audience,
      preference_tags: JSON.parse(audience.preference_tags),
      wallet_cards: cards,
      total_orders: orderCount.count
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, phone, email, preference_tags, member_level } = req.body;
    if (!name || !phone) return res.status(400).json({ error: 'Name and phone are required' });
    const result = db.prepare(
      'INSERT INTO audiences (name, phone, email, preference_tags, member_level) VALUES (?, ?, ?, ?, ?)'
    ).run(name, phone, email || null, JSON.stringify(preference_tags || []), member_level || 'regular');
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Phone number already exists' });
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM audiences WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Audience not found' });
    const { name, phone, email, preference_tags, member_level, points_balance } = req.body;
    db.prepare(
      "UPDATE audiences SET name=?, phone=?, email=?, preference_tags=?, member_level=?, points_balance=?, updated_at=datetime('now','localtime') WHERE id=?"
    ).run(
      name ?? existing.name,
      phone ?? existing.phone,
      email ?? existing.email,
      JSON.stringify(preference_tags ?? JSON.parse(existing.preference_tags)),
      member_level ?? existing.member_level,
      points_balance ?? existing.points_balance,
      req.params.id
    );
    res.json({ updated: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM audiences WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Audience not found' });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
