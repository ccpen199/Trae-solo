import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.post('/register', (req, res) => {
  try {
    const { phone, name, role } = req.body;
    if (!phone) {
      return res.status(400).json({ error: '手机号不能为空' });
    }

    const stmt = db.prepare('INSERT INTO user (phone, name, role) VALUES (?, ?, ?)');
    const result = stmt.run(phone, name || '', role || 'personal');

    res.json({ id: result.lastInsertRowid, phone, name, role: role || 'personal' });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: '该手机号已注册' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

router.post('/login', (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: '手机号不能为空' });
    }

    const user = db.prepare('SELECT * FROM user WHERE phone = ?').get(phone);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/profile', (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) {
      return res.status(400).json({ error: '手机号不能为空' });
    }

    const user = db.prepare('SELECT * FROM user WHERE phone = ?').get(phone);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/profile', (req, res) => {
  try {
    const { phone, name } = req.body;
    if (!phone) {
      return res.status(400).json({ error: '手机号不能为空' });
    }

    const stmt = db.prepare('UPDATE user SET name = ? WHERE phone = ?');
    stmt.run(name, phone);

    const user = db.prepare('SELECT * FROM user WHERE phone = ?').get(phone);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
