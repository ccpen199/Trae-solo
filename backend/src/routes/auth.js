const express = require('express');
const router = express.Router();
const db = require('../database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'volunteer-platform-secret-key-2024';

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(401).json({ success: false, message: '用户名或密码错误' });
  }
  
  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) {
    return res.status(401).json({ success: false, message: '用户名或密码错误' });
  }
  
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
  
  let volunteer = null;
  if (user.volunteer_id) {
    volunteer = db.prepare('SELECT * FROM volunteers WHERE id = ?').get(user.volunteer_id);
  }
  
  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      },
      volunteer
    }
  });
});

router.post('/register', (req, res) => {
  const { username, password, name, phone, id_card } = req.body;
  
  try {
    const hash = bcrypt.hashSync(password, 10);
    
    const volunteerResult = db.prepare(`
      INSERT INTO volunteers (name, phone, id_card, last_active_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `).run(name, phone, id_card);
    
    const userResult = db.prepare(`
      INSERT INTO users (username, password, role, volunteer_id)
      VALUES (?, ?, 'volunteer', ?)
    `).run(username, hash, volunteerResult.lastInsertRowid);
    
    db.prepare('INSERT INTO yicoins (volunteer_id) VALUES (?)').run(volunteerResult.lastInsertRowid);
    
    res.json({
      success: true,
      data: { user_id: userResult.lastInsertRowid, volunteer_id: volunteerResult.lastInsertRowid }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
