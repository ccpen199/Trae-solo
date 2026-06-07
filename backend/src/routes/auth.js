const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../utils/database');
const { authenticateToken } = require('../middleware/auth');
const { getServiceUserId } = require('../utils/accountContext');

const router = express.Router();

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    
    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: '账号已被禁用' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(user.id);
    const meter = db.prepare('SELECT * FROM meters WHERE user_id = ?').get(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        real_name: user.real_name,
        phone: user.phone,
        role: user.role,
        email: user.email,
        address: user.address
      },
      profile,
      meter
    });
  } catch (err) {
    console.error('登录错误:', err);
    res.status(500).json({ error: '登录失败' });
  }
});

router.post('/register', (req, res) => {
  try {
    const { username, password, real_name, id_card, phone, email, address, role, organization_id } = req.body;

    if (!username || !password || !real_name || !id_card || !phone) {
      return res.status(400).json({ error: '必填项不能为空' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ? OR phone = ? OR id_card = ?').get(username, phone, id_card);
    if (existing) {
      return res.status(400).json({ error: '用户名、手机号或身份证号已存在' });
    }

    const tx = db.transaction(() => {
      const passwordHash = bcrypt.hashSync(password, 10);
      const safeRole = ['user', 'grid_worker', 'operator', 'admin'].includes(role) ? role : 'user';
      const result = db.prepare(`INSERT INTO users (username, password, real_name, id_card, phone, email, address, role, org_id, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`).run(
        username,
        passwordHash,
        real_name,
        id_card,
        phone,
        email,
        address,
        safeRole,
        organization_id || null
      );

      const gasUserNo = `GS${new Date().getFullYear()}${String(result.lastInsertRowid).padStart(6, '0')}`;
      db.prepare(`INSERT INTO user_profiles (user_id, gas_user_no, household_type) VALUES (?, ?, 'residential')`).run(result.lastInsertRowid, gasUserNo);

      return result.lastInsertRowid;
    });

    const userId = tx();
    const safeRole = ['user', 'grid_worker', 'operator', 'admin'].includes(role) ? role : 'user';
    const token = jwt.sign({ userId, username, role: safeRole }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

    res.status(201).json({
      token,
      user: { id: userId, username, real_name, phone, role: safeRole, email, address }
    });
  } catch (err) {
    console.error('注册错误:', err);
    res.status(500).json({ error: '注册失败' });
  }
});

router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id, username, real_name, id_card, phone, email, address, role, status, org_id, created_at FROM users WHERE id = ?').get(req.user.id);
    const serviceUserId = getServiceUserId(req);
    const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(serviceUserId);
    const meter = db.prepare('SELECT * FROM meters WHERE user_id = ?').get(serviceUserId);
    res.json({ user: user || req.user, profile, meter, service_user_id: serviceUserId });
  } catch (err) {
    console.error('获取用户信息错误:', err);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

router.get('/profile', authenticateToken, (req, res) => {
  try {
    const serviceUserId = getServiceUserId(req);
    const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(serviceUserId);
    const meter = db.prepare('SELECT * FROM meters WHERE user_id = ?').get(serviceUserId);
    res.json({ profile, meter, service_user_id: serviceUserId });
  } catch (err) {
    res.status(500).json({ error: '获取用户资料失败' });
  }
});

router.put('/profile', authenticateToken, (req, res) => {
  try {
    const { real_name, phone, email, address, id_card } = req.body;

    if (!real_name || !phone) {
      return res.status(400).json({ error: '真实姓名和手机号不能为空' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE (phone = ? OR id_card = ?) AND id != ?')
      .get(phone, id_card || '', req.user.id);
    if (existing) {
      return res.status(400).json({ error: '手机号或身份证号已被其他用户使用' });
    }

    db.prepare(`UPDATE users SET
      real_name = ?,
      phone = ?,
      email = ?,
      address = ?,
      id_card = COALESCE(NULLIF(?, ''), id_card)
      WHERE id = ?`).run(real_name, phone, email || null, address || null, id_card || '', req.user.id);

    const user = db.prepare('SELECT id, username, real_name, id_card, phone, email, address, role, status, org_id, created_at FROM users WHERE id = ?').get(req.user.id);
    res.json({ message: '个人信息更新成功', user });
  } catch (err) {
    console.error('更新个人信息错误:', err);
    res.status(500).json({ error: '更新失败' });
  }
});

router.post('/change-password', authenticateToken, (req, res) => {
  try {
    const { old_password, new_password } = req.body;
    if (!old_password || !new_password) {
      return res.status(400).json({ error: '请填写当前密码和新密码' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user || !bcrypt.compareSync(old_password, user.password)) {
      return res.status(400).json({ error: '当前密码错误' });
    }

    db.prepare('UPDATE users SET password = ? WHERE id = ?')
      .run(bcrypt.hashSync(new_password, 10), req.user.id);

    res.json({ message: '密码修改成功' });
  } catch (err) {
    console.error('修改密码错误:', err);
    res.status(500).json({ error: '密码修改失败' });
  }
});

router.post('/logout', authenticateToken, (req, res) => {
  res.json({ message: '已退出登录' });
});

module.exports = router;
