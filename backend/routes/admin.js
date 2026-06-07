const express = require('express');
const db = require('../database/init');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', authenticateToken, requireRole(['admin']), (req, res) => {
  db.get('SELECT COUNT(*) as total_users FROM users', (err, usersData) => {
    db.get('SELECT COUNT(*) as total_providers FROM users WHERE role = "provider"', (err, providersData) => {
      db.get('SELECT COUNT(*) as total_requirements FROM service_requirements', (err, reqData) => {
        db.get('SELECT COUNT(*) as total_orders FROM orders', (err, ordersData) => {
          db.get('SELECT COUNT(*) as completed_orders FROM orders WHERE status = "completed"', (err, completedData) => {
            db.get('SELECT SUM(total_amount) as total_revenue FROM orders WHERE status = "completed"', (err, revenueData) => {
              db.all(
                `SELECT st.category, COUNT(*) as count 
                 FROM service_requirements sr
                 JOIN skill_tags st ON sr.category = st.category
                 GROUP BY st.category ORDER BY count DESC LIMIT 10`,
                (err, categoryData) => {
                  db.all(
                    `SELECT DATE(created_at) as date, COUNT(*) as count
                     FROM orders WHERE created_at >= DATE('now', '-30 days')
                     GROUP BY DATE(created_at) ORDER BY date`,
                    (err, trendData) => {
                      res.json({
                        total_users: usersData.total_users,
                        total_providers: providersData.total_providers,
                        total_requirements: reqData.total_requirements,
                        total_orders: ordersData.total_orders,
                        completed_orders: completedData.completed_orders,
                        total_revenue: revenueData.total_revenue || 0,
                        category_distribution: categoryData || [],
                        order_trend: trendData || []
                      });
                    }
                  );
                }
              );
            });
          });
        });
      });
    });
  });
});

router.get('/users', authenticateToken, requireRole(['admin']), (req, res) => {
  const { role, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let query = 'SELECT id, username, email, role, phone, is_verified, rating, credit_score, created_at FROM users';
  const params = [];

  if (role) {
    query += ' WHERE role = ?';
    params.push(role);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  db.all(query, params, (err, users) => {
    res.json(users || []);
  });
});

router.put('/users/:id/verify', authenticateToken, requireRole(['admin']), (req, res) => {
  db.run(
    'UPDATE users SET is_verified = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: '认证失败' });
      }
      res.json({ message: '认证成功' });
    }
  );
});

