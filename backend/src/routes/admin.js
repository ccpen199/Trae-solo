const express = require('express');
const { db } = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', authenticateToken, requireAdmin, (req, res) => {
  db.get('SELECT COUNT(*) as total_events FROM events', (err, eventsData) => {
    db.get('SELECT COUNT(*) as total_orders FROM orders WHERE status = "paid"', (err, ordersData) => {
      db.get('SELECT COUNT(*) as total_users FROM users', (err, usersData) => {
        db.get('SELECT SUM(pay_amount) as total_revenue FROM orders WHERE status = "paid"', (err, revenueData) => {
          db.all(`
            SELECT DATE(created_at) as date, COUNT(*) as count, SUM(pay_amount) as amount
            FROM orders
            WHERE status = "paid" AND created_at >= datetime('now', '-7 days')
            GROUP BY DATE(created_at)
            ORDER BY date DESC
          `, (err, salesData) => {
            db.all(`
              SELECT e.id, e.title, COUNT(o.id) as ticket_count
              FROM events e
              LEFT JOIN orders o ON e.id = o.event_id AND o.status = 'paid'
              GROUP BY e.id
              ORDER BY ticket_count DESC
              LIMIT 10
            `, (err, topEvents) => {
              res.json({
                totalEvents: eventsData.total_events,
                totalOrders: ordersData.total_orders,
                totalUsers: usersData.total_users,
                totalRevenue: revenueData.total_revenue || 0,
                salesData: salesData || [],
                topEvents: topEvents || []
              });
            });
          });
        });
      });
    });
  });
});

router.get('/sales', authenticateToken, requireAdmin, (req, res) => {
  const { eventId, startDate, endDate } = req.query;

  let query = `
    SELECT o.*, e.title, u.username
    FROM orders o
    JOIN events e ON o.event_id = e.id
    JOIN users u ON o.user_id = u.id
    WHERE o.status = 'paid'
  `;
  const params = [];

  if (eventId) {
    query += ' AND o.event_id = ?';
    params.push(eventId);
  }

  if (startDate) {
    query += ' AND o.paid_at >= ?';
    params.push(startDate);
  }

  if (endDate) {
    query += ' AND o.paid_at <= ?';
    params.push(endDate);
  }

  query += ' ORDER BY o.paid_at DESC';

  db.all(query, params, (err, orders) => {
    if (err) {
      return res.status(500).json({ error: '查询失败' });
    }
    res.json({ orders });
  });
});

router.get('/agents', authenticateToken, requireAdmin, (req, res) => {
  db.all('SELECT * FROM agents ORDER BY created_at DESC', (err, agents) => {
    if (err) {
      return res.status(500).json({ error: '查询失败' });
    }
    res.json({ agents });
  });
});

router.post('/agents', authenticateToken, requireAdmin, (req, res) => {
  const { name, contact, phone, commissionRate, settlementCycle } = req.body;

  db.run(
    'INSERT INTO agents (name, contact, phone, commission_rate, settlement_cycle) VALUES (?, ?, ?, ?, ?)',
    [name, contact, phone, commissionRate || 10, settlementCycle || 7],
    function(err) {
      if (err) {
        return res.status(500).json({ error: '创建失败' });
      }
      res.status(201).json({ id: this.lastID, message: '创建成功' });
    }
  );
});

router.get('/settlements', authenticateToken, requireAdmin, (req, res) => {
  db.all(`
    SELECT s.*, a.name as agent_name
    FROM settlements s
    LEFT JOIN agents a ON s.agent_id = a.id
    ORDER BY s.created_at DESC
  `, (err, settlements) => {
    if (err) {
      return res.status(500).json({ error: '查询失败' });
    }
    res.json({ settlements });
  });
});

router.post('/settlements/generate', authenticateToken, requireAdmin, (req, res) => {
  const { eventId, agentId } = req.body;

  db.all(`
    SELECT COUNT(*) as order_count, SUM(pay_amount) as total_amount
    FROM orders
    WHERE status = 'paid' AND event_id = ?
  `, [eventId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: '统计失败' });
    }

    const { order_count, total_amount } = result[0];
    
    db.get('SELECT commission_rate FROM agents WHERE id = ?', [agentId], (err, agent) => {
      const commissionRate = agent ? agent.commission_rate : 10;
      const commissionAmount = total_amount * (commissionRate / 100);
      const settlementAmount = total_amount - commissionAmount;
      const settlementNo = `STL${Date.now()}`;

      db.run(
        `INSERT INTO settlements 
         (settlement_no, agent_id, event_id, order_count, total_amount, commission_amount, settlement_amount, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [settlementNo, agentId, eventId, order_count, total_amount, commissionAmount, settlementAmount],
        function(err) {
          if (err) {
            return res.status(500).json({ error: '生成失败' });
          }
          res.status(201).json({ id: this.lastID, settlementNo, message: '生成成功' });
        }
      );
    });
  });
});

module.exports = router;
