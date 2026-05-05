const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

router.get('/wallet', authMiddleware, (req, res) => {
  const db = req.db;
  const userId = req.user.userId;

  const user = db.prepare(`
    SELECT id, phone, nickname, avatar, balance, yijie_coins, points
    FROM users WHERE id = ?
  `).get(userId);

  const couponCount = db.prepare(`
    SELECT COUNT(*) as count FROM user_coupons 
    WHERE user_id = ? AND status = 'unused'
  `).get(userId);

  const recentTransactions = db.prepare(`
    SELECT * FROM wallet_transactions 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT 10
  `).all(userId);

  res.json({
    code: 200,
    message: 'success',
    data: {
      balance: user.balance,
      yijie_coins: user.yijie_coins,
      points: user.points,
      coupon_count: couponCount?.count || 0,
      recent_transactions: recentTransactions
    }
  });
});

router.post('/recharge', authMiddleware, (req, res) => {
  const db = req.db;
  const userId = req.user.userId;
  const { amount, payType = 'wechat' } = req.body;

  if (!amount || parseFloat(amount) <= 0) {
    return res.json({
      code: 400,
      message: '请输入正确的充值金额'
    });
  }

  const rechargeAmount = parseFloat(amount);
  const tx = db.transaction(() => {
    const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId);
    const newBalance = user.balance + rechargeAmount;

    db.prepare(`
      UPDATE users SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(newBalance, userId);

    db.prepare(`
      INSERT INTO wallet_transactions (user_id, type, amount, balance_after, description)
      VALUES (?, 'recharge', ?, ?, '钱包充值')
    `).run(userId, rechargeAmount, newBalance);

    let bonusCoins = 0;
    if (rechargeAmount >= 100) {
      bonusCoins = Math.floor(rechargeAmount / 10);
      db.prepare(`
        UPDATE users SET yijie_coins = yijie_coins + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(bonusCoins, userId);
    }

    return {
      balance: newBalance,
      bonus_coins: bonusCoins
    };
  });

  try {
    const result = tx();
    res.json({
      code: 200,
      message: `充值成功${result.bonus_coins > 0 ? `，赠送${result.bonus_coins}易捷币` : ''}`,
      data: {
        balance: result.balance,
        bonus_coins: result.bonus_coins
      }
    });
  } catch (error) {
    res.json({
      code: 400,
      message: '充值失败'
    });
  }
});

router.get('/transactions', authMiddleware, (req, res) => {
  const db = req.db;
  const userId = req.user.userId;
  const { type, page = 1, pageSize = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(pageSize);

  let query = `SELECT * FROM wallet_transactions WHERE user_id = ?`;
  let params = [userId];

  if (type) {
    query += ` AND type = ?`;
    params.push(type);
  }

  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(pageSize), offset);

  const transactions = db.prepare(query).all(...params);

  let countQuery = `SELECT COUNT(*) as total FROM wallet_transactions WHERE user_id = ?`;
  let countParams = [userId];
  if (type) {
    countQuery += ` AND type = ?`;
    countParams.push(type);
  }
  const countResult = db.prepare(countQuery).get(...countParams);

  res.json({
    code: 200,
    message: 'success',
    data: {
      list: transactions,
      page: parseInt(page),
      page_size: parseInt(pageSize),
      total: countResult?.total || 0
    }
  });
});

router.get('/vehicles', authMiddleware, (req, res) => {
  const db = req.db;
  const userId = req.user.userId;

  const vehicles = db.prepare(`
    SELECT * FROM user_vehicles WHERE user_id = ? ORDER BY is_default DESC, created_at DESC
  `).all(userId);

  res.json({
    code: 200,
    message: 'success',
    data: vehicles
  });
});

