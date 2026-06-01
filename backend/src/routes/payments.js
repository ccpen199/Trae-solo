const express = require('express');
const router = express.Router();
const db = require('../db');
const dayjs = require('dayjs');

const REMEDY_ACTIONS = {
  'insufficient_balance': [
    { code: 'notify_customer', name: '通知客户存款' },
    { code: 'change_payment_method', name: '变更支付方式' },
    { code: 'schedule_retry', name: '安排重试扣费' }
  ],
  'card_expired': [
    { code: 'update_card', name: '更新银行卡信息' },
    { code: 'change_payment_method', name: '变更支付方式' },
    { code: 'manual_collection', name: '人工收取' }
  ],
  'auth_expired': [
    { code: 'reauthorize', name: '重新授权' },
    { code: 'change_payment_method', name: '变更支付方式' },
    { code: 'manual_collection', name: '人工收取' }
  ],
  'pending_manual': [
    { code: 'contact_customer', name: '联系客户确认' },
    { code: 'manual_process', name: '人工处理' }
  ]
};

router.get('/', (req, res) => {
  const { policy_id, status, page = 1, page_size = 20 } = req.query;

  let query = `
    SELECT 
      pr.*,
      p.policy_no,
      p.product_name,
      c.name as customer_name,
      c.phone as customer_phone,
      a.name as agent_name
    FROM payment_records pr
    LEFT JOIN policies p ON pr.policy_id = p.id
    LEFT JOIN customers c ON p.customer_id = c.id
    LEFT JOIN agents a ON p.agent_id = a.id
    WHERE 1=1
  `;
  const params = [];

  if (policy_id) {
    query += ` AND pr.policy_id = ?`;
    params.push(policy_id);
  }
  if (status) {
    query += ` AND pr.status = ?`;
    params.push(status);
  }

  query += ` ORDER BY pr.created_at DESC`;

  const offset = (page - 1) * page_size;
  query += ` LIMIT ? OFFSET ?`;
  params.push(parseInt(page_size), offset);

  try {
    const records = db.prepare(query).all(...params);
    
    const countQuery = query.split('ORDER BY')[0].replace(
      'SELECT pr.*, p.policy_no, p.product_name, c.name as customer_name, c.phone as customer_phone, a.name as agent_name',
      'SELECT COUNT(*) as total'
    );
    const { total } = db.prepare(countQuery).get(...params.slice(0, params.length - 2));

    res.json({
      data: records.map(r => ({
        ...r,
        remedy_actions: REMEDY_ACTIONS[r.status] || []
      })),
      pagination: {
        page: parseInt(page),
        page_size: parseInt(page_size),
        total,
        total_pages: Math.ceil(total / page_size)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  const { policy_id, amount } = req.body;

  try {
    const policy = db.prepare('SELECT * FROM policies WHERE id = ?').get(policy_id);
    if (!policy) {
      return res.status(404).json({ error: '保单不存在' });
    }

    const result = db.prepare(`
      INSERT INTO payment_records (policy_id, amount, status, retry_count)
      VALUES (?, ?, 'pending', 0)
    `).run(policy_id, amount || policy.premium_amount);

    res.json({ 
      success: true, 
      record_id: result.lastInsertRowid,
      message: '扣费记录创建成功' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/process', (req, res) => {
  const { status, failure_reason, processed_by } = req.body;
  const { id } = req.params;

  try {
    const record = db.prepare('SELECT * FROM payment_records WHERE id = ?').get(id);
    if (!record) {
      return res.status(404).json({ error: '扣费记录不存在' });
    }

    db.prepare('BEGIN').run();

    if (status === 'success') {
      db.prepare(`
        UPDATE payment_records 
        SET status = 'success', payment_date = CURRENT_TIMESTAMP, processed_by = ?, processed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(processed_by || 'system', id);

      db.prepare(`
        UPDATE policies 
        SET status = 'renewed', next_renewal_date = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(dayjs().add(1, 'year').format('YYYY-MM-DD'), record.policy_id);

      db.prepare(`
        UPDATE renewal_tasks 
        SET status = 'completed', updated_at = CURRENT_TIMESTAMP 
        WHERE policy_id = ?
      `).run(record.policy_id);

    } else if (['insufficient_balance', 'card_expired', 'auth_expired', 'pending_manual'].includes(status)) {
      const nextRetry = status !== 'pending_manual' 
        ? dayjs().add(1, 'day').format('YYYY-MM-DD HH:mm:ss')
        : null;

      db.prepare(`
        UPDATE payment_records 
        SET status = ?, failure_reason = ?, retry_count = retry_count + 1, 
            next_retry = ?, processed_by = ?, processed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(status, failure_reason, nextRetry, processed_by || 'system', id);
    }

    db.prepare('COMMIT').run();

    res.json({ 
      success: true, 
      message: '扣费处理成功',
      remedy_actions: REMEDY_ACTIONS[status] || []
    });
  } catch (error) {
    db.prepare('ROLLBACK').run();
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/retry', (req, res) => {
  const { processed_by } = req.body;
  const { id } = req.params;

  try {
    const record = db.prepare('SELECT * FROM payment_records WHERE id = ?').get(id);
    if (!record) {
      return res.status(404).json({ error: '扣费记录不存在' });
    }

    if (record.retry_count >= 3) {
      return res.status(400).json({ error: '已达到最大重试次数，请人工处理' });
    }

    const isSuccess = Math.random() > 0.5;

    db.prepare('BEGIN').run();

    if (isSuccess) {
      db.prepare(`
        UPDATE payment_records 
        SET status = 'success', payment_date = CURRENT_TIMESTAMP, retry_count = retry_count + 1, processed_by = ?, processed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(processed_by || 'system', id);

      db.prepare(`
        UPDATE policies 
        SET status = 'renewed', next_renewal_date = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(dayjs().add(1, 'year').format('YYYY-MM-DD'), record.policy_id);

      db.prepare(`
        UPDATE renewal_tasks 
        SET status = 'completed', updated_at = CURRENT_TIMESTAMP 
        WHERE policy_id = ?
      `).run(record.policy_id);

    } else {
      db.prepare(`
        UPDATE payment_records 
        SET retry_count = retry_count + 1, next_retry = ?, processed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(dayjs().add(1, 'day').format('YYYY-MM-DD HH:mm:ss'), id);
    }

    db.prepare('COMMIT').run();

    res.json({ 
      success: true, 
      payment_success: isSuccess,
      message: isSuccess ? '扣费重试成功' : '扣费重试失败，已安排下次重试'
    });
  } catch (error) {
    db.prepare('ROLLBACK').run();
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
