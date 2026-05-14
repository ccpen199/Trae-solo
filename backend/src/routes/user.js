const express = require('express');
const dayjs = require('dayjs');
const { db } = require('../database');
const { authMiddleware, verifyMiddleware } = require('../middleware/auth');
const { validateIdCard } = require('../utils/idCard');

const router = express.Router();

router.get('/profile', authMiddleware, (req, res) => {
  try {
    const user = db.prepare('SELECT id, phone, nickname, avatar, real_name, id_card, is_verified, balance, created_at FROM users WHERE id = ?').get(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const idCardMasked = user.id_card ? user.id_card.substring(0, 4) + '********' + user.id_card.substring(14) : null;

    res.json({
      success: true,
      data: {
        ...user,
        id_card: idCardMasked
      },
      message: '获取成功'
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

router.put('/profile', authMiddleware, (req, res) => {
  try {
    const { nickname, avatar } = req.body;
    
    const updateFields = [];
    const params = [];

    if (nickname !== undefined) {
      updateFields.push('nickname = ?');
      params.push(nickname);
    }

    if (avatar !== undefined) {
      updateFields.push('avatar = ?');
      params.push(avatar);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有要更新的字段'
      });
    }

    params.push(req.user.id);
    const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
    
    db.prepare(sql).run(...params);

    const user = db.prepare('SELECT id, phone, nickname, avatar, is_verified, balance FROM users WHERE id = ?').get(req.user.id);

    res.json({
      success: true,
      data: user,
      message: '更新成功'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

router.post('/verify', authMiddleware, (req, res) => {
  try {
    const { real_name, id_card } = req.body;

    if (!real_name || !id_card) {
      return res.status(400).json({
        success: false,
        message: '姓名和身份证号不能为空'
      });
    }

    if (req.user.is_verified === 1) {
      return res.status(400).json({
        success: false,
        message: '您已经完成实名认证'
      });
    }

    const validation = validateIdCard(id_card);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    db.prepare('UPDATE users SET real_name = ?, id_card = ?, is_verified = 1 WHERE id = ?').run(real_name, id_card, req.user.id);

    const user = db.prepare('SELECT id, phone, nickname, avatar, is_verified, balance FROM users WHERE id = ?').get(req.user.id);

    res.json({
      success: true,
      data: user,
      message: '实名认证成功'
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

router.get('/favorites', authMiddleware, (req, res) => {
  try {
    const { page = 1, page_size = 10 } = req.query;

    const countSql = `
      SELECT COUNT(*) as count
      FROM favorites f
      INNER JOIN appliances a ON f.appliance_id = a.id
      WHERE f.user_id = ?
    `;
    const total = db.prepare(countSql).get(req.user.id).count;

    const offset = (page - 1) * page_size;
    const sql = `
      SELECT f.id as favorite_id, a.*, c.name as category_name, c.icon as category_icon
      FROM favorites f
      INNER JOIN appliances a ON f.appliance_id = a.id
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const favorites = db.prepare(sql).all(req.user.id, parseInt(page_size), offset);

    const result = favorites.map(item => ({
      ...item,
      images: item.images ? JSON.parse(item.images) : []
    }));

    res.json({
      success: true,
      data: {
        list: result,
        total,
        page: parseInt(page),
        page_size: parseInt(page_size),
        total_pages: Math.ceil(total / page_size)
      },
      message: '获取成功'
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

router.post('/favorites/:applianceId', authMiddleware, (req, res) => {
  try {
    const { applianceId } = req.params;

    const appliance = db.prepare('SELECT id FROM appliances WHERE id = ?').get(applianceId);
    if (!appliance) {
      return res.status(404).json({
        success: false,
        message: '商品不存在'
      });
    }

    const existing = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND appliance_id = ?').get(req.user.id, applianceId);
    
    if (existing) {
      return res.json({
        success: true,
        data: { is_favorite: true },
        message: '已收藏'
      });
    }

    db.prepare('INSERT INTO favorites (user_id, appliance_id) VALUES (?, ?)').run(req.user.id, applianceId);

    res.json({
      success: true,
      data: { is_favorite: true },
      message: '收藏成功'
    });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

router.delete('/favorites/:applianceId', authMiddleware, (req, res) => {
  try {
    const { applianceId } = req.params;

    db.prepare('DELETE FROM favorites WHERE user_id = ? AND appliance_id = ?').run(req.user.id, applianceId);

    res.json({
      success: true,
      data: { is_favorite: false },
      message: '取消收藏成功'
    });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

router.get('/favorites/check/:applianceId', authMiddleware, (req, res) => {
  try {
    const { applianceId } = req.params;

    const existing = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND appliance_id = ?').get(req.user.id, applianceId);

    res.json({
      success: true,
      data: { is_favorite: !!existing },
      message: '获取成功'
    });
  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

router.get('/deposit', authMiddleware, (req, res) => {
  try {
    const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
    
    res.json({
      success: true,
      data: {
        balance: user?.balance || 0,
        frozen_deposit: 0
      },
      message: '获取成功'
    });
  } catch (error) {
    console.error('Get deposit error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

router.post('/deposit/recharge', authMiddleware, (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: '充值金额必须大于0'
      });
    }

    db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(amount, req.user.id);
    
    const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);

    res.json({
      success: true,
      data: { balance: user.balance },
      message: '充值成功'
    });
  } catch (error) {
    console.error('Recharge error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

module.exports = router;
