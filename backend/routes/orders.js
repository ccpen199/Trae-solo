const express = require('express');
const db = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/from-requirement/:requirementId', authenticateToken, (req, res) => {
  db.get(
    'SELECT * FROM service_requirements WHERE id = ? AND status = "matched"',
    [req.params.requirementId],
    (err, requirement) => {
      if (!requirement) {
        return res.status(404).json({ error: '需求不存在或未匹配' });
      }

      const totalAmount = requirement.budget_fixed || (requirement.budget_min + requirement.budget_max) / 2 || 0;
      const depositAmount = totalAmount * 0.3;

      db.run(
        `INSERT INTO orders 
         (requirement_id, client_id, provider_id, title, description, 
          total_amount, deposit_amount, service_address, service_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          requirement.id, requirement.client_id, requirement.matched_provider_id,
          requirement.title, requirement.description, totalAmount, depositAmount,
          requirement.location, requirement.service_date
        ],
        function(err) {
          if (err) {
            return res.status(500).json({ error: '创建订单失败' });
          }

          db.run(
            'UPDATE service_requirements SET status = "ordered" WHERE id = ?',
            [requirement.id],
            () => {
              res.json({ message: '订单创建成功', id: this.lastID });
            }
          );
        }
      );
    }
  );
});

router.get('/', authenticateToken, (req, res) => {
  const { status, role, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT o.*,
           (SELECT username FROM users WHERE id = o.client_id) as client_name,
           (SELECT username FROM users WHERE id = o.provider_id) as provider_name
    FROM orders o
    WHERE (o.client_id = ? OR o.provider_id = ?)
  `;
  const params = [req.user.id, req.user.id];

  if (status) {
    query += ' AND o.status = ?';
    params.push(status);
  }

  query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  db.all(query, params, (err, orders) => {
    res.json(orders || []);
  });
});

router.get('/:id', authenticateToken, (req, res) => {
  db.get(
    `SELECT o.*,
            (SELECT username FROM users WHERE id = o.client_id) as client_name,
            (SELECT avatar FROM users WHERE id = o.client_id) as client_avatar,
            (SELECT username FROM users WHERE id = o.provider_id) as provider_name,
            (SELECT avatar FROM users WHERE id = o.provider_id) as provider_avatar
     FROM orders o WHERE o.id = ?`,
    [req.params.id],
    (err, order) => {
      if (!order) {
        return res.status(404).json({ error: '订单不存在' });
      }

      if (order.client_id !== req.user.id && order.provider_id !== req.user.id) {
        return res.status(403).json({ error: '无权访问此订单' });
      }

      res.json(order);
    }
  );
});

router.post('/:id/confirm', authenticateToken, (req, res) => {
  db.run(
    `UPDATE orders SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND (client_id = ? OR provider_id = ?) AND status = 'pending_confirm'`,
    [req.params.id, req.user.id, req.user.id],
    function(err) {
      if (this.changes === 0) {
        return res.status(400).json({ error: '无法确认此订单' });
      }
      res.json({ message: '订单已确认' });
    }
  );
});

router.post('/:id/checkin', authenticateToken, (req, res) => {
  db.run(
    `UPDATE orders SET status = 'in_progress', checkin_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND provider_id = ? AND status = 'confirmed'`,
    [req.params.id, req.user.id],
    function(err) {
      if (this.changes === 0) {
        return res.status(400).json({ error: '无法打卡' });
      }
      res.json({ message: '打卡成功' });
    }
  );
});

router.post('/:id/deliver', authenticateToken, (req, res) => {
  const { delivery_files, delivery_note } = req.body;
  
  db.run(
    `UPDATE orders SET status = 'delivered', provider_delivered = 1, 
            delivery_files = ?, delivery_note = ?, checkout_time = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND provider_id = ? AND status = 'in_progress'`,
    [JSON.stringify(delivery_files || []), delivery_note || '', req.params.id, req.user.id],
    function(err) {
      if (this.changes === 0) {
        return res.status(400).json({ error: '无法提交交付' });
      }
      res.json({ message: '交付已提交' });
    }
  );
});

router.post('/:id/accept', authenticateToken, (req, res) => {
  db.run(
    `UPDATE orders SET status = 'completed', client_accepted = 1, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND client_id = ? AND status = 'delivered'`,
    [req.params.id, req.user.id],
    function(err) {
      if (this.changes === 0) {
        return res.status(400).json({ error: '无法验收此订单' });
      }

      db.get('SELECT * FROM orders WHERE id = ?', [req.params.id], (err, order) => {
        db.run(
          'UPDATE users SET balance = balance + ? WHERE id = ?',
          [order.total_amount, order.provider_id],
          () => {
            res.json({ message: '订单已完成' });
          }
        );
      });
    }
  );
});

router.post('/:id/review', authenticateToken, (req, res) => {
  const { rating, content, images, is_anonymous } = req.body;

  db.get('SELECT * FROM orders WHERE id = ?', [req.params.id], (err, order) => {
    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    const isClient = order.client_id === req.user.id;
    const revieweeId = isClient ? order.provider_id : order.client_id;

    if (!isClient && order.provider_id !== req.user.id) {
      return res.status(403).json({ error: '无权评价此订单' });
    }

    db.run(
      `INSERT INTO reviews (order_id, reviewer_id, reviewee_id, rating, content, images, is_anonymous)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.params.id, req.user.id, revieweeId, rating, content || '', 
       JSON.stringify(images || []), is_anonymous ? 1 : 0],
      function(err) {
        db.get(
          'SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE reviewee_id = ?',
          [revieweeId],
          (err, result) => {
            db.run(
              'UPDATE users SET rating = ?, rating_count = ? WHERE id = ?',
              [result.avg_rating || 5, result.count || 0, revieweeId],
              () => {
                res.json({ message: '评价成功' });
              }
            );
          }
        );
      }
    );
  });
});

router.post('/:id/dispute', authenticateToken, (req, res) => {
  const { reason, description, evidence } = req.body;

  db.get('SELECT * FROM orders WHERE id = ?', [req.params.id], (err, order) => {
    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    const respondentId = order.client_id === req.user.id ? order.provider_id : order.client_id;

    db.run(
      `INSERT INTO disputes (order_id, complainant_id, respondent_id, reason, description, evidence, frozen_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.params.id, req.user.id, respondentId, reason, description || '', 
       JSON.stringify(evidence || []), order.total_amount],
      function(err) {
        db.run(
          `UPDATE orders SET status = 'disputed', dispute_id = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [this.lastID, req.params.id],
          () => {
            res.json({ message: '纠纷已提交', id: this.lastID });
          }
        );
      }
    );
  });
});

module.exports = router;
