const express = require('express');
const crypto = require('crypto');
const qrcode = require('qrcode');
const { db } = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

function generateOrderNo() {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TK${timestamp}${random}`;
}

function generateTicketNo() {
  return `ET${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
}

router.post('/', authenticateToken, async (req, res) => {
  const { eventId, seatIds, contactName, contactPhone, idCard, strategyId } = req.body;
  const userId = req.user.id;
  const orderNo = generateOrderNo();

  db.serialize(() => {
    const placeholders = seatIds.map(() => '?').join(',');
    
    db.all(`
      SELECT s.id, s.row, s.seat_number, s.area, s.price_tier, s.status, s.locked_by,
             ps.base_price, ps.id as strategy_id
      FROM seats s
      JOIN seat_maps sm ON s.seat_map_id = sm.id
      JOIN price_strategies ps ON sm.event_id = ps.event_id
      WHERE s.id IN (${placeholders}) AND sm.event_id = ?
    `, [...seatIds, eventId], (err, seats) => {
      if (err) {
        return res.status(500).json({ error: '查询座位失败' });
      }

      const invalidSeats = seats.filter(s => s.status === 'sold');
      if (invalidSeats.length > 0) {
        return res.status(400).json({ error: '部分座位已售出' });
      }

      const lockedByOthers = seats.filter(s => s.status === 'locked' && s.locked_by !== userId);
      if (lockedByOthers.length > 0) {
        return res.status(400).json({ error: '部分座位已被他人锁定' });
      }

      const totalAmount = seats.reduce((sum, s) => sum + s.base_price, 0);

      db.run(
        `INSERT INTO orders (order_no, user_id, event_id, total_amount, pay_amount, contact_name, contact_phone, id_card, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [orderNo, userId, eventId, totalAmount, totalAmount, contactName, contactPhone, idCard],
        function(err) {
          if (err) {
            return res.status(500).json({ error: '创建订单失败' });
          }

          const orderId = this.lastID;
          const orderItemStmt = db.prepare('INSERT INTO order_items (order_id, seat_id, seat_info, price, original_price, strategy_id) VALUES (?, ?, ?, ?, ?, ?)');
          const seatUpdateStmt = db.prepare('UPDATE seats SET status = "sold", order_id = ? WHERE id = ?');

          Promise.all(seats.map(async (seat) => {
            const seatInfo = JSON.stringify({ row: seat.row, number: seat.seat_number, area: seat.area, tier: seat.price_tier });
            orderItemStmt.run([orderId, seat.id, seatInfo, seat.base_price, seat.base_price, strategyId || null]);
            seatUpdateStmt.run([orderId, seat.id]);

            const ticketNo = generateTicketNo();
            const encryptedData = crypto.createHash('sha256').update(`${ticketNo}-${orderId}-${seat.id}-${Date.now()}`).digest('hex');
            const qrData = `ticket://${ticketNo}?data=${encryptedData}`;
            const qrCode = await qrcode.toDataURL(qrData);

            return new Promise((resolve, reject) => {
              db.run(
                `INSERT INTO etickets (ticket_no, order_id, order_item_id, user_id, event_id, seat_info, qr_code, encrypted_data, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'unused')`,
                [ticketNo, orderId, null, userId, eventId, seatInfo, qrCode, encryptedData],
                (err) => err ? reject(err) : resolve()
              );
            });
          })).then(() => {
            res.status(201).json({ orderId, orderNo, message: '订单创建成功' });
          }).catch((err) => {
            res.status(500).json({ error: '生成电子票失败' });
          });
        }
      );
    });
  });
});

router.post('/:orderId/pay', authenticateToken, (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.id;

  db.get('SELECT * FROM orders WHERE id = ? AND user_id = ?', [orderId, userId], (err, order) => {
    if (err) {
      return res.status(500).json({ error: '查询失败' });
    }
    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }
    if (order.status !== 'pending') {
      return res.status(400).json({ error: '订单状态不正确' });
    }

    db.run(
      'UPDATE orders SET status = "paid", paid_at = ?, payment_method = "online" WHERE id = ?',
      [new Date().toISOString(), orderId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: '支付失败' });
        }
        res.json({ message: '支付成功' });
      }
    );
  });
});

router.get('/', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { status, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  let query = 'SELECT o.*, e.title, e.venue, e.start_time FROM orders o JOIN events e ON o.event_id = e.id WHERE o.user_id = ?';
  const params = [userId];

  if (status && status !== 'all') {
    query += ' AND o.status = ?';
    params.push(status);
  }

  query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  db.all(query, params, (err, orders) => {
    if (err) {
      return res.status(500).json({ error: '查询失败' });
    }
    res.json({ orders });
  });
});

router.get('/:orderId', authenticateToken, (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.id;

  db.get('SELECT * FROM orders WHERE id = ? AND user_id = ?', [orderId, userId], (err, order) => {
    if (err) {
      return res.status(500).json({ error: '查询失败' });
    }
    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    db.all('SELECT * FROM order_items WHERE order_id = ?', [orderId], (err, items) => {
      db.all('SELECT * FROM etickets WHERE order_id = ?', [orderId], (err, tickets) => {
        res.json({ order, items, tickets });
      });
    });
  });
});

router.post('/:orderId/refund', authenticateToken, (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.id;

  db.get('SELECT * FROM orders WHERE id = ? AND user_id = ?', [orderId, userId], (err, order) => {
    if (err) return res.status(500).json({ error: '查询失败' });
    if (!order) return res.status(404).json({ error: '订单不存在' });
    if (order.status !== 'paid') return res.status(400).json({ error: '订单不可退款' });

    db.get('SELECT start_time FROM events WHERE id = ?', [order.event_id], (err, event) => {
      const now = new Date();
      const eventTime = new Date(event.start_time);
      const hoursDiff = (eventTime - now) / (1000 * 60 * 60);

      let refundRate = 0;
      let refundStatus = 'none';

      if (hoursDiff >= 48) {
        refundRate = 0.9;
        refundStatus = 'full';
      } else if (hoursDiff >= 24) {
        refundRate = 0.7;
        refundStatus = 'partial';
      } else if (hoursDiff >= 6) {
        refundRate = 0.5;
        refundStatus = 'partial';
      } else {
        return res.status(400).json({ error: '距开场不足6小时，不可退款' });
      }

      const refundAmount = order.pay_amount * refundRate;

      db.run(
        'UPDATE orders SET refund_status = ?, refund_amount = ?, refunded_at = ?, status = "refunded" WHERE id = ?',
        [refundStatus, refundAmount.toFixed(2), new Date().toISOString(), orderId],
        function(err) {
          if (err) return res.status(500).json({ error: '退款申请失败' });
          res.json({ message: '退款成功', refundAmount, refundRate });
        }
      );
    });
  });
});

module.exports = router;
