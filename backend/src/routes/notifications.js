import express from 'express';
import { db } from '../database.js';

const router = express.Router();

router.get('/', (req, res) => {
  const { is_read } = req.query;
  let query = 'SELECT * FROM notifications';
  const params = [];
  
  if (is_read !== undefined) {
    query += ' WHERE is_read = ?';
    params.push(is_read === 'true' ? 1 : 0);
  }
  query += ' ORDER BY created_at DESC';
  
  const notifications = db.prepare(query).all(...params);
  res.json(notifications);
});

router.put('/:id/read', (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(req.params.id);
  const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(req.params.id);
  res.json(notification);
});

router.put('/read-all', (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE is_read = 0').run();
  res.json({ success: true });
});

export default router;
