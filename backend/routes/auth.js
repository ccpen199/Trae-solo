const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'cross_border_b2b_favorite_jwt_secret_key_2026';

router.post('/login', (req, res) => {
  const { login, password } = req.body;

  if (!login || !password) {
    return res.status(400).json({ error: 'Login and password are required' });
  }

  const query = `
    SELECT * FROM users 
    WHERE email = ? OR member_id = ?
  `;

  db.get(query, [login, login], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, member_id: user.member_id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        member_id: user.member_id,
        name: user.name
      }
    });
  });
});

router.post('/register', (req, res) => {
  const { email, password, name, member_id } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const newMemberId = member_id || `M${Date.now().toString().slice(-8)}`;

  db.run(
    `INSERT INTO users (email, password, name, member_id) VALUES (?, ?, ?, ?)`,
    [email, hashedPassword, name || email.split('@')[0], newMemberId],
    function (err) {
      if (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
          return res.status(400).json({ error: 'Email or member ID already exists' });
        }
        return res.status(500).json({ error: 'Database error' });
      }

      const token = jwt.sign(
        { id: this.lastID, email, member_id: newMemberId },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        message: 'Registration successful',
        token,
        user: {
          id: this.lastID,
          email,
          member_id: newMemberId,
          name: name || email.split('@')[0]
        }
      });
    }
  );
});

router.post('/reset-password', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(404).json({ error: 'Email not found' });
    }

    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = bcrypt.hashSync(tempPassword, 10);

    db.run(
      `UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [hashedPassword, user.id],
      (err) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({
          message: 'Password reset successful',
          tempPassword
        });
      }
    );
  });
});

router.get('/me', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }

    db.get(`SELECT id, email, member_id, name FROM users WHERE id = ?`, [decoded.id], (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ user });
    });
  });
});

module.exports = router;
