const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

router.get('/profile', authMiddleware, (req, res) => {
  const db = req.db;
  const userId = req.user.userId;

  const user = db.prepare(`
    SELECT id, phone, nickname, avatar, balance, yijie_coins, points, created_at
    FROM users WHERE id = ?
  `).get(userId);

  if (!user) {
    return res.json({
      code: 404,
      message: '用户不存在'
    });
  }

  const couponCount = db.prepare(`
    SELECT COUNT(*) as count FROM user_coupons 
    WHERE user_id = ? AND status = 'unused'
  `).get(userId);

  const orderCount = db.prepare(`
    SELECT COUNT(*) as count FROM orders 
    WHERE user_id = ? AND status = 'paid'
  `).get(userId);

  const fuelOrderCount = db.prepare(`
    SELECT COUNT(*) as count FROM fuel_orders 
    WHERE user_id = ? AND status = 'paid'
  `).get(userId);

  res.json({
    code: 200,
    message: 'success',
    data: {
      ...user,
      coupon_count: couponCount?.count || 0,
      order_count: orderCount?.count || 0,
      fuel_order_count: fuelOrderCount?.count || 0
    }
  });
});

router.post('/profile/update', authMiddleware, (req, res) => {
  const db = req.db;
  const userId = req.user.userId;
  const { nickname, avatar } = req.body;

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

  if (updates.length === 0) {
    return res.json({
      code: 400,
      message: '没有需要更新的内容'
    });
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(userId);

  db.prepare(`
    UPDATE users SET ${updates.join(', ')} WHERE id = ?
  `).run(...values);

  res.json({
    code: 200,
    message: '更新成功'
  });
});

router.post('/change-password', authMiddleware, (req, res) => {
  const db = req.db;
  const userId = req.user.userId;
  const { oldPassword, newPassword, confirmPassword } = req.body;

  if (!oldPassword || !newPassword || !confirmPassword) {
    return res.json({
      code: 400,
      message: '请填写完整信息'
    });
  }

  if (newPassword !== confirmPassword) {
    return res.json({
      code: 400,
      message: '两次密码输入不一致'
    });
  }

  if (newPassword.length < 6) {
    return res.json({
      code: 400,
      message: '密码长度至少6位'
    });
  }

  const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId);

  if (user.password && !bcrypt.compareSync(oldPassword, user.password)) {
    return res.json({
      code: 400,
      message: '原密码错误'
    });
  }

  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  db.prepare(`
    UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(hashedPassword, userId);

  res.json({
    code: 200,
    message: '密码修改成功'
  });
});

router.get('/coupons', authMiddleware, (req, res) => {
  const db = req.db;
  const userId = req.user.userId;
  const { status = 'unused' } = req.query;

  const coupons = db.prepare(`
    SELECT uc.*, c.name, c.type, c.discount_amount, c.min_amount, c.valid_from, c.valid_to
    FROM user_coupons uc
    JOIN coupons c ON uc.coupon_id = c.id
    WHERE uc.user_id = ? AND uc.status = ?
    ORDER BY uc.created_at DESC
  `).all(userId, status);

  res.json({
    code: 200,
    message: 'success',
    data: coupons
  });
});

router.get('/orders', authMiddleware, (req, res) => {
  const db = req.db;
  const userId = req.user.userId;
  const { status, page = 1, pageSize = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(pageSize);

  let query = `SELECT * FROM orders WHERE user_id = ?`;
  let params = [userId];

  if (status) {
    query += ` AND status = ?`;
    params.push(status);
  }

  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(pageSize), offset);

  const orders = db.prepare(query).all(...params);

  for (const order of orders) {
    order.items = db.prepare(`
      SELECT * FROM order_items WHERE order_id = ?
    `).all(order.id);
  }

  res.json({
    code: 200,
    message: 'success',
    data: {
      list: orders,
      page: parseInt(page),
      page_size: parseInt(pageSize)
    }
  });
});

router.get('/order/:id', authMiddleware, (req, res) => {
  const db = req.db;
  const userId = req.user.userId;
  const { id } = req.params;

  const order = db.prepare(`
    SELECT * FROM orders WHERE id = ? AND user_id = ?
  `).get(id, userId);

  if (!order) {
    return res.json({
      code: 404,
      message: '订单不存在'
    });
  }

  order.items = db.prepare(`
    SELECT * FROM order_items WHERE order_id = ?
  `).all(order.id);

  res.json({
    code: 200,
    message: 'success',
    data: order
  });
});

router.post('/invite/create', authMiddleware, (req, res) => {
  const db = req.db;
  const userId = req.user.userId;

  const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId);

  const inviteCode = 'YJ' + userId.toString().padStart(6, '0');

  res.json({
    code: 200,
    message: 'success',
    data: {
      invite_code: inviteCode,
      invite_link: `https://yijie.com/invite?code=${inviteCode}`,
      reward_coins: 100,
      description: '邀请好友注册，双方各得100易捷币'
    }
  });
});

