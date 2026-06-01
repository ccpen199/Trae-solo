import express from 'express';
import db from '../models/database.js';

const router = express.Router();

router.get('/', (req, res) => {
  const users = db.prepare('SELECT id, username, name, role, created_at FROM users ORDER BY created_at DESC').all();
  res.json(users);
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
  
  if (user) {
    const { password: _, ...userWithoutPassword } = user;
    res.json({ ...userWithoutPassword, message: 'Login successful' });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

router.post('/', (req, res) => {
  const { username, name, role, password } = req.body;
  const result = db.prepare(`
    INSERT INTO users (username, name, role, password)
    VALUES (?, ?, ?, ?)
  `).run(username, name, role, password || '123456');
  res.json({ id: result.lastInsertRowid, message: 'User created successfully' });
});

export default router;
