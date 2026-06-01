const express = require('express');
const router = express.Router();
const db = require('../database/db');
const bcrypt = require('bcryptjs');

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  
  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  
  if (bcrypt.compareSync(password, user.password)) {
    const { password: _, ...userWithoutPassword } = user;
    res.json({ success: true, user: userWithoutPassword });
  } else {
    res.status(401).json({ error: '用户名或密码错误' });
  }
});

router.get('/', (req, res) => {
  const users = db.prepare('SELECT id, username, name, role, created_at FROM users').all();
  res.json(users);
});

router.get('/:id', (req, res) => {
  const user = db.prepare('SELECT id, username, name, role, created_at FROM users WHERE id = ?').get(req.params.id);
  res.json(user);
});

router.post('/', (req, res) => {
  const { username, password, name, role } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  const stmt = db.prepare('INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)');
  const result = stmt.run(username, hashedPassword, name, role);
  res.json({ id: result.lastInsertRowid, username, name, role });
});

router.put('/:id', (req, res) => {
  const { name, role, password } = req.body;
  const fields = [];
  const values = [];
  
  if (name) { fields.push('name = ?'); values.push(name); }
  if (role) { fields.push('role = ?'); values.push(role); }
  if (password) { 
    fields.push('password = ?'); 
    values.push(bcrypt.hashSync(password, 10)); 
  }
  
  values.push(req.params.id);
  
  const stmt = db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`);
  const result = stmt.run(...values);
  res.json({ success: true, changes: result.changes });
});

module.exports = router;