router.post('/invite/claim', authMiddleware, (req, res) => {
  const db = req.db;
  const userId = req.user.userId;
  const { inviteCode } = req.body;

  if (!inviteCode) {
    return res.json({
      code: 400,
      message: '请输入邀请码'
    });
  }

  const inviterIdStr = inviteCode.replace('YJ', '').replace(/^0+/, '');
  const inviterId = parseInt(inviterIdStr);

  if (isNaN(inviterId) || inviterId === userId) {
    return res.json({
      code: 400,
      message: '邀请码无效'
    });
  }

  const inviter = db.prepare(`SELECT * FROM users WHERE id = ?`).get(inviterId);
  if (!inviter) {
    return res.json({
      code: 400,
      message: '邀请码无效'
    });
  }

  const existing = db.prepare(`
    SELECT id FROM invites WHERE invitee_id = ?
  `).get(userId);

  if (existing) {
    return res.json({
      code: 400,
      message: '您已填写过邀请码'
    });
  }

  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO invites (inviter_id, invitee_id, reward_coins, reward_given)
      VALUES (?, ?, 100, 1)
    `).run(inviterId, userId);

    db.prepare(`
      UPDATE users SET yijie_coins = yijie_coins + 100 WHERE id = ?
    `).run(userId);

    db.prepare(`
      UPDATE users SET yijie_coins = yijie_coins + 100 WHERE id = ?
    `).run(inviterId);
  });

  try {
    tx();
    res.json({
      code: 200,
      message: '领取成功，双方各获得100易捷币'
    });
  } catch (error) {
    res.json({
      code: 400,
      message: '领取失败'
    });
  }
});

router.get('/points-exchange', authMiddleware, (req, res) => {
  const db = req.db;
  const userId = req.user.userId;

  const user = db.prepare(`SELECT points FROM users WHERE id = ?`).get(userId);

  const exchangeItems = [
    {
      id: 1,
      name: '10元加油券',
      type: 'coupon',
      points_required: 100,
      discount_amount: 10,
      description: '满100可用'
    },
    {
      id: 2,
      name: '20元购物券',
      type: 'coupon',
      points_required: 200,
      discount_amount: 20,
      description: '满100可用'
    },
    {
      id: 3,
      name: '50元充值券',
      type: 'recharge',
      points_required: 500,
      discount_amount: 50,
      description: '钱包充值满500可用'
    },
    {
      id: 4,
      name: '矿泉水一箱',
      type: 'product',
      points_required: 300,
      product_id: 1,
      description: '农夫山泉矿泉水550ml*24瓶'
    }
  ];

  res.json({
    code: 200,
    message: 'success',
    data: {
      current_points: user?.points || 0,
      exchange_items: exchangeItems
    }
  });
});

router.post('/points-exchange', authMiddleware, (req, res) => {
  const db = req.db;
  const userId = req.user.userId;
  const { itemId } = req.body;

  const exchangeItems = {
    1: { points: 100, name: '10元加油券', type: 'coupon', amount: 10 },
    2: { points: 200, name: '20元购物券', type: 'coupon', amount: 20 },
    3: { points: 500, name: '50元充值券', type: 'recharge', amount: 50 },
    4: { points: 300, name: '矿泉水一箱', type: 'product', amount: 30 }
  };

  const item = exchangeItems[itemId];
  if (!item) {
    return res.json({
      code: 400,
      message: '兑换项不存在'
    });
  }

  const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId);
  if (user.points < item.points) {
    return res.json({
      code: 400,
      message: '积分不足'
    });
  }

  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE users SET points = points - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(item.points, userId);

    if (item.type === 'coupon') {
      db.prepare(`
        INSERT INTO user_coupons (user_id, coupon_id, status)
        VALUES (?, 1, 'unused')
      `).run(userId);
    } else if (item.type === 'recharge') {
      db.prepare(`
        UPDATE users SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(item.amount, userId);
    }
  });

  try {
    tx();
    res.json({
      code: 200,
      message: `兑换成功，消耗${item.points}积分`
    });
  } catch (error) {
    res.json({
      code: 400,
      message: '兑换失败'
    });
  }
});

module.exports = router;
