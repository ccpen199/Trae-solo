const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { query, queryOne, execute } = require('../database');

function generateOrderNo() {
  const date = new Date();
  const timestamp = date.getTime().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `MO${timestamp}${random}`;
}

function generateTicketCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ code: 1, message: '请先登录' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'movie-ticket-secret-key-2024');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ code: 1, message: '登录已过期' });
  }
}

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { schedule_id, seats } = req.body;
    const user_id = req.user.id;
    
    if (!schedule_id || !seats || seats.length === 0) {
      return res.status(400).json({ code: 1, message: '参数不完整' });
    }
    
    const schedule = await queryOne('SELECT * FROM schedules WHERE id = ?', [schedule_id]);
    if (!schedule) {
      return res.status(404).json({ code: 1, message: '场次不存在' });
    }
    
    const seatIds = seats.map(s => s.id).join(',');
    const existingOrders = await query(
      `SELECT seats FROM orders WHERE schedule_id = ? AND status != 2`,
      [schedule_id]
    );
    
    for (const order of existingOrders) {
      const orderSeats = JSON.parse(order.seats || '[]');
      for (const os of orderSeats) {
        if (seats.some(s => s.id === os.id)) {
          return res.status(400).json({ code: 1, message: '部分座位已售出' });
        }
      }
    }
    
    const total_amount = (schedule.price * seats.length).toFixed(2);
    const order_no = generateOrderNo();
    
    const result = await execute(
      `INSERT INTO orders (order_no, user_id, schedule_id, seats, seats_count, total_amount, status) 
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [order_no, user_id, schedule_id, JSON.stringify(seats), seats.length, total_amount]
    );
    
    const order = await queryOne('SELECT * FROM orders WHERE id = ?', [result.lastID]);
    res.json({ code: 0, data: order, message: '订单创建成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 1, message: '服务器错误' });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const user_id = req.user.id;
    const { status, page = 1, size = 20 } = req.query;
    
    let sql = `
      SELECT o.*,
        m.title as movie_title, m.poster as movie_poster,
        c.name as cinema_name,
        s.start_time, s.end_time, s.price
      FROM orders o
      LEFT JOIN schedules s ON o.schedule_id = s.id
      LEFT JOIN movies m ON s.movie_id = m.id
      LEFT JOIN cinemas c ON s.cinema_id = c.id
      WHERE o.user_id = ?
    `;
    let countSql = `SELECT COUNT(*) as total FROM orders WHERE user_id = ?`;
    let params = [user_id];
    
    if (status !== undefined && status !== '') {
      sql += ' AND o.status = ?';
      countSql += ' AND status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    const offset = (page - 1) * size;
    params.push(parseInt(size), offset);
    
    const orders = await query(sql, params);
    const countResult = await queryOne(countSql, [user_id]);
    
    orders.forEach(order => {
      order.seats = JSON.parse(order.seats || '[]');
    });
    
    res.json({ 
      code: 0, 
      data: { 
        list: orders, 
        total: countResult.total,
        page: parseInt(page),
        size: parseInt(size)
      }, 
      message: 'success' 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 1, message: '服务器错误' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    
    const order = await queryOne(`
      SELECT o.*,
        m.title as movie_title, m.poster as movie_poster, m.duration,
        c.name as cinema_name, c.address,
        h.name as hall_name,
        s.start_time, s.end_time, s.price
      FROM orders o
      LEFT JOIN schedules s ON o.schedule_id = s.id
      LEFT JOIN movies m ON s.movie_id = m.id
      LEFT JOIN cinemas c ON s.cinema_id = c.id
      LEFT JOIN halls h ON s.hall_id = h.id
      WHERE o.id = ? AND o.user_id = ?
    `, [id, user_id]);
    
    if (!order) {
      return res.status(404).json({ code: 1, message: '订单不存在' });
    }
    
    order.seats = JSON.parse(order.seats || '[]');
    res.json({ code: 0, data: order, message: 'success' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 1, message: '服务器错误' });
  }
});

router.post('/:id/pay', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    
    const order = await queryOne('SELECT * FROM orders WHERE id = ? AND user_id = ?', [id, user_id]);
    if (!order) {
      return res.status(404).json({ code: 1, message: '订单不存在' });
    }
    
    if (order.status !== 0) {
      return res.status(400).json({ code: 1, message: '订单状态不正确' });
    }
    
    const ticket_code = generateTicketCode();
    await execute(
      `UPDATE orders SET status = 1, pay_time = CURRENT_TIMESTAMP, ticket_code = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [ticket_code, id]
    );
    
    const updatedOrder = await queryOne('SELECT * FROM orders WHERE id = ?', [id]);
    updatedOrder.seats = JSON.parse(updatedOrder.seats || '[]');
    
    res.json({ code: 0, data: updatedOrder, message: '支付成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 1, message: '服务器错误' });
  }
});

router.post('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    
    const order = await queryOne('SELECT * FROM orders WHERE id = ? AND user_id = ?', [id, user_id]);
    if (!order) {
      return res.status(404).json({ code: 1, message: '订单不存在' });
    }
    
    if (order.status === 2) {
      return res.status(400).json({ code: 1, message: '订单已取消' });
    }
    
    await execute(
      `UPDATE orders SET status = 2, cancel_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [id]
    );
    
    res.json({ code: 0, message: '取消成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 1, message: '服务器错误' });
  }
});

module.exports = router;
