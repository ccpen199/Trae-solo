const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

const router = express.Router();

router.post('/register', (req, res) => {
  const { email, phone, password, username } = req.body;
  
  if (!username || (!email && !phone)) {
    return res.status(400).json({ error: 'Username and email/phone required' });
  }

  try {
    const hashedPassword = password ? bcrypt.hashSync(password, 10) : null;
    
    const stmt = db.prepare(`
      INSERT INTO users (email, phone, password, username, avatar)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(email || null, phone || null, hashedPassword, username, null);
    
    const defaultListStmt = db.prepare(`
      INSERT INTO lists (user_id, name, color, is_default)
      VALUES (?, '收集箱', '#2196F3', 1)
    `);
    defaultListStmt.run(result.lastInsertRowid);
    
    const token = jwt.sign(
      { id: result.lastInsertRowid, username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: result.lastInsertRowid,
        email,
        phone,
        username,
        avatar: null
      }
    });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Email or phone already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', (req, res) => {
  const { email, phone, password } = req.body;
  
  if ((!email && !phone) || !password) {
    return res.status(400).json({ error: 'Email/phone and password required' });
  }

  try {
    let user;
    if (email) {
      user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    } else {
      user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    }
    
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        username: user.username,
        avatar: user.avatar
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/social-login', (req, res) => {
  const { provider, providerId, username, avatar } = req.body;
  
  if (!provider || !providerId) {
    return res.status(400).json({ error: 'Provider and providerId required' });
  }

  try {
    let user = db.prepare('SELECT * FROM users WHERE provider = ? AND provider_id = ?').get(provider, providerId);
    
    if (!user) {
      const stmt = db.prepare(`
        INSERT INTO users (username, avatar, provider, provider_id)
        VALUES (?, ?, ?, ?)
      `);
      const result = stmt.run(username || 'User', avatar, provider, providerId);
      
      const defaultListStmt = db.prepare(`
        INSERT INTO lists (user_id, name, color, is_default)
        VALUES (?, '收集箱', '#2196F3', 1)
      `);
      defaultListStmt.run(result.lastInsertRowid);
      
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    }
    
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        username: user.username,
        avatar: user.avatar
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