router.post('/vehicle/add', authMiddleware, (req, res) => {
  const db = req.db;
  const userId = req.user.userId;
  const { plateNumber, vehicleType, fuelType, isDefault = false } = req.body;

  if (!plateNumber) {
    return res.json({
      code: 400,
      message: '请输入车牌号'
    });
  }

  const existing = db.prepare(`
    SELECT id FROM user_vehicles WHERE plate_number = ?
  `).get(plateNumber);

  if (existing) {
    return res.json({
      code: 400,
      message: '该车牌号已添加'
    });
  }

  const tx = db.transaction(() => {
    if (isDefault) {
      db.prepare(`
        UPDATE user_vehicles SET is_default = 0 WHERE user_id = ?
      `).run(userId);
    }

    db.prepare(`
      INSERT INTO user_vehicles (user_id, plate_number, vehicle_type, fuel_type, is_default)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, plateNumber, vehicleType || '轿车', fuelType || '92号汽油', isDefault ? 1 : 0);
  });

  try {
    tx();
    res.json({
      code: 200,
      message: '添加成功'
    });
  } catch (error) {
    res.json({
      code: 400,
      message: '添加失败'
    });
  }
});

router.post('/vehicle/set-default', authMiddleware, (req, res) => {
  const db = req.db;
  const userId = req.user.userId;
  const { vehicleId } = req.body;

  const vehicle = db.prepare(`
    SELECT id FROM user_vehicles WHERE id = ? AND user_id = ?
  `).get(vehicleId, userId);

  if (!vehicle) {
    return res.json({
      code: 404,
      message: '车辆不存在'
    });
  }

  const tx = db.transaction(() => {
    db.prepare(`UPDATE user_vehicles SET is_default = 0 WHERE user_id = ?`).run(userId);
    db.prepare(`UPDATE user_vehicles SET is_default = 1 WHERE id = ?`).run(vehicleId);
  });

  tx();
  res.json({
    code: 200,
    message: '设置成功'
  });
});

router.post('/vehicle/remove', authMiddleware, (req, res) => {
  const db = req.db;
  const userId = req.user.userId;
  const { vehicleId } = req.body;

  const vehicle = db.prepare(`
    SELECT id FROM user_vehicles WHERE id = ? AND user_id = ?
  `).get(vehicleId, userId);

  if (!vehicle) {
    return res.json({
      code: 404,
      message: '车辆不存在'
    });
  }

  db.prepare(`DELETE FROM user_vehicles WHERE id = ?`).run(vehicleId);

  res.json({
    code: 200,
    message: '已删除'
  });
});

router.get('/fuel-orders', authMiddleware, (req, res) => {
  const db = req.db;
  const userId = req.user.userId;
  const { status, page = 1, pageSize = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(pageSize);

  let query = `SELECT * FROM fuel_orders WHERE user_id = ?`;
  let params = [userId];

  if (status) {
    query += ` AND status = ?`;
    params.push(status);
  }

  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(pageSize), offset);

  const orders = db.prepare(query).all(...params);

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

router.post('/fuel-order/create', authMiddleware, (req, res) => {
  const db = req.db;
  const userId = req.user.userId;
  const { stationId, fuelType, fuelPrice, fuelLiters, plateNumber } = req.body;

  if (!stationId || !fuelType || !fuelPrice || !fuelLiters) {
    return res.json({
      code: 400,
      message: '参数错误'
    });
  }

  const station = db.prepare(`SELECT * FROM gas_stations WHERE id = ?`).get(stationId);
  if (!station) {
    return res.json({
      code: 404,
      message: '油站不存在'
    });
  }

  const totalAmount = parseFloat(fuelPrice) * parseFloat(fuelLiters);
  const orderNo = 'F' + Date.now().toString() + Math.random().toString(36).substr(2, 6).toUpperCase();

  const result = db.prepare(`
    INSERT INTO fuel_orders (order_no, user_id, station_id, station_name, fuel_type, fuel_price, fuel_liters, total_amount, pay_amount, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `).run(orderNo, userId, stationId, station.name, fuelType, fuelPrice, fuelLiters, totalAmount, totalAmount);

  res.json({
    code: 200,
    message: 'success',
    data: {
      orderId: result.lastInsertRowid,
      orderNo,
      totalAmount
    }
  });
});

router.post('/fuel-order/pay', authMiddleware, (req, res) => {
  const db = req.db;
  const userId = req.user.userId;
  const { orderId, payType = 'balance', couponId } = req.body;

  const order = db.prepare(`
    SELECT * FROM fuel_orders WHERE id = ? AND user_id = ?
  `).get(orderId, userId);

  if (!order) {
    return res.json({
      code: 404,
      message: '订单不存在'
    });
  }

  if (order.status !== 'pending') {
    return res.json({
      code: 400,
      message: '订单状态不正确'
    });
  }

  const tx = db.transaction(() => {
    let payAmount = order.total_amount;
    let discountAmount = 0;

    if (couponId) {
      const userCoupon = db.prepare(`
        SELECT uc.*, c.discount_amount, c.min_amount, c.type
        FROM user_coupons uc
        JOIN coupons c ON uc.coupon_id = c.id
        WHERE uc.id = ? AND uc.user_id = ? AND uc.status = 'unused'
      `).get(couponId, userId);

      if (userCoupon && (userCoupon.type === 'fuel' || userCoupon.type === 'general')) {
        if (payAmount >= userCoupon.min_amount) {
          discountAmount = userCoupon.discount_amount;
          payAmount = Math.max(0, payAmount - discountAmount);
          db.prepare(`
            UPDATE user_coupons SET status = 'used' WHERE id = ?
          `).run(userCoupon.id);
        }
      }
    }

    if (payType === 'balance') {
      const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId);
      
      if (user.balance < payAmount) {
        throw new Error('余额不足，请先充值');
      }

      const newBalance = user.balance - payAmount;

      db.prepare(`
        UPDATE users SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(newBalance, userId);

      db.prepare(`
        INSERT INTO wallet_transactions (user_id, type, amount, balance_after, description, related_id)
        VALUES (?, 'fuel_pay', ?, ?, '加油支付', ?)
      `).run(userId, payAmount, newBalance, orderId);
    }

    db.prepare(`
      UPDATE fuel_orders SET 
        status = 'paid', 
        pay_type = ?, 
        pay_amount = ?,
        discount_amount = ?,
        paid_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(payType, payAmount, discountAmount, orderId);

    const pointsEarned = Math.floor(payAmount);
    db.prepare(`
      UPDATE users SET points = points + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(pointsEarned, userId);
  });

  try {
    tx();
    res.json({
      code: 200,
      message: '支付成功'
    });
  } catch (error) {
    res.json({
      code: 400,
      message: error.message
    });
  }
});

router.post('/set-payment-password', authMiddleware, (req, res) => {
  const db = req.db;
  const userId = req.user.userId;
  const { password, oldPassword } = req.body;

  if (!password || password.length !== 6) {
    return res.json({
      code: 400,
      message: '支付密码为6位数字'
    });
  }

  const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId);

  if (user.payment_password) {
    if (!oldPassword) {
      return res.json({
        code: 400,
        message: '请输入原支付密码'
      });
    }
    if (!bcrypt.compareSync(oldPassword, user.payment_password)) {
      return res.json({
        code: 400,
        message: '原支付密码错误'
      });
    }
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  db.prepare(`
    UPDATE users SET payment_password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(hashedPassword, userId);

  res.json({
    code: 200,
    message: '支付密码设置成功'
  });
});

router.post('/quick-fuel', authMiddleware, (req, res) => {
  const db = req.db;
  const userId = req.user.userId;
  const { stationId, fuelType, amount } = req.body;

  if (!stationId || !fuelType || !amount) {
    return res.json({
      code: 400,
      message: '参数错误'
    });
  }

  const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId);
  if (user.balance < parseFloat(amount)) {
    return res.json({
      code: 400,
      message: '余额不足，请先充值'
    });
  }

  const station = db.prepare(`SELECT * FROM gas_stations WHERE id = ?`).get(stationId);
  if (!station) {
    return res.json({
      code: 404,
      message: '油站不存在'
    });
  }

  const fuelPrices = {
    '92号汽油': 7.89,
    '95号汽油': 8.45,
    '98号汽油': 9.32,
    '0号柴油': 7.56
  };
  const fuelPrice = fuelPrices[fuelType] || 7.89;
  const fuelLiters = parseFloat(amount) / fuelPrice;

  const orderNo = 'QF' + Date.now().toString() + Math.random().toString(36).substr(2, 6).toUpperCase();

  const tx = db.transaction(() => {
    const payAmount = parseFloat(amount);
    const newBalance = user.balance - payAmount;

    db.prepare(`
      UPDATE users SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(newBalance, userId);

    db.prepare(`
      INSERT INTO wallet_transactions (user_id, type, amount, balance_after, description)
      VALUES (?, 'quick_fuel', ?, ?, '一键加油')
    `).run(userId, payAmount, newBalance);

    db.prepare(`
      INSERT INTO fuel_orders (order_no, user_id, station_id, station_name, fuel_type, fuel_price, fuel_liters, total_amount, pay_amount, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid')
    `).run(orderNo, userId, stationId, station.name, fuelType, fuelPrice, fuelLiters.toFixed(2), payAmount, payAmount);

    const pointsEarned = Math.floor(payAmount);
    db.prepare(`
      UPDATE users SET points = points + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(pointsEarned, userId);
  });

  try {
    tx();
    res.json({
      code: 200,
      message: '加油成功',
      data: {
        orderNo,
        fuelType,
        fuelLiters: (parseFloat(amount) / (fuelPrices[fuelType] || 7.89)).toFixed(2),
        amount: parseFloat(amount)
      }
    });
  } catch (error) {
    res.json({
      code: 400,
      message: '加油失败'
    });
  }
});

module.exports = router;
