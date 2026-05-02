const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const stateMachine = require('../services/stateMachine');
const { v4: uuidv4 } = require('uuid');

router.use(authenticateToken);

router.get('/', requirePermission('COLLECTION_VIEW'), (req, res) => {
  try {
    const { 
      status, 
      current_node, 
      merchant_id, 
      order_no,
      start_date,
      end_date,
      page = 1,
      page_size = 20 
    } = req.query;

    let whereConditions = ['1=1'];
    let params = [];

    if (status) {
      whereConditions.push('status = ?');
      params.push(status);
    }

    if (current_node) {
      whereConditions.push('current_node = ?');
      params.push(current_node);
    }

    if (merchant_id) {
      whereConditions.push('pt.merchant_id = ?');
      params.push(merchant_id);
    }

    if (order_no) {
      whereConditions.push('order_no LIKE ?');
      params.push(`%${order_no}%`);
    }

    if (start_date) {
      whereConditions.push('date(created_at) >= ?');
      params.push(start_date);
    }

    if (end_date) {
      whereConditions.push('date(created_at) <= ?');
      params.push(end_date);
    }

    if (req.user.role_code === 'MERCHANT' || req.user.role_code === 'MERCHANT_ADMIN') {
      if (req.user.merchant_id) {
        whereConditions.push('pt.merchant_id = ?');
        params.push(req.user.merchant_id);
      }
    }

    const whereClause = whereConditions.join(' AND ');

    const countResult = db.get(
      `SELECT COUNT(*) as total FROM payment_transactions pt WHERE ${whereClause}`,
      params
    );
    const total = countResult?.total || 0;

    const offset = (parseInt(page) - 1) * parseInt(page_size);
    const transactions = db.exec(
      `SELECT pt.*, 
              m.name as merchant_name,
              m.code as merchant_code,
              pi.name as payment_institution_name,
              u.name as responsible_user_name
       FROM payment_transactions pt
       LEFT JOIN merchants m ON pt.merchant_id = m.id
       LEFT JOIN payment_institutions pi ON pt.payment_institution_id = pi.id
       LEFT JOIN users u ON pt.responsible_user_id = u.id
       WHERE ${whereClause}
       ORDER BY pt.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(page_size), offset]
    );

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          page_size: parseInt(page_size),
          total,
          total_pages: Math.ceil(total / parseInt(page_size)),
        },
      },
    });
  } catch (err) {
    console.error('Get transactions error:', err);
    res.status(500).json({ error: '获取交易列表失败', message: err.message });
  }
});

router.get('/stats', requirePermission('COLLECTION_VIEW'), (req, res) => {
  try {
    const { merchant_id, start_date, end_date } = req.query;
    
    let whereConditions = ['1=1'];
    let params = [];

    if (merchant_id) {
      whereConditions.push('pt.merchant_id = ?');
      params.push(merchant_id);
    }

    if (start_date) {
      whereConditions.push('date(created_at) >= ?');
      params.push(start_date);
    }

    if (end_date) {
      whereConditions.push('date(created_at) <= ?');
      params.push(end_date);
    }

    if (req.user.role_code === 'MERCHANT' || req.user.role_code === 'MERCHANT_ADMIN') {
      if (req.user.merchant_id) {
        whereConditions.push('pt.merchant_id = ?');
        params.push(req.user.merchant_id);
      }
    }

    const whereClause = whereConditions.join(' AND ');

    const stats = db.get(
      `SELECT 
        COUNT(*) as total_count,
        SUM(CASE WHEN status = 'CREATED' THEN 1 ELSE 0 END) as created_count,
        SUM(CASE WHEN status = 'PENDING_PAYMENT' THEN 1 ELSE 0 END) as pending_payment_count,
        SUM(CASE WHEN status = 'PAYMENT_COMPLETED' THEN 1 ELSE 0 END) as payment_completed_count,
        SUM(CASE WHEN status = 'PENDING_COMPLIANCE' THEN 1 ELSE 0 END) as pending_compliance_count,
        SUM(CASE WHEN status = 'PENDING_SETTLEMENT' THEN 1 ELSE 0 END) as pending_settlement_count,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_count,
        SUM(CASE WHEN status = 'EXCEPTION' THEN 1 ELSE 0 END) as exception_count,
        SUM(amount) as total_amount,
        SUM(CASE WHEN status = 'COMPLETED' THEN target_amount ELSE 0 END) as completed_amount,
        SUM(CASE WHEN is_exception = 1 THEN 1 ELSE 0 END) as exception_count
       FROM payment_transactions pt WHERE ${whereClause}`,
      params
    );

    const todoCount = db.get(
      `SELECT COUNT(*) as count FROM todos 
       WHERE user_id = ? AND status = 'PENDING'`,
      [req.user.id]
    );

    const unreadMessageCount = db.get(
      `SELECT COUNT(*) as count FROM messages 
       WHERE user_id = ? AND is_read = 0`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: {
        transactions: stats,
        todos: todoCount?.count || 0,
        unread_messages: unreadMessageCount?.count || 0,
      },
    });
  } catch (err) {
    console.error('Get stats error:', err);
    res.status(500).json({ error: '获取统计失败', message: err.message });
  }
});

router.get('/workflow-nodes', (req, res) => {
  try {
    const nodes = db.exec(
      `SELECT * FROM workflow_nodes ORDER BY sort_order`
    );
    res.json({ success: true, data: nodes });
  } catch (err) {
    res.status(500).json({ error: '获取节点失败' });
  }
});

router.get('/:id', requirePermission('COLLECTION_VIEW'), (req, res) => {
  try {
    const { id } = req.params;
    const detail = stateMachine.getTransactionDetail(id);
    
    if (!detail) {
      return res.status(404).json({ error: '交易不存在' });
    }

    res.json({ success: true, data: detail });
  } catch (err) {
    console.error('Get transaction error:', err);
    res.status(500).json({ error: '获取交易详情失败', message: err.message });
  }
});

router.post('/', requirePermission('COLLECTION_CREATE'), (req, res) => {
  try {
    const data = req.body;

    if (!data.amount || data.amount <= 0) {
      return res.status(400).json({ error: '金额不能为空或小于等于0' });
    }

    if (!data.currency) {
      return res.status(400).json({ error: '币种不能为空' });
    }

    const result = stateMachine.createCollection(data, req.user, req);
    
    res.json({
      success: true,
      data: result,
      message: '收款单创建成功',
    });
  } catch (err) {
    console.error('Create collection error:', err);
    res.status(400).json({ error: err.message || '创建收款单失败' });
  }
});

router.post('/:id/transition-to-payment', requirePermission('PAYMENT_PROCESS'), (req, res) => {
  try {
    const { id } = req.params;
    const paymentData = req.body;
    
    const result = stateMachine.transitionToPayment(id, req.user, paymentData, req);
    
    res.json({
      success: true,
      data: result,
      message: '已进入支付环节',
    });
  } catch (err) {
    console.error('Transition to payment error:', err);
    res.status(400).json({ error: err.message || '状态转换失败' });
  }
});

router.post('/:id/process-payment', requirePermission('PAYMENT_PROCESS'), (req, res) => {
  try {
    const { id } = req.params;
    const { success, reason, comment } = req.body;
    
    const paymentResult = {
      success: success === true || success === 'true',
      reason,
      comment,
    };
    
    const result = stateMachine.processPayment(id, req.user, paymentResult, req);
    
    res.json({
      success: true,
      data: result,
      message: paymentResult.success ? '支付处理成功' : '支付处理失败',
    });
  } catch (err) {
    console.error('Process payment error:', err);
    res.status(400).json({ error: err.message || '处理支付失败' });
  }
});

router.post('/:id/process-exchange', (req, res) => {
  try {
    const { id } = req.params;
    const { success, reason, comment } = req.body;
    
    const exchangeResult = {
      success: success === true || success === 'true',
      reason,
      comment,
    };
    
    const result = stateMachine.processExchange(id, req.user, exchangeResult, req);
    
    res.json({
      success: true,
      data: result,
      message: exchangeResult.success ? '汇率换算成功' : '汇率换算失败',
    });
  } catch (err) {
    console.error('Process exchange error:', err);
    res.status(400).json({ error: err.message || '处理汇率换算失败' });
  }
});

router.post('/:id/process-compliance', requirePermission('KYC_REVIEW'), (req, res) => {
  try {
    const { id } = req.params;
    const { action, comment } = req.body;
    
    if (!['approve', 'reject', 'request_more', 'reassign'].includes(action)) {
      return res.status(400).json({ error: '无效的审核动作' });
    }
    
    const result = stateMachine.processCompliance(id, req.user, action, comment || '', req);
    
    const messages = {
      approve: '合规审核通过',
      reject: '合规审核驳回',
      request_more: '已要求补充资料',
      reassign: '已转派审核',
    };
    
    res.json({
      success: true,
      data: result,
      message: messages[action] || '操作成功',
    });
  } catch (err) {
    console.error('Process compliance error:', err);
    res.status(400).json({ error: err.message || '处理合规审核失败' });
  }
});

router.post('/:id/process-settlement', requirePermission('SETTLEMENT_PROCESS'), (req, res) => {
  try {
    const { id } = req.params;
    const { success, reason, remark, bank_account_id } = req.body;
    
    const settlementData = {
      success: success === true || success === 'true',
      reason,
      remark,
      bank_account_id,
    };
    
    const result = stateMachine.processSettlement(id, req.user, settlementData, req);
    
    res.json({
      success: true,
      data: result,
      message: settlementData.success ? '结算处理成功' : '结算处理失败',
    });
  } catch (err) {
    console.error('Process settlement error:', err);
    res.status(400).json({ error: err.message || '处理结算失败' });
  }
});

router.post('/:id/handle-exception', (req, res) => {
  try {
    const { id } = req.params;
    const { action, resolution } = req.body;
    
    const validActions = ['retry_payment', 'retry_exchange', 'retry_compliance', 'retry_settlement', 'cancel'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: '无效的异常处理动作' });
    }
    
    const result = stateMachine.handleException(id, req.user, action, resolution || '', req);
    
    res.json({
      success: true,
      data: result,
      message: '异常处理成功',
    });
  } catch (err) {
    console.error('Handle exception error:', err);
    res.status(400).json({ error: err.message || '处理异常失败' });
  }
});

module.exports = router;
