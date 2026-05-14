const express = require('express');
const dayjs = require('dayjs');
const { db } = require('../database');
const { authMiddleware, verifyMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/create', authMiddleware, verifyMiddleware, (req, res) => {
  try {
    const { appliance_id, start_date, end_date, payment_method = 'one_time' } = req.body;

    if (!appliance_id || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    const start = dayjs(start_date);
    const end = dayjs(end_date);
    
    if (!start.isValid() || !end.isValid()) {
      return res.status(400).json({
        success: false,
        message: '日期格式不正确'
      });
    }

    if (end.isBefore(start)) {
      return res.status(400).json({
        success: false,
        message: '结束日期不能早于开始日期'
      });
    }

    if (start.isBefore(dayjs().startOf('day'))) {
      return res.status(400).json({
        success: false,
        message: '开始日期不能早于今天'
      });
    }

    const appliance = db.prepare('SELECT * FROM appliances WHERE id = ?').get(appliance_id);
    if (!appliance) {
      return res.status(404).json({
        success: false,
        message: '商品不存在'
      });
    }

    if (appliance.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: '该商品暂时不可租借'
      });
    }

    const days = end.diff(start, 'day') + 1;
    const totalRent = days * appliance.daily_rent;
    const totalAmount = totalRent + appliance.deposit;

    const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
    if (user.balance < totalAmount) {
      return res.status(400).json({
        success: false,
        message: `余额不足，需要 ${totalAmount} 元，请先充值`
      });
    }

    const insertRental = db.transaction(() => {
      db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(totalAmount, req.user.id);
      
      const result = db.prepare(`
        INSERT INTO rentals (user_id, appliance_id, start_date, end_date, daily_rent, deposit, total_amount, payment_method, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(req.user.id, appliance_id, start_date, end_date, appliance.daily_rent, appliance.deposit, totalAmount, payment_method, 'active');

      db.prepare("UPDATE appliances SET status = 'rented' WHERE id = ?").run(appliance_id);

      return result.lastInsertRowid;
    });

    const rentalId = insertRental();

    const rental = db.prepare(`
      SELECT r.*, a.name as appliance_name, a.images as appliance_images
      FROM rentals r
      INNER JOIN appliances a ON r.appliance_id = a.id
      WHERE r.id = ?
    `).get(rentalId);

    res.json({
      success: true,
      data: {
        ...rental,
        appliance_images: rental.appliance_images ? JSON.parse(rental.appliance_images) : []
      },
      message: '租借成功'
    });
  } catch (error) {
    console.error('Create rental error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

router.get('/list', authMiddleware, (req, res) => {
  try {
    const { status, page = 1, page_size = 10 } = req.query;

    let sql = `
      SELECT r.*, a.name as appliance_name, a.images as appliance_images
      FROM rentals r
      INNER JOIN appliances a ON r.appliance_id = a.id
      WHERE r.user_id = ?
    `;
    const params = [req.user.id];

    if (status) {
      sql += ' AND r.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY r.created_at DESC';

    const countSql = sql.replace('SELECT r.*, a.name as appliance_name, a.images as appliance_images', 'SELECT COUNT(*) as count');
    const total = db.prepare(countSql).get(...params).count;

    const offset = (page - 1) * page_size;
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(page_size), offset);

    const rentals = db.prepare(sql).all(...params);

    const today = dayjs().startOf('day');
    const result = rentals.map(rental => {
      const startDate = dayjs(rental.start_date);
      const endDate = dayjs(rental.end_date);
      const remainingDays = endDate.diff(today, 'day') + 1;

      return {
        ...rental,
        appliance_images: rental.appliance_images ? JSON.parse(rental.appliance_images) : [],
        remaining_days: remainingDays > 0 ? remainingDays : 0
      };
    });

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
    console.error('Get rentals error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

router.get('/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;

    const rental = db.prepare(`
      SELECT r.*, a.name as appliance_name, a.images as appliance_images, a.location, a.daily_rent
      FROM rentals r
      INNER JOIN appliances a ON r.appliance_id = a.id
      WHERE r.id = ? AND r.user_id = ?
    `).get(id, req.user.id);

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: '租借记录不存在'
      });
    }

    const today = dayjs().startOf('day');
    const startDate = dayjs(rental.start_date);
    const endDate = dayjs(rental.end_date);
    const remainingDays = endDate.diff(today, 'day') + 1;
    const totalDays = endDate.diff(startDate, 'day') + 1;

    res.json({
      success: true,
      data: {
        ...rental,
        appliance_images: rental.appliance_images ? JSON.parse(rental.appliance_images) : [],
        remaining_days: remainingDays > 0 ? remainingDays : 0,
        total_days: totalDays
      },
      message: '获取成功'
    });
  } catch (error) {
    console.error('Get rental detail error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

router.post('/renew/:id', authMiddleware, verifyMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { extend_days, payment_method = 'one_time' } = req.body;

    if (!extend_days || extend_days <= 0) {
      return res.status(400).json({
        success: false,
        message: '请选择续租天数'
      });
    }

    const rental = db.prepare('SELECT * FROM rentals WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!rental) {
      return res.status(404).json({
        success: false,
        message: '租借记录不存在'
      });
    }

    if (rental.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: '该订单不可续租'
      });
    }

    const newEndDate = dayjs(rental.end_date).add(extend_days, 'day').format('YYYY-MM-DD');
    const renewAmount = extend_days * rental.daily_rent;

    const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
    if (user.balance < renewAmount) {
      return res.status(400).json({
        success: false,
        message: `余额不足，需要 ${renewAmount} 元，请先充值`
      });
    }

    const renewRental = db.transaction(() => {
      db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(renewAmount, req.user.id);
      
      db.prepare(`
        UPDATE rentals 
        SET end_date = ?, total_amount = total_amount + ?, payment_method = ?
        WHERE id = ?
      `).run(newEndDate, renewAmount, payment_method, id);
    });

    renewRental();

    const updatedRental = db.prepare('SELECT * FROM rentals WHERE id = ?').get(id);

    res.json({
      success: true,
      data: updatedRental,
      message: '续租成功'
    });
  } catch (error) {
    console.error('Renew rental error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

router.post('/return/:id', authMiddleware, verifyMiddleware, (req, res) => {
  try {
    const { id } = req.params;

    const rental = db.prepare('SELECT * FROM rentals WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!rental) {
      return res.status(404).json({
        success: false,
        message: '租借记录不存在'
      });
    }

    if (rental.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: '该订单不可退租'
      });
    }

    const today = dayjs().startOf('day');
    const endDate = dayjs(rental.end_date).startOf('day');
    const startDate = dayjs(rental.start_date).startOf('day');
    const totalDays = endDate.diff(startDate, 'day') + 1;
    const actualDays = Math.max(1, Math.min(today.diff(startDate, 'day') + 1, totalDays));

    const totalRent = totalDays * rental.daily_rent;
    const usedRent = actualDays * rental.daily_rent;
    const remainingRent = totalRent - usedRent;

    let penalty = 0;
    let refundAmount = remainingRent + rental.deposit;

    if (today.isBefore(endDate)) {
      const remainingDays = endDate.diff(today, 'day');
      penalty = Math.min(remainingDays * rental.daily_rent * 0.3, rental.deposit * 0.5);
      refundAmount = remainingRent + (rental.deposit - penalty);
    }

    const returnRental = db.transaction(() => {
      db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(refundAmount, req.user.id);
      db.prepare("UPDATE rentals SET status = 'completed' WHERE id = ?").run(id);
      db.prepare("UPDATE appliances SET status = 'available' WHERE id = ?").run(rental.appliance_id);
    });

    returnRental();

    res.json({
      success: true,
      data: {
        total_refund: refundAmount,
        rent_refund: remainingRent,
        deposit_refund: rental.deposit - penalty,
        penalty: penalty,
        actual_days: actualDays,
        total_days: totalDays,
        used_rent: usedRent,
        total_rent: totalRent
      },
      message: '退租成功'
    });
  } catch (error) {
    console.error('Return rental error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

router.post('/sublet/create', authMiddleware, verifyMiddleware, (req, res) => {
  try {
    const { rental_id, start_date, end_date, price, description, images } = req.body;

    if (!rental_id || !start_date || !end_date || !price) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    const rental = db.prepare('SELECT * FROM rentals WHERE id = ? AND user_id = ?').get(rental_id, req.user.id);
    if (!rental) {
      return res.status(404).json({
        success: false,
        message: '租借记录不存在'
      });
    }

    if (rental.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: '该订单不可转租'
      });
    }

    const start = dayjs(start_date);
    const end = dayjs(end_date);
    const rentalEnd = dayjs(rental.end_date);

    if (start.isAfter(rentalEnd) || end.isAfter(rentalEnd)) {
      return res.status(400).json({
        success: false,
        message: '转租日期不能超过原租借结束日期'
      });
    }

    if (start.isBefore(dayjs().startOf('day'))) {
      return res.status(400).json({
        success: false,
        message: '开始日期不能早于今天'
      });
    }

    const result = db.prepare(`
      INSERT INTO sublets (original_rental_id, appliance_id, from_user_id, start_date, end_date, price, description, images, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'available')
    `).run(rental_id, rental.appliance_id, req.user.id, start_date, end_date, price, description || '', images ? JSON.stringify(images) : null);

    res.json({
      success: true,
      data: { id: result.lastInsertRowid },
      message: '转租信息发布成功'
    });
  } catch (error) {
    console.error('Create sublet error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

router.get('/sublet/list', authMiddleware, (req, res) => {
  try {
    const { page = 1, page_size = 10 } = req.query;

    const countSql = `
      SELECT COUNT(*) as count
      FROM sublets s
      WHERE s.from_user_id = ?
    `;
    const total = db.prepare(countSql).get(req.user.id).count;

    const offset = (page - 1) * page_size;
    const sql = `
      SELECT s.*, a.name as appliance_name, a.images as appliance_images
      FROM sublets s
      INNER JOIN appliances a ON s.appliance_id = a.id
      WHERE s.from_user_id = ?
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const sublets = db.prepare(sql).all(req.user.id, parseInt(page_size), offset);

    const result = sublets.map(item => ({
      ...item,
      appliance_images: item.appliance_images ? JSON.parse(item.appliance_images) : [],
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
    console.error('Get sublets error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

module.exports = router;
