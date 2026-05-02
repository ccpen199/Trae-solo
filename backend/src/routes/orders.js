const express = require('express');
const { db } = require('../database');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken, requireRole } = require('./auth');
const OrderStateMachine = require('../state-machine');
const RiskCheckEngine = require('../risk-engine');
const matchingEngine = require('../matching-engine');
const AuditLogger = require('../audit-logger');

const router = express.Router();

router.use(authenticateToken);

router.get('/', requireRole('investor'), async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT o.*, s.name as security_name
      FROM orders o
      LEFT JOIN securities s ON o.security_code = s.code
      WHERE o.user_id = ?
    `;
    const params = [req.user.id];

    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }

    query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const orders = db.prepare(query).all(...params);

    const totalQuery = status
      ? 'SELECT COUNT(*) as total FROM orders WHERE user_id = ? AND status = ?'
      : 'SELECT COUNT(*) as total FROM orders WHERE user_id = ?';
    
    const totalParams = status ? [req.user.id, status] : [req.user.id];
    const { total } = db.prepare(totalQuery).get(...totalParams);

    res.json({
      orders,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('获取订单列表错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/all', requireRole('exchange_admin', 'risk_officer'), async (req, res) => {
  try {
    const { status, userId, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT o.*, u.username, u.name as user_name, s.name as security_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN securities s ON o.security_code = s.code
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }

    if (userId) {
      query += ' AND o.user_id = ?';
      params.push(userId);
    }

    query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const orders = db.prepare(query).all(...params);

    res.json({ orders });
  } catch (error) {
    console.error('获取全部订单错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    let order;
    
    if (req.user.role === 'investor') {
      order = db.prepare(`
        SELECT o.*, s.name as security_name
        FROM orders o
        LEFT JOIN securities s ON o.security_code = s.code
        WHERE o.id = ? AND o.user_id = ?
      `).get(id, req.user.id);
    } else {
      order = db.prepare(`
        SELECT o.*, u.username, u.name as user_name, s.name as security_name
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        LEFT JOIN securities s ON o.security_code = s.code
        WHERE o.id = ?
      `).get(id);
    }

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    const trades = db.prepare('SELECT * FROM trades WHERE order_id = ? ORDER BY created_at').all(id);
    const statusHistory = db.prepare('SELECT * FROM order_status_history WHERE order_id = ? ORDER BY timestamp').all(id);
    const riskLogs = db.prepare('SELECT * FROM risk_check_logs WHERE order_id = ? ORDER BY timestamp').all(id);

    res.json({
      order,
      trades,
      statusHistory,
      riskLogs
    });
  } catch (error) {
    console.error('获取订单详情错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/', requireRole('investor'), async (req, res) => {
  try {
    const { securityCode, direction, price, quantity, orderType = 'limit' } = req.body;

    if (!securityCode || !direction || !price || !quantity) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    if (!['buy', 'sell'].includes(direction)) {
      return res.status(400).json({ error: '委托方向无效' });
    }

    const security = db.prepare('SELECT * FROM securities WHERE code = ?').get(securityCode);
    if (!security) {
      return res.status(404).json({ error: '证券不存在' });
    }

    const orderId = uuidv4();
    const orderNo = `O${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    db.exec('BEGIN TRANSACTION');

    db.prepare(`
      INSERT INTO orders (
        id, order_no, user_id, security_code, direction, order_type,
        price, quantity, filled_quantity, filled_amount, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?)
    `).run(
      orderId, orderNo, req.user.id, securityCode, direction, orderType,
      price, quantity, 'pending'
    );

    OrderStateMachine.transition(orderId, 'submitted', '用户提交委托', req.user);

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    const riskResult = RiskCheckEngine.checkOrder(order, req.user);

    if (riskResult.passed) {
      db.prepare(`
        UPDATE orders 
        SET risk_status = ?, risk_reason = ?
        WHERE id = ?
      `).run('passed', null, orderId);

      if (direction === 'buy') {
        const estimatedCost = price * quantity;
        const funds = db.prepare('SELECT * FROM funds WHERE user_id = ?').get(req.user.id);
        if (funds) {
          db.prepare(`
            UPDATE funds 
            SET available_balance = available_balance - ?, frozen_balance = frozen_balance + ?, updated_at = ?
            WHERE user_id = ?
          `).run(estimatedCost, estimatedCost, Date.now(), req.user.id);
        }
      } else {
        const position = db.prepare(
          'SELECT * FROM positions WHERE user_id = ? AND security_code = ?'
        ).get(req.user.id, securityCode);
        if (position) {
          db.prepare(`
            UPDATE positions 
            SET available_quantity = available_quantity - ?, frozen_quantity = frozen_quantity + ?, updated_at = ?
            WHERE user_id = ? AND security_code = ?
          `).run(quantity, quantity, Date.now(), req.user.id, securityCode);
        }
      }

      OrderStateMachine.transition(orderId, 'accepted', '风控通过', req.user);

      const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
      const trades = matchingEngine.matchOrder(updatedOrder);

      db.exec('COMMIT');

      AuditLogger.log('ORDER_SUBMITTED', 'order', orderId, {
        orderNo,
        securityCode,
        direction,
        price,
        quantity,
        trades: trades.length
      }, req.user, req);

      res.status(201).json({
        message: '订单已提交并接受',
        order: db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId),
        trades
      });
    } else {
      db.prepare(`
        UPDATE orders 
        SET risk_status = ?, risk_reason = ?
        WHERE id = ?
      `).run('failed', riskResult.reason, orderId);

      OrderStateMachine.transition(orderId, 'rejected', riskResult.reason, req.user);

      db.exec('COMMIT');

      AuditLogger.log('ORDER_REJECTED', 'order', orderId, {
        orderNo,
        securityCode,
        direction,
        price,
        quantity,
        reason: riskResult.reason
      }, req.user, req, 'failed', riskResult.reason);

      res.status(400).json({
        error: '订单被拒绝',
        reason: riskResult.reason,
        details: riskResult.details
      });
    }
  } catch (error) {
    db.exec('ROLLBACK');
    console.error('提交订单错误:', error);
    res.status(500).json({ error: '服务器内部错误', message: error.message });
  }
});

router.post('/:id/cancel', requireRole('investor'), async (req, res) => {
  try {
    const { id } = req.params;

    const order = db.prepare(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?'
    ).get(id, req.user.id);

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    db.exec('BEGIN TRANSACTION');
    
    matchingEngine.cancelOrder(id, req.user);
    
    db.exec('COMMIT');

    AuditLogger.log('ORDER_CANCELLED', 'order', id, {
      orderNo: order.order_no,
      securityCode: order.security_code
    }, req.user, req);

    res.json({
      message: '订单已撤销',
      order: db.prepare('SELECT * FROM orders WHERE id = ?').get(id)
    });
  } catch (error) {
    db.exec('ROLLBACK');
    console.error('撤销订单错误:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/trace', async (req, res) => {
  try {
    const { id } = req.params;
    
    let order;
    if (req.user.role === 'investor') {
      order = db.prepare('SELECT id FROM orders WHERE id = ? AND user_id = ?').get(id, req.user.id);
    } else {
      order = db.prepare('SELECT id FROM orders WHERE id = ?').get(id);
    }

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    const fullPath = AuditLogger.getOrderFullPath(id);
    res.json(fullPath);
  } catch (error) {
    console.error('订单溯源错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
