const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'xm-20784-scheduling-system-jwt-secret-key';

router.post('/login', (req, res) => {
  const { erpId, password } = req.body;

  if (!erpId || !password) {
    return res.status(400).json({ error: '请输入ERPID和密码' });
  }

  const user = db.prepare(`
    SELECT u.*, b.name as branch_name, b.is_headquarters, p.name as position_name, p.permissions
    FROM users u
    JOIN branches b ON u.branch_id = b.id
    JOIN positions p ON u.position_id = p.id
    WHERE u.erp_id = ?
  `).get(erpId);

  if (!user) {
    return res.status(401).json({ error: 'ERPID或密码错误' });
  }

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'ERPID或密码错误' });
  }

  if (user.status !== 1) {
    return res.status(403).json({ error: '账户已被禁用' });
  }

  db.prepare(`
    UPDATE users SET last_login_at = datetime('now') WHERE id = ?
  `).run(user.id);

  const token = jwt.sign(
    { userId: user.id, erpId: user.erp_id },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      erpId: user.erp_id,
      name: user.name,
      branchId: user.branch_id,
      branchName: user.branch_name,
      isHeadquarters: user.is_headquarters === 1,
      positionId: user.position_id,
      positionName: user.position_name,
      permissions: JSON.parse(user.permissions || '[]')
    }
  });
});

router.post('/logout', authMiddleware, (req, res) => {
  db.prepare(`
    UPDATE order_locks 
    SET status = 'released' 
    WHERE user_id = ? AND status = 'active'
  `).run(req.user.id);

  res.json({ message: '已登出，个人队列已释放' });
});

router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
