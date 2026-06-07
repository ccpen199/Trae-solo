import { Router } from 'express';
import db from '../db.js';

const router = Router();

const parseSeats = (info) => { try { return JSON.parse(info); } catch { return []; } }

function generateOrderNo() {
  const now = new Date();
  const ts = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD${ts}${rand}`;
}

function calculateRefund(order, showtime) {
  const rule = showtime.refund_rule;
  const showDateTime = new Date(`${showtime.show_date}T${showtime.show_time}`);
  const now = new Date();
  const diffMs = showDateTime - now;
  const diffHours = diffMs / (1000 * 60 * 60);

  if (rule === 'none') return 0;
  if (rule === 'flexible') {
    if (diffHours > 24) return order.total_amount;
    if (diffHours > 2) return order.total_amount * 0.8;
    return 0;
  }
  if (rule === 'strict') {
    if (diffHours > 48) return order.total_amount * 0.5;
    return 0;
  }
  return 0;
}

router.get('/', (req, res) => {
  try {
    const { audience_id, status } = req.query;
    let sql = `SELECT o.*, m.title as movie_title, c.name as cinema_name, h.name as hall_name, s.show_date, s.show_time, s.refund_rule
               FROM orders o
               JOIN showtimes s ON o.showtime_id = s.id
               JOIN movies m ON s.movie_id = m.id
               JOIN cinemas c ON s.cinema_id = c.id
               JOIN halls h ON s.hall_id = h.id
               WHERE 1=1`;
    const params = [];
    if (audience_id) { sql += ' AND o.audience_id = ?'; params.push(audience_id); }
    if (status) { sql += ' AND o.status = ?'; params.push(status); }
    sql += ' ORDER BY o.created_at DESC';
    const rows = db.prepare(sql).all(...params);
    const orderIds = rows.map(r => r.id);
    const itemRows = orderIds.length > 0
      ? db.prepare("SELECT * FROM order_items WHERE order_id IN (" + orderIds.map(() => '?').join(',') + ") ORDER BY id").all(...orderIds)
      : [];
    const comboMap = {};
    const itemMap = {};
    for (const item of itemRows) {
      if (!itemMap[item.order_id]) itemMap[item.order_id] = [];
      itemMap[item.order_id].push(item);
      if (item.item_type === 'combo') {
        if (!comboMap[item.order_id]) comboMap[item.order_id] = [];
        comboMap[item.order_id].push(item.item_id);
      }
    }
    const cardIds = [...new Set(rows.map(r => r.pay_card_id).filter(Boolean))];
    const cards = cardIds.length > 0
      ? db.prepare("SELECT id, card_no FROM wallet_cards WHERE id IN (" + cardIds.map(() => '?').join(',') + ")").all(...cardIds)
      : [];
    const cardMap = {};
    for (const card of cards) {
      cardMap[card.id] = card.card_no.slice(-4);
    }
    const result = rows.map(row => ({
      ...row,
      seats: parseSeats(row.seat_info),
      card_last4: row.pay_card_id ? cardMap[row.pay_card_id] : null,
      card_last_4_digits: row.pay_card_id ? cardMap[row.pay_card_id] : null,
      combo_ids: comboMap[row.id] || [],
      ticket_items: itemMap[row.id] || []
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const order = db.prepare(`SELECT o.*, m.title as movie_title, c.name as cinema_name, h.name as hall_name, s.show_date, s.show_time, s.refund_rule
                              FROM orders o
                              JOIN showtimes s ON o.showtime_id = s.id
                              JOIN movies m ON s.movie_id = m.id
                              JOIN cinemas c ON s.cinema_id = c.id
                              JOIN halls h ON s.hall_id = h.id
                              WHERE o.id = ?`).get(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(req.params.id);
    let wallet_card = null;
    if (order.pay_card_id) {
      wallet_card = db.prepare('SELECT card_no, card_type, balance FROM wallet_cards WHERE id = ?').get(order.pay_card_id);
    }
    res.json({
      ...order,
      items,
      seats: parseSeats(order.seat_info),
      wallet_card
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { audience_id, showtime_id, seats, payment_method, pay_card_id, concession_items, channel, crowdfunding_id } = req.body;
    if (!audience_id || !showtime_id || !seats || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ error: 'audience_id, showtime_id, and seats array are required' });
    }

    const showtime = db.prepare('SELECT s.*, h.seat_rows, h.seat_cols FROM showtimes s JOIN halls h ON s.hall_id = h.id WHERE s.id = ?').get(showtime_id);
    if (!showtime) return res.status(404).json({ error: 'Showtime not found' });
    if (showtime.status !== 'open') return res.status(400).json({ error: 'Showtime not available' });

    if (seats.length < showtime.min_seats || seats.length > showtime.max_seats) {
      return res.status(400).json({ error: `Seat count must be between ${showtime.min_seats} and ${showtime.max_seats}` });
    }

    const order_no = generateOrderNo();
    const ticketTotal = seats.length * showtime.current_price;

    let concessionTotal = 0;
    const concessionItemRows = [];
    if (concession_items && Array.isArray(concession_items)) {
      for (const ci of concession_items) {
        const concession = db.prepare('SELECT * FROM concessions WHERE id = ?').get(ci.concession_id);
        if (concession) {
          const qty = ci.quantity || 1;
          const subtotal = concession.price * qty;
          concessionTotal += subtotal;
          concessionItemRows.push({
            item_type: 'concession',
            item_id: concession.id,
            item_name: concession.name,
            quantity: qty,
            unit_price: concession.price,
            subtotal
          });
        }
      }
    }

    const totalAmount = ticketTotal + concessionTotal;

    const transaction = db.transaction(() => {
      for (const seat of seats) {
        const existing = db.prepare(
          "SELECT * FROM seats_lock WHERE showtime_id = ? AND row = ? AND col = ? AND status IN ('locked','sold')"
        ).get(showtime_id, seat.row, seat.col);
        if (existing) {
          throw new Error(`Seat (${seat.row},${seat.col}) is not available`);
        }
      }

      const orderResult = db.prepare(
        'INSERT INTO orders (order_no, audience_id, showtime_id, seat_info, total_amount, status, payment_method, pay_card_id, channel, verification_status, crowdfunding_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(order_no, audience_id, showtime_id, JSON.stringify(seats), totalAmount, 'pending', payment_method || null, pay_card_id || null, channel || 'official', 'not_verified', crowdfunding_id || null);

      const orderId = orderResult.lastInsertRowid;

      for (const seat of seats) {
        db.prepare(
          "INSERT INTO seats_lock (showtime_id, row, col, status, locked_by, locked_at, order_id) VALUES (?, ?, ?, ?, ?, datetime('now','localtime'), ?)"
        ).run(showtime_id, seat.row, seat.col, 'sold', audience_id, orderId);
      }

      for (const seat of seats) {
        db.prepare(
          'INSERT INTO order_items (order_id, item_type, item_id, item_name, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).run(orderId, 'ticket', showtime_id, `Ticket - Row ${seat.row} Col ${seat.col}`, 1, showtime.current_price, showtime.current_price);
      }

      for (const ci of concessionItemRows) {
        db.prepare(
          'INSERT INTO order_items (order_id, item_type, item_id, item_name, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).run(orderId, ci.item_type, ci.item_id, ci.item_name, ci.quantity, ci.unit_price, ci.subtotal);
      }

      const soldCount = db.prepare("SELECT COUNT(*) as count FROM seats_lock WHERE showtime_id = ? AND status = 'sold'").get(showtime_id);
      const totalSeats = showtime.seat_rows * showtime.seat_cols;
      if (soldCount.count >= totalSeats) {
        db.prepare("UPDATE showtimes SET status = 'sold_out', updated_at = datetime('now','localtime') WHERE id = ?").run(showtime_id);
      }

      return orderId;
    });

    const orderId = transaction();
    res.status(201).json({ id: orderId, order_no, total_amount: totalAmount });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/refund', (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'paid') return res.status(400).json({ error: 'Only paid orders can be refunded' });

    const showtime = db.prepare('SELECT * FROM showtimes WHERE id = ?').get(order.showtime_id);
    if (!showtime) return res.status(404).json({ error: 'Showtime not found' });

    const refundAmount = calculateRefund(order, showtime);

    if (refundAmount === 0) {
      return res.status(400).json({ error: 'Refund not allowed under current rules', refund_amount: 0 });
    }

    const transaction = db.transaction(() => {
      db.prepare("UPDATE orders SET status = 'refunded', updated_at = datetime('now','localtime') WHERE id = ?").run(order.id);

      const seatInfo = JSON.parse(order.seat_info);
      for (const seat of seatInfo) {
        db.prepare('DELETE FROM seats_lock WHERE showtime_id = ? AND row = ? AND col = ? AND order_id = ?')
          .run(order.showtime_id, seat.row, seat.col, order.id);
      }

      db.prepare("UPDATE showtimes SET status = 'open', updated_at = datetime('now','localtime') WHERE id = ? AND status = 'sold_out'")
        .run(order.showtime_id);

      if (order.pay_card_id) {
        const card = db.prepare('SELECT * FROM wallet_cards WHERE id = ?').get(order.pay_card_id);
        if (card) {
          const newBalance = card.balance + refundAmount;
          db.prepare("UPDATE wallet_cards SET balance = ?, updated_at = datetime('now','localtime') WHERE id = ?")
            .run(newBalance, card.id);
          db.prepare(
            'INSERT INTO wallet_transactions (card_id, type, amount, balance_after, order_id, remark) VALUES (?, ?, ?, ?, ?, ?)'
          ).run(card.id, 'refund', refundAmount, newBalance, order.id, `Refund for order ${order.order_no}`);
        }
      }
    });

    transaction();

    res.json({
      order_id: order.id,
      order_no: order.order_no,
      refund_amount: refundAmount,
      rule: showtime.refund_rule
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
