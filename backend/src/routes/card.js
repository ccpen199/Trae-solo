const express = require('express');
const db = require('../db');
const dayjs = require('dayjs');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/cards', (req, res) => {
  try {
    const cards = db.prepare('SELECT * FROM cards WHERE status = 1 ORDER BY type ASC, price ASC').all();
    
    res.json({
      success: true,
      data: cards
    });
  } catch (error) {
    console.error('获取卡列表错误:', error);
    res.json({
      success: false,
      message: '获取卡列表失败'
    });
  }
});

router.post('/buy', authMiddleware, (req, res) => {
  try {
    const { cardId } = req.body;

    if (!cardId) {
      return res.json({
        success: false,
        message: '请选择要购买的卡'
      });
    }

    const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(cardId);
    
    if (!card) {
      return res.json({
        success: false,
        message: '卡不存在'
      });
    }

    const orderNo = 'ORD' + Date.now() + Math.floor(Math.random() * 10000);
    
    const insertOrder = db.prepare(`
      INSERT INTO orders (order_no, user_id, type, item_id, amount, pay_amount, status)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);
    
    insertOrder.run(orderNo, req.user.id, card.type, cardId, card.price, card.price);

    const expireTime = dayjs().add(card.valid_days, 'day').format('YYYY-MM-DD HH:mm:ss');
    const insertUserCard = db.prepare(`
      INSERT INTO user_cards (user_id, card_id, balance, expire_time)
      VALUES (?, ?, ?, ?)
    `);
    
    insertUserCard.run(req.user.id, cardId, card.value, expireTime);

    res.json({
      success: true,
      data: {
        orderNo
      },
      message: '购买成功'
    });
  } catch (error) {
    console.error('购卡错误:', error);
    res.json({
      success: false,
      message: '购买失败，请稍后重试'
    });
  }
});

router.get('/my-cards', authMiddleware, (req, res) => {
  try {
    const userCards = db.prepare(`
      SELECT uc.*, c.name, c.type, c.description, c.benefits
      FROM user_cards uc
      JOIN cards c ON uc.card_id = c.id
      WHERE uc.user_id = ? AND uc.status = 1
      ORDER BY uc.created_at DESC
    `).all(req.user.id);

    res.json({
      success: true,
      data: userCards
    });
  } catch (error) {
    console.error('获取我的卡错误:', error);
    res.json({
      success: false,
      message: '获取卡列表失败'
    });
  }
});

router.get('/coupons', authMiddleware, (req, res) => {
  try {
    const coupons = db.prepare(`
      SELECT * FROM coupons 
      WHERE user_id = ? AND status = 1
      ORDER BY created_at DESC
    `).all(req.user.id);

    res.json({
      success: true,
      data: coupons
    });
  } catch (error) {
    console.error('获取优惠券错误:', error);
    res.json({
      success: false,
      message: '获取优惠券失败'
    });
  }
});

router.get('/statistics', authMiddleware, (req, res) => {
  try {
    const groupBookingCount = db.prepare(`
      SELECT COUNT(*) as count FROM group_bookings WHERE user_id = ? AND status = 1
    `).get(req.user.id).count;

    const coachBookingCount = db.prepare(`
      SELECT COUNT(*) as count FROM coach_bookings WHERE user_id = ? AND status = 1
    `).get(req.user.id).count;

    const cardCount = db.prepare(`
      SELECT COUNT(*) as count FROM user_cards WHERE user_id = ? AND status = 1
    `).get(req.user.id).count;

    const orders = db.prepare(`
      SELECT SUM(pay_amount) as total FROM orders WHERE user_id = ? AND status = 1
    `).get(req.user.id);

    res.json({
      success: true,
      data: {
        groupBookingCount,
        coachBookingCount,
        cardCount,
        totalSpent: orders.total || 0
      }
    });
  } catch (error) {
    console.error('获取统计数据错误:', error);
    res.json({
      success: false,
      message: '获取统计数据失败'
    });
  }
});

module.exports = router;
