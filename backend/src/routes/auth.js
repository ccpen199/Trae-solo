const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');
const auditService = require('../services/audit.service');

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: '请输入用户名和密码'
    });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    auditService.log({
      module: auditService.MODULES.USER,
      action: 'login_attempt',
      description: `登录失败: 用户名 ${username}`,
      status: 'failed'
    });

    return res.status(401).json({
      success: false,
      message: '用户名或密码错误'
    });
  }

  if (user.status !== 'active') {
    return res.status(403).json({
      success: false,
      message: '账户已被禁用，请联系客服'
    });
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  auditService.log({
    module: auditService.MODULES.USER,
    action: 'login',
    resourceType: 'user',
    resourceId: user.id,
    description: `用户 ${user.username} 登录成功`,
    status: 'success'
  });

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        phone: user.phone,
        email: user.email,
        role: user.role,
        trustScore: user.trust_score,
        trustLevel: user.trust_level,
        isVerified: user.is_verified === 1
      }
    }
  });
});

router.post('/register', (req, res) => {
  const { username, password, nickname, phone, role = 'buyer' } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: '用户名和密码不能为空'
    });
  }

  const existingUser = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: '用户名已存在'
    });
  }

  const validRoles = ['buyer', 'seller'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: '无效的用户角色'
    });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const defaultTrustScore = parseInt(process.env.TRUST_DEFAULT_SCORE) || 600;

  const insertStmt = db.prepare(`
    INSERT INTO users (
      username, password, nickname, phone, role, 
      trust_score, trust_level, is_verified, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  try {
    const result = insertStmt.run(
      username,
      hashedPassword,
      nickname || username,
      phone || null,
      role,
      defaultTrustScore,
      'normal',
      0,
      'active'
    );

    const userId = result.lastInsertRowid;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

    auditService.log({
      module: auditService.MODULES.USER,
      action: 'register',
      resourceType: 'user',
      resourceId: userId,
      newValue: { username, nickname, role },
      description: `新用户注册: ${username}`,
      status: 'success'
    });

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: '注册成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          role: user.role,
          trustScore: user.trust_score,
          trustLevel: user.trust_level
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '注册失败，请稍后重试'
    });
  }
});

router.get('/me', authenticateToken, (req, res) => {
  const user = db.prepare(`
    SELECT id, username, nickname, avatar, phone, email, 
           role, trust_score, trust_level, is_verified, status,
           created_at
    FROM users WHERE id = ?
  `).get(req.user.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: '用户不存在'
    });
  }

  res.json({
    success: true,
    data: {
      ...user,
      isVerified: user.is_verified === 1
    }
  });
});

router.put('/profile', authenticateToken, (req, res) => {
  const { nickname, phone, email, avatar } = req.body;
  const userId = req.user.id;

  const updateFields = [];
  const updateValues = [];

  if (nickname !== undefined) {
    updateFields.push('nickname = ?');
    updateValues.push(nickname);
  }
  if (phone !== undefined) {
    updateFields.push('phone = ?');
    updateValues.push(phone);
  }
  if (email !== undefined) {
    updateFields.push('email = ?');
    updateValues.push(email);
  }
  if (avatar !== undefined) {
    updateFields.push('avatar = ?');
    updateValues.push(avatar);
  }

  if (updateFields.length === 0) {
    return res.status(400).json({
      success: false,
      message: '没有需要更新的字段'
    });
  }

  updateFields.push('updated_at = CURRENT_TIMESTAMP');
  updateValues.push(userId);

  const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;

  try {
    db.prepare(sql).run(...updateValues);

    const updatedUser = db.prepare(`
      SELECT id, username, nickname, avatar, phone, email, role, trust_score, trust_level
      FROM users WHERE id = ?
    `).get(userId);

    auditService.logUpdate({
      user: req.user,
      module: auditService.MODULES.USER,
      resourceType: 'user',
      resourceId: userId,
      description: '用户更新个人资料',
      status: 'success'
    });

    res.json({
      success: true,
      message: '资料更新成功',
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新失败'
    });
  }
});

router.put('/password', authenticateToken, (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: '请输入原密码和新密码'
    });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

  if (!bcrypt.compareSync(oldPassword, user.password)) {
    return res.status(400).json({
      success: false,
      message: '原密码错误'
    });
  }

  const hashedNewPassword = bcrypt.hashSync(newPassword, 10);

  db.prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(hashedNewPassword, userId);

  auditService.logUpdate({
    user: req.user,
    module: auditService.MODULES.USER,
    resourceType: 'user',
    resourceId: userId,
    description: '用户修改密码',
    status: 'success'
  });

  res.json({
    success: true,
    message: '密码修改成功'
  });
});

router.post('/logout', authenticateToken, (req, res) => {
  auditService.log({
    user: req.user,
    module: auditService.MODULES.USER,
    action: 'logout',
    resourceType: 'user',
    resourceId: req.user.id,
    description: `用户 ${req.user.username} 登出`,
    status: 'success'
  });

  res.json({
    success: true,
    message: '登出成功'
  });
});

module.exports = router;
