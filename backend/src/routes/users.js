const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const db = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const validateRegister = [
  body('nickname')
    .isLength({ min: 2, max: 20 })
    .withMessage('Nickname must be 2-20 characters'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('birth_year')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() })
    .withMessage('Invalid birth year'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Invalid phone number')
];

router.post('/register', validateRegister, (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { email, phone, password, nickname, avatar, gender, birth_year } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Either email or phone is required' 
      });
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE email = ? OR phone = ?')
      .get(email || null, phone || null);

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email or phone already registered' 
      });
    }

    const userId = uuidv4();
    const hashedPassword = bcrypt.hashSync(password, 10);

    db.prepare(`
      INSERT INTO users (id, email, phone, password, nickname, avatar, gender, birth_year)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, email || null, phone || null, hashedPassword, nickname, avatar, gender, birth_year);

    const token = jwt.sign(
      { userId, nickname, email, phone },
      process.env.JWT_SECRET || 'knowmorechinese_jwt_secret_key_2024',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Registration successful',
      data: {
        token,
        user: {
          id: userId,
          nickname,
          email,
          phone,
          avatar,
          gender,
          birth_year
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

router.post('/login', (req, res) => {
  try {
    const { email, phone, password } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Either email or phone is required' 
      });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ? OR phone = ?')
      .get(email || null, phone || null);

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    const token = jwt.sign(
      { userId: user.id, nickname: user.nickname, email: user.email, phone: user.phone },
      process.env.JWT_SECRET || 'knowmorechinese_jwt_secret_key_2024',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          nickname: user.nickname,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
          gender: user.gender,
          birth_year: user.birth_year,
          level: user.level
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

router.get('/profile', authenticateToken, (req, res) => {
  const user = db.prepare(`
    SELECT id, nickname, email, phone, avatar, gender, birth_year, level, created_at
    FROM users WHERE id = ?
  `).get(req.user.userId);

  if (!user) {
    return res.status(404).json({ 
      success: false, 
      message: 'User not found' 
    });
  }

  res.json({
    success: true,
    data: { user }
  });
});

router.put('/profile', authenticateToken, (req, res) => {
  const { nickname, avatar, gender, birth_year } = req.body;
  const updates = [];
  const values = [];

  if (nickname) {
    updates.push('nickname = ?');
    values.push(nickname);
  }
  if (avatar) {
    updates.push('avatar = ?');
    values.push(avatar);
  }
  if (gender) {
    updates.push('gender = ?');
    values.push(gender);
  }
  if (birth_year) {
    updates.push('birth_year = ?');
    values.push(birth_year);
  }

  if (updates.length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'No fields to update' 
    });
  }

  updates.push('updated_at = strftime(\'%s\', \'now\')');
  values.push(req.user.userId);

  const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;

  db.prepare(query).run(...values);

  res.json({
    success: true,
    message: 'Profile updated successfully'
  });
});

module.exports = router;