router.get('/disputes', authenticateToken, requireRole(['admin']), (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT d.*,
           (SELECT username FROM users WHERE id = d.complainant_id) as complainant_name,
           (SELECT username FROM users WHERE id = d.respondent_id) as respondent_name,
           o.title as order_title
    FROM disputes d
    JOIN orders o ON d.order_id = o.id
  `;
  const params = [];

  if (status) {
    query += ' WHERE d.status = ?';
    params.push(status);
  }

  query += ' ORDER BY d.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  db.all(query, params, (err, disputes) => {
    res.json(disputes || []);
  });
});

router.put('/disputes/:id/resolve', authenticateToken, requireRole(['admin']), (req, res) => {
  const { result, refund_amount } = req.body;

  db.run(
    `UPDATE disputes SET status = 'resolved', handler_id = ?, result = ?, resolved_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [req.user.id, result, req.params.id],
    function(err) {
      db.get('SELECT * FROM disputes WHERE id = ?', [req.params.id], (err, dispute) => {
        db.run(
          `UPDATE orders SET status = 'completed', updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [dispute.order_id],
          () => {
            res.json({ message: '纠纷已处理' });
          }
        );
      });
    }
  );
});

router.get('/portfolios/pending', authenticateToken, requireRole(['admin']), (req, res) => {
  db.all(
    `SELECT p.*, u.username as user_name
     FROM portfolios p
     JOIN users u ON p.user_id = u.id
     WHERE p.is_approved = 0
     ORDER BY p.created_at DESC`,
    (err, portfolios) => {
      res.json(portfolios || []);
    }
  );
});

router.put('/portfolios/:id/approve', authenticateToken, requireRole(['admin']), (req, res) => {
  db.run(
    'UPDATE portfolios SET is_approved = 1 WHERE id = ?',
    [req.params.id],
    function(err) {
      res.json({ message: '作品集已审核通过' });
    }
  );
});

router.get('/skills/trending', authenticateToken, requireRole(['admin']), (req, res) => {
  db.all(
    `SELECT st.name, st.category, COUNT(ps.id) as provider_count,
            (SELECT COUNT(*) FROM service_requirements sr 
             WHERE sr.skill_tags LIKE '%' || st.id || '%') as requirement_count
     FROM skill_tags st
     LEFT JOIN provider_skills ps ON st.id = ps.skill_tag_id
     WHERE st.is_active = 1
     GROUP BY st.id
     ORDER BY requirement_count DESC, provider_count DESC
     LIMIT 20`,
    (err, skills) => {
      res.json(skills || []);
    }
  );
});

router.get('/skill-trends', authenticateToken, requireRole(['admin']), (req, res) => {
  db.all(
    `SELECT st.name, st.category, COUNT(ps.id) as provider_count,
            (SELECT COUNT(*) FROM service_requirements sr 
             WHERE sr.skill_tags LIKE '%' || st.id || '%') as requirement_count
     FROM skill_tags st
     LEFT JOIN provider_skills ps ON st.id = ps.skill_tag_id
     WHERE st.is_active = 1
     GROUP BY st.id
     ORDER BY requirement_count DESC, provider_count DESC
     LIMIT 20`,
    (err, skills) => {
      res.json(skills || []);
    }
  );
});

router.post('/skills', authenticateToken, requireRole(['admin']), (req, res) => {
  const { name, category, description } = req.body;

  db.run(
    'INSERT INTO skill_tags (name, category, description) VALUES (?, ?, ?)',
    [name, category, description || ''],
    function(err) {
      if (err) {
        return res.status(500).json({ error: '添加技能失败' });
      }
      res.json({ message: '技能添加成功', id: this.lastID });
    }
  );
});

router.get('/fraud/detection', authenticateToken, requireRole(['admin']), (req, res) => {
  db.all(
    `SELECT o.*,
            c.username as client_name,
            p.username as provider_name,
            ABS(c.credit_score - p.credit_score) as score_diff,
            julianday(o.updated_at) - julianday(o.created_at) as completion_days
     FROM orders o
     JOIN users c ON o.client_id = c.id
     JOIN users p ON o.provider_id = p.id
     WHERE o.status = 'completed'
     AND (
       (julianday(o.updated_at) - julianday(o.created_at) < 0.01)
       OR (c.id = p.id)
       OR (o.total_amount > 10000 AND c.credit_score < 50)
     )
     ORDER BY o.created_at DESC
     LIMIT 50`,
    (err, suspiciousOrders) => {
      res.json(suspiciousOrders || []);
    }
  );
});

router.get('/fraud-alerts', authenticateToken, requireRole(['admin']), (req, res) => {
  db.all(
    `SELECT o.*,
            c.username as client_name,
            p.username as provider_name,
            ABS(c.credit_score - p.credit_score) as score_diff,
            julianday(o.updated_at) - julianday(o.created_at) as completion_days
     FROM orders o
     JOIN users c ON o.client_id = c.id
     JOIN users p ON o.provider_id = p.id
     WHERE o.status = 'completed'
     AND (
       (julianday(o.updated_at) - julianday(o.created_at) < 0.01)
       OR (c.id = p.id)
       OR (o.total_amount > 10000 AND c.credit_score < 50)
     )
     ORDER BY o.created_at DESC
     LIMIT 50`,
    (err, suspiciousOrders) => {
      res.json(suspiciousOrders || []);
    }
  );
});

module.exports = router;
