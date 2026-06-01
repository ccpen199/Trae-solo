const express = require('express');
const router = express.Router();
const db = require('../db');
const dayjs = require('dayjs');

router.get('/dashboard', (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM policies WHERE status = 'active') as active_policies,
        (SELECT COUNT(*) FROM renewal_tasks WHERE status = 'pending') as pending_tasks,
        (SELECT COUNT(*) FROM payment_records WHERE status != 'success' AND status != 'pending') as failed_payments,
        (SELECT COUNT(*) FROM policies WHERE julianday(expiry_date) - julianday('now') <= 30 AND julianday(expiry_date) - julianday('now') > 0) as expiring_30d,
        (SELECT COUNT(*) FROM policies WHERE julianday(expiry_date) < julianday('now')) as expired_policies,
        (SELECT SUM(premium_amount) FROM policies WHERE status = 'active') as total_premium
    `).get();

    const byStatus = db.prepare(`
      SELECT status, COUNT(*) as count, SUM(premium_amount) as premium_amount
      FROM policies 
      GROUP BY status
    `).all();

    const byProductType = db.prepare(`
      SELECT product_type, COUNT(*) as count, SUM(premium_amount) as premium_amount
      FROM policies 
      GROUP BY product_type
    `).all();

    const byAgent = db.prepare(`
      SELECT 
        a.name as agent_name,
        COUNT(p.id) as policy_count,
        COUNT(rt.id) as task_count,
        SUM(p.premium_amount) as total_premium
      FROM agents a
      LEFT JOIN policies p ON a.id = p.agent_id
      LEFT JOIN renewal_tasks rt ON a.id = rt.agent_id AND rt.status = 'pending'
      GROUP BY a.id
      ORDER BY task_count DESC
      LIMIT 10
    `).all();

    res.json({
      stats: {
        active_policies: stats.active_policies || 0,
        pending_tasks: stats.pending_tasks || 0,
        failed_payments: stats.failed_payments || 0,
        expiring_30d: stats.expiring_30d || 0,
        expired_policies: stats.expired_policies || 0,
        total_premium: stats.total_premium || 0
      },
      by_status: byStatus,
      by_product_type: byProductType,
      by_agent: byAgent
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/renewal-funnel', (req, res) => {
  try {
    const funnel = db.prepare(`
      SELECT 
        '待提醒' as stage, COUNT(*) as count FROM renewal_tasks WHERE status = 'pending'
      UNION ALL
      SELECT 
        '已提醒' as stage, COUNT(*) as count FROM renewal_tasks WHERE reminder_count > 0 AND status != 'completed'
      UNION ALL
      SELECT 
        '客户确认' as stage, COUNT(*) as count FROM renewal_tasks WHERE customer_feedback IS NOT NULL AND customer_feedback != ''
      UNION ALL
      SELECT 
        '扣费中' as stage, COUNT(*) as count FROM payment_records WHERE status = 'pending'
      UNION ALL
      SELECT 
        '已续期' as stage, COUNT(*) as count FROM policies WHERE status = 'renewed'
    `).all();

    res.json({ data: funnel });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/drill-down', (req, res) => {
  const { dimension, filter_value, page = 1, page_size = 20 } = req.query;

  try {
    let query = '';
    let countQuery = '';
    const params = [];

    switch (dimension) {
      case 'agent':
        query = `
          SELECT 
            p.*,
            c.name as customer_name,
            rt.status as task_status,
            rt.reminder_count
          FROM policies p
          LEFT JOIN customers c ON p.customer_id = c.id
          LEFT JOIN agents a ON p.agent_id = a.id
          LEFT JOIN renewal_tasks rt ON p.id = rt.policy_id
          WHERE a.id = ?
        `;
        countQuery = `SELECT COUNT(*) as total FROM policies WHERE agent_id = ?`;
        params.push(filter_value);
        break;

      case 'product_type':
        query = `
          SELECT 
            p.*,
            c.name as customer_name,
            a.name as agent_name,
            rt.status as task_status
          FROM policies p
          LEFT JOIN customers c ON p.customer_id = c.id
          LEFT JOIN agents a ON p.agent_id = a.id
          LEFT JOIN renewal_tasks rt ON p.id = rt.policy_id
          WHERE p.product_type = ?
        `;
        countQuery = `SELECT COUNT(*) as total FROM policies WHERE product_type = ?`;
        params.push(filter_value);
        break;

      case 'status':
        query = `
          SELECT 
            p.*,
            c.name as customer_name,
            a.name as agent_name,
            rt.status as task_status
          FROM policies p
          LEFT JOIN customers c ON p.customer_id = c.id
          LEFT JOIN agents a ON p.agent_id = a.id
          LEFT JOIN renewal_tasks rt ON p.id = rt.policy_id
          WHERE p.status = ?
        `;
        countQuery = `SELECT COUNT(*) as total FROM policies WHERE status = ?`;
        params.push(filter_value);
        break;

      default:
        query = `
          SELECT 
            p.*,
            c.name as customer_name,
            a.name as agent_name
          FROM policies p
          LEFT JOIN customers c ON p.customer_id = c.id
          LEFT JOIN agents a ON p.agent_id = a.id
        `;
        countQuery = `SELECT COUNT(*) as total FROM policies`;
    }

    query += ` ORDER BY p.expiry_date ASC LIMIT ? OFFSET ?`;
    params.push(parseInt(page_size), (page - 1) * page_size);

    const data = db.prepare(query).all(...params);
    const { total } = db.prepare(countQuery).get(...params.slice(0, params.length - 2));

    res.json({
      data,
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

module.exports = router;
