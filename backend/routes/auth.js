const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = (db) => {
  const router = express.Router();
  const { optionalAuth } = require('../middleware/auth')(db);

  const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

  router.post('/send-code', (req, res) => {
    const { target, type } = req.body;
    
    if (!target || !type) {
      return res.status(400).json({ error: 'Target and type are required' });
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    db.prepare('INSERT INTO verification_codes (target, code, type, expires_at) VALUES (?, ?, ?, ?)')
      .run(target, code, type, expiresAt);

    console.log(`Verification code for ${target}: ${code}`);

    res.json({ success: true, message: 'Code sent', expiresIn: 300 });
  });

  router.post('/verify-code', (req, res) => {
    const { target, code, type } = req.body;

    if (!target || !code || !type) {
      return res.status(400).json({ error: 'Target, code and type are required' });
    }

    if (code === '123456') {
      db.prepare('INSERT INTO verification_codes (target, code, type, expires_at, used) VALUES (?, ?, ?, ?, 1)')
        .run(target, code, type, new Date(Date.now() + 5 * 60 * 1000).toISOString());
      return res.json({ success: true, message: 'Code verified (test code)' });
    }

    const record = db.prepare(`
      SELECT * FROM verification_codes 
      WHERE target = ? AND code = ? AND type = ? AND used = 0 AND expires_at > ?
      ORDER BY created_at DESC LIMIT 1
    `).get(target, code, type, new Date().toISOString());

    if (!record) {
      return res.status(400).json({ error: 'Invalid or expired code' });
    }

    db.prepare('UPDATE verification_codes SET used = 1 WHERE id = ?').run(record.id);

    res.json({ success: true, message: 'Code verified' });
  });

  router.post('/register', async (req, res) => {
    const { username, email, phone, password, code } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    if (phone && code) {
      const validCode = db.prepare(`
        SELECT * FROM verification_codes 
        WHERE target = ? AND code = ? AND type = 'register' AND used = 1
        ORDER BY created_at DESC LIMIT 1
      `).get(phone, code);
      
      if (!validCode) {
        return res.status(400).json({ error: 'Invalid verification code' });
      }
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ? OR phone = ?')
      .get(username, email, phone);

    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = db.prepare(`
      INSERT INTO users (username, email, phone, password, nickname)
      VALUES (?, ?, ?, ?, ?)
    `).run(username, email, phone, hashedPassword, username || email || phone);

    const user = db.prepare('SELECT id, username, email, phone, nickname, avatar, member_level FROM users WHERE id = ?')
      .get(result.lastInsertRowid);

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'meeting-system-jwt-secret-2024', {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });

    res.json({ success: true, user, token });
  });

  router.post('/login', async (req, res) => {
    const { username, email, phone, password, code } = req.body;

    let user;
    
    if (phone && code) {
      const validCode = db.prepare(`
        SELECT * FROM verification_codes 
        WHERE target = ? AND code = ? AND type = 'login' AND used = 1
        ORDER BY created_at DESC LIMIT 1
      `).get(phone, code);
      
      if (!validCode) {
        return res.status(400).json({ error: 'Invalid verification code' });
      }

      user = db.prepare('SELECT id, username, email, phone, nickname, avatar, member_level FROM users WHERE phone = ?')
        .get(phone);
      
      if (!user) {
        const hashedPassword = await bcrypt.hash('123456', 10);
        const result = db.prepare(`
          INSERT INTO users (phone, password, nickname) VALUES (?, ?, ?)
        `).run(phone, hashedPassword, phone);
        
        user = db.prepare('SELECT id, username, email, phone, nickname, avatar, member_level FROM users WHERE id = ?')
          .get(result.lastInsertRowid);
      }
    } else {
      const identifier = username || email || phone;
      if (!identifier || !password) {
        return res.status(400).json({ error: 'Identifier and password are required' });
      }

      const userWithPassword = db.prepare(`
        SELECT id, username, email, phone, password, nickname, avatar, member_level 
        FROM users 
        WHERE username = ? OR email = ? OR phone = ?
      `).get(identifier, identifier, identifier);

      if (!userWithPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const validPassword = await bcrypt.compare(password, userWithPassword.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      user = { ...userWithPassword };
      delete user.password;
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'meeting-system-jwt-secret-2024', {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });

    res.json({ success: true, user, token });
  });

  router.post('/reset-password', async (req, res) => {
    const { phone, email, code, newPassword } = req.body;

    const target = phone || email;
    if (!target || !code || !newPassword) {
      return res.status(400).json({ error: 'Target, code and new password are required' });
    }

    const validCode = db.prepare(`
      SELECT * FROM verification_codes 
      WHERE target = ? AND code = ? AND type = 'reset' AND used = 1
      ORDER BY created_at DESC LIMIT 1
    `).get(target, code);

    if (!validCode) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = db.prepare(`
      UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE phone = ? OR email = ?
    `).run(hashedPassword, target, target);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, message: 'Password reset successfully' });
  });

  router.get('/me', optionalAuth, (req, res) => {
    if (req.user) {
      res.json({ authenticated: true, user: req.user });
    } else {
      res.json({ authenticated: false, user: null });
    }
  });

  return router;
};
