const { db } = require('../models/database');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

const loginOrRegister = (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return res.json({ success: false, message: '请输入正确的手机号' });
    }

    let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    
    if (!user) {
      const result = db.prepare('INSERT INTO users (phone, nickname) VALUES (?, ?)').run(
        phone,
        `用户${phone.slice(-4)}`
      );
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      data: {
        user,
        token
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.json({ success: false, message: '登录失败，请重试' });
  }
};

const getProfile = (req, res) => {
  res.json({
    success: true,
    data: req.user
  });
};

const getOrders = (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT o.*, qt.name as question_type_name, l.name as lawyer_name FROM orders o LEFT JOIN question_types qt ON o.question_type_id = qt.id LEFT JOIN lawyers l ON o.lawyer_id = l.id WHERE o.user_id = ?';
    const params = [req.user.id];
    
    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY o.created_at DESC';
    const orders = db.prepare(query).all(...params);
    
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('获取订单错误:', error);
    res.json({ success: false, message: '获取订单失败' });
  }
};

module.exports = { loginOrRegister, getProfile, getOrders };
