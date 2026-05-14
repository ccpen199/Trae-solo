const express = require('express');
const { db } = require('../database');
const { adminAuthMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/users', adminAuthMiddleware, (req, res) => {
  try {
    const { page = 1, page_size = 10 } = req.query;

    const countSql = 'SELECT COUNT(*) as count FROM users';
    const total = db.prepare(countSql).get().count;

    const offset = (page - 1) * page_size;
    const sql = `
      SELECT id, phone, nickname, avatar, is_verified, balance, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const users = db.prepare(sql).all(parseInt(page_size), offset);

    res.json({
      success: true,
      data: {
        list: users,
        total,
        page: parseInt(page),
        page_size: parseInt(page_size),
        total_pages: Math.ceil(total / page_size)
      },
      message: '获取成功'
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

router.get('/rentals', adminAuthMiddleware, (req, res) => {
  try {
    const { status, page = 1, page_size = 10 } = req.query;

    let sql = `
      SELECT r.*, u.phone as user_phone, u.nickname as user_name, a.name as appliance_name
      FROM rentals r
      INNER JOIN users u ON r.user_id = u.id
      INNER JOIN appliances a ON r.appliance_id = a.id
    `;
    const params = [];

    if (status) {
      sql += ' WHERE r.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY r.created_at DESC';

    const countSql = sql.replace('SELECT r.*, u.phone as user_phone, u.nickname as user_name, a.name as appliance_name', 'SELECT COUNT(*) as count');
    const total = db.prepare(countSql).get(...params).count;

    const offset = (page - 1) * page_size;
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(page_size), offset);

    const rentals = db.prepare(sql).all(...params);

    res.json({
      success: true,
      data: {
        list: rentals,
        total,
        page: parseInt(page),
        page_size: parseInt(page_size),
        total_pages: Math.ceil(total / page_size)
      },
      message: '获取成功'
    });
  } catch (error) {
    console.error('Get rentals error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

router.get('/appliances', adminAuthMiddleware, (req, res) => {
  try {
    const { status, page = 1, page_size = 10 } = req.query;

    let sql = `
      SELECT a.*, c.name as category_name
      FROM appliances a
      LEFT JOIN categories c ON a.category_id = c.id
    `;
    const params = [];

    if (status) {
      sql += ' WHERE a.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY a.created_at DESC';

    const countSql = sql.replace('SELECT a.*, c.name as category_name', 'SELECT COUNT(*) as count');
    const total = db.prepare(countSql).get(...params).count;

    const offset = (page - 1) * page_size;
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(page_size), offset);

    const appliances = db.prepare(sql).all(...params);

    res.json({
      success: true,
      data: {
        list: appliances,
        total,
        page: parseInt(page),
        page_size: parseInt(page_size),
        total_pages: Math.ceil(total / page_size)
      },
      message: '获取成功'
    });
  } catch (error) {
    console.error('Get appliances error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

router.get('/stats', adminAuthMiddleware, (req, res) => {
  try {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const applianceCount = db.prepare('SELECT COUNT(*) as count FROM appliances').get().count;
    const rentalCount = db.prepare('SELECT COUNT(*) as count FROM rentals').get().count;
    const activeRentalCount = db.prepare("SELECT COUNT(*) as count FROM rentals WHERE status = 'active'").get().count;
    const verifiedCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_verified = 1').get().count;
    const totalAmount = db.prepare('SELECT SUM(total_amount) as total FROM rentals WHERE status != "cancelled"').get().total || 0;

    res.json({
      success: true,
      data: {
        user_count: userCount,
        verified_count: verifiedCount,
        appliance_count: applianceCount,
        rental_count: rentalCount,
        active_rental_count: activeRentalCount,
        total_amount: totalAmount
      },
      message: '获取成功'
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

module.exports = router;
