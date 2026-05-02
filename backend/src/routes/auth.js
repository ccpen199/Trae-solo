const express = require('express');
const bcrypt = require('bcryptjs');
const { getAsync, allAsync, runAsync } = require('../config/database');
const { generateToken, authMiddleware } = require('../middleware/auth');
const { ROLES } = require('../models/initDb');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: '用户名和密码不能为空'
      });
    }

    const user = await getAsync(
      `SELECT * FROM users WHERE username = ?`,
      [username]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        error: '用户名或密码错误'
      });
    }

    if (user.is_active !== 1) {
      return res.status(403).json({
        success: false,
        error: '用户已被禁用'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: '用户名或密码错误'
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          name: user.name,
          email: user.email,
          phone: user.phone,
          department: user.department
        }
      }
    });
  } catch (err) {
    console.error('登录失败:', err);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

router.get('/me', authMiddleware, (req, res) => {
  res.json({
    success: true,
    data: req.user
  });
});

router.get('/users', authMiddleware, async (req, res) => {
  try {
    const { role, search } = req.query;
    
    let sql = `SELECT id, username, name, role, email, phone, department, is_active, created_at FROM users WHERE 1=1`;
    let params = [];

    if (role) {
      sql += ` AND role = ?`;
      params.push(role);
    }

    if (search) {
      sql += ` AND (name LIKE ? OR username LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY created_at DESC`;

    const users = await allAsync(sql, params);

    res.json({
      success: true,
      data: users
    });
  } catch (err) {
    console.error('获取用户列表失败:', err);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

router.get('/roles', authMiddleware, (req, res) => {
  const roleInfo = {
    [ROLES.CONSUMER]: {
      name: '消费者',
      description: '提交3D模型需求，查看报价，留资确认',
      permissions: ['create_order', 'view_order', 'submit_lead', 'cancel_order']
    },
    [ROLES.DESIGNER]: {
      name: '设计师',
      description: '审核材质，交互确认，配置热点',
      permissions: ['review_order', 'approve_order', 'reject_order', 'transfer_order']
    },
    [ROLES.OPERATOR]: {
      name: '运营',
      description: '管理系统配置，查看所有订单，处理异常',
      permissions: ['manage_all', 'view_all', 'revert_order', 'archive_order']
    },
    [ROLES.SALES]: {
      name: '销售',
      description: '生成报价，锁定配置，跟进留资',
      permissions: ['generate_quote', 'lock_config', 'view_lead']
    }
  };

  res.json({
    success: true,
    data: roleInfo
  });
});

module.exports = router;
