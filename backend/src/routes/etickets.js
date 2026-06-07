const express = require('express');
const { db } = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/my', authenticateToken, (req, res) => {
  const userId = req.user.id;
  
  db.all(`
    SELECT et.*, e.title, e.venue, e.start_time
    FROM etickets et
    JOIN events e ON et.event_id = e.id
    WHERE et.user_id = ?
    ORDER BY et.created_at DESC
  `, [userId], (err, tickets) => {
    if (err) {
      return res.status(500).json({ error: '查询失败' });
    }
    res.json({ tickets });
  });
});

router.get('/:ticketNo', authenticateToken, (req, res) => {
  const { ticketNo } = req.params;
  const userId = req.user.id;

  db.get(`
    SELECT et.*, e.title, e.venue, e.start_time, o.contact_name, o.contact_phone
    FROM etickets et
    JOIN events e ON et.event_id = e.id
    JOIN orders o ON et.order_id = o.id
    WHERE et.ticket_no = ? AND et.user_id = ?
  `, [ticketNo, userId], (err, ticket) => {
    if (err) {
      return res.status(500).json({ error: '查询失败' });
    }
    if (!ticket) {
      return res.status(404).json({ error: '电子票不存在' });
    }
    res.json({ ticket });
  });
});

router.post('/verify', authenticateToken, requireAdmin, (req, res) => {
  const { ticketNo, gate } = req.body;

  db.get('SELECT * FROM etickets WHERE ticket_no = ?', [ticketNo], (err, ticket) => {
    if (err) {
      return res.status(500).json({ error: '查询失败' });
    }
    if (!ticket) {
      return res.status(404).json({ error: '电子票不存在', valid: false });
    }
    if (ticket.status === 'used') {
      return res.status(400).json({ error: '电子票已使用', valid: false, usedAt: ticket.checked_at });
    }

    db.run(
      'UPDATE etickets SET status = "used", checked_at = ?, checked_gate = ? WHERE ticket_no = ?',
      [new Date().toISOString(), gate, ticketNo],
      function(err) {
        if (err) {
          return res.status(500).json({ error: '核验失败' });
        }
        res.json({ valid: true, message: '核验成功' });
      }
    );
  });
});

module.exports = router;
