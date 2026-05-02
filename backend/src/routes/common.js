const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/exchange-rates', (req, res) => {
  try {
    const { base_currency, target_currency } = req.query;
    
    let where = 'is_locked = 0 AND (valid_to IS NULL OR valid_to > datetime("now"))';
    let params = [];
    
    if (base_currency) {
      where += ' AND base_currency = ?';
      params.push(base_currency);
    }
    
    if (target_currency) {
      where += ' AND target_currency = ?';
      params.push(target_currency);
    }

    const rates = db.exec(
      `SELECT * FROM exchange_rates WHERE ${where} ORDER BY base_currency, target_currency`,
      params
    );

    res.json({ success: true, data: rates });
  } catch (err) {
    res.status(500).json({ error: '获取汇率失败' });
  }
});

router.get('/payment-institutions', (req, res) => {
  try {
    const institutions = db.exec(
      'SELECT * FROM payment_institutions WHERE status = 1 ORDER BY name'
    );
    res.json({ success: true, data: institutions });
  } catch (err) {
    res.status(500).json({ error: '获取支付机构失败' });
  }
});

router.get('/merchants', (req, res) => {
  try {
    const merchants = db.exec(
      'SELECT * FROM merchants WHERE status = 1 ORDER BY name'
    );
    res.json({ success: true, data: merchants });
  } catch (err) {
    res.status(500).json({ error: '获取商户列表失败' });
  }
});

router.get('/todos', (req, res) => {
  try {
    const { status, page = 1, page_size = 20 } = req.query;
    
    let where = 'user_id = ?';
    let params = [req.user.id];
    
    if (status) {
      where += ' AND status = ?';
      params.push(status);
    }

    const countResult = db.get(
      `SELECT COUNT(*) as total FROM todos WHERE ${where}`,
      params
    );
    const total = countResult?.total || 0;

    const offset = (parseInt(page) - 1) * parseInt(page_size);
    const todos = db.exec(
      `SELECT t.*, 
              pt.order_no,
              pt.amount,
              pt.currency,
              pt.current_node,
              pt.status as transaction_status
       FROM todos t
       LEFT JOIN payment_transactions pt ON t.transaction_id = pt.id
       WHERE ${where}
       ORDER BY t.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(page_size), offset]
    );

    res.json({
      success: true,
      data: {
        todos,
        pagination: {
          page: parseInt(page),
          page_size: parseInt(page_size),
          total,
          total_pages: Math.ceil(total / parseInt(page_size)),
        },
      },
    });
  } catch (err) {
    console.error('Get todos error:', err);
    res.status(500).json({ error: '获取待办失败' });
  }
});

router.patch('/todos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const todo = db.get('SELECT * FROM todos WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!todo) {
      return res.status(404).json({ error: '待办不存在' });
    }

    const now = require('../services/stateMachine').getNow();
    const updates = { status };
    if (status === 'COMPLETED') {
      updates.completed_at = now;
    }

    db.update('todos', updates, 'id = ?', [id]);

    res.json({ success: true, message: '待办状态已更新' });
  } catch (err) {
    res.status(500).json({ error: '更新待办失败' });
  }
});

router.get('/messages', (req, res) => {
  try {
    const { is_read, page = 1, page_size = 20 } = req.query;
    
    let where = 'user_id = ?';
    let params = [req.user.id];
    
    if (is_read !== undefined && is_read !== null) {
      where += ' AND is_read = ?';
      params.push(is_read === 'true' || is_read === true ? 1 : 0);
    }

    const countResult = db.get(
      `SELECT COUNT(*) as total FROM messages WHERE ${where}`,
      params
    );
    const total = countResult?.total || 0;

    const offset = (parseInt(page) - 1) * parseInt(page_size);
    const messages = db.exec(
      `SELECT m.*, 
              pt.order_no
       FROM messages m
       LEFT JOIN payment_transactions pt ON m.transaction_id = pt.id
       WHERE ${where}
       ORDER BY m.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(page_size), offset]
    );

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          page: parseInt(page),
          page_size: parseInt(page_size),
          total,
          total_pages: Math.ceil(total / parseInt(page_size)),
        },
      },
    });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: '获取消息失败' });
  }
});

router.patch('/messages/:id/read', (req, res) => {
  try {
    const { id } = req.params;

    const message = db.get('SELECT * FROM messages WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!message) {
      return res.status(404).json({ error: '消息不存在' });
    }

    const now = require('../services/stateMachine').getNow();
    db.update('messages', { is_read: 1, read_at: now }, 'id = ?', [id]);

    res.json({ success: true, message: '消息已标记为已读' });
  } catch (err) {
    res.status(500).json({ error: '更新消息失败' });
  }
});

router.get('/audit-logs', (req, res) => {
  try {
    const { module, user_id, action, page = 1, page_size = 20 } = req.query;
    
    let where = '1=1';
    let params = [];
    
    if (module) {
      where += ' AND module = ?';
      params.push(module);
    }
    
    if (user_id) {
      where += ' AND user_id = ?';
      params.push(user_id);
    }
    
    if (action) {
      where += ' AND action = ?';
      params.push(action);
    }

    const countResult = db.get(
      `SELECT COUNT(*) as total FROM audit_logs WHERE ${where}`,
      params
    );
    const total = countResult?.total || 0;

    const offset = (parseInt(page) - 1) * parseInt(page_size);
    const logs = db.exec(
      `SELECT * FROM audit_logs 
       WHERE ${where}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(page_size), offset]
    );

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          page_size: parseInt(page_size),
          total,
          total_pages: Math.ceil(total / parseInt(page_size)),
        },
      },
    });
  } catch (err) {
    console.error('Get audit logs error:', err);
    res.status(500).json({ error: '获取审计日志失败' });
  }
});

router.get('/roles', (req, res) => {
  try {
    const roles = db.exec(
      'SELECT * FROM roles WHERE status = 1 ORDER BY code'
    );
    res.json({ success: true, data: roles });
  } catch (err) {
    res.status(500).json({ error: '获取角色列表失败' });
  }
});

router.get('/users', (req, res) => {
  try {
    const users = db.exec(
      `SELECT u.id, u.username, u.name, u.email, u.phone, u.role_id, u.merchant_id, u.status,
              r.code as role_code, r.name as role_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.status = 1
       ORDER BY u.name`
    );
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ error: '获取用户列表失败' });
  }
});

module.exports = router;
