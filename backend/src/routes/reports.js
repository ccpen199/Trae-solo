const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/overview', (req, res) => {
  const stats = {};
  
  stats.total_customers = db.prepare('SELECT COUNT(*) as count FROM customers').get().count;
  stats.total_applications = db.prepare('SELECT COUNT(*) as count FROM installment_applications').get().count;
  stats.approved_applications = db.prepare('SELECT COUNT(*) as count FROM installment_applications WHERE status = ?').get('已通过').count;
  stats.total_amount = db.prepare('SELECT COALESCE(SUM(amount), 0) as sum FROM installment_applications WHERE status = ?').get('已通过').sum;
  stats.total_touches = db.prepare('SELECT COUNT(*) as count FROM touch_records').get().count;
  stats.pending_applications = db.prepare('SELECT COUNT(*) as count FROM installment_applications WHERE status = ?').get('待审批').count;
  stats.follow_up_tasks = db.prepare('SELECT COUNT(*) as count FROM touch_records WHERE follow_up_status = ?').get('待处理').count;
  
  res.json({ success: true, data: stats });
});

router.get('/marketing-effect', (req, res) => {
  const { segment_rule_id, product_id } = req.query;
  
  let query = `
    SELECT 
      me.*,
      sr.name as segment_name,
      sr.rule_version,
      p.name as product_name,
      c.name, c.phone, c.card_level
    FROM marketing_effects me
    LEFT JOIN segment_rules sr ON me.segment_rule_id = sr.id
    LEFT JOIN installment_products p ON me.product_id = p.id
    LEFT JOIN customers c ON me.customer_id = c.id
    WHERE 1=1
  `;
  const params = [];
  
  if (segment_rule_id) {
    query += ' AND me.segment_rule_id = ?';
    params.push(segment_rule_id);
  }
  if (product_id) {
    query += ' AND me.product_id = ?';
    params.push(product_id);
  }
  
  query += ' ORDER BY me.created_at DESC';
  
  const effects = db.prepare(query).all(...params);
  
  const summary = {
    total_touches: 0,
    total_applications: 0,
    total_approved: 0,
    total_amount: 0,
    conversion_rate: '0%'
  };
  
  if (effects.length > 0) {
    summary.total_touches = effects.reduce((sum, e) => sum + (e.touch_count || 0), 0);
    summary.total_applications = effects.reduce((sum, e) => sum + (e.application_count || 0), 0);
    summary.total_approved = effects.reduce((sum, e) => sum + (e.approved_count || 0), 0);
    summary.total_amount = effects.reduce((sum, e) => sum + (e.total_approved_amount || 0), 0);
    summary.conversion_rate = summary.total_touches > 0 
      ? ((summary.total_approved / summary.total_touches) * 100).toFixed(2) + '%' 
      : '0%';
  }
  
  res.json({ 
    success: true, 
    data: effects,
    summary
  });
});

router.get('/funnel', (req, res) => {
  const totalSegments = db.prepare('SELECT COUNT(*) as count FROM customer_segments').get().count;
  const totalTouches = db.prepare('SELECT COUNT(*) as count FROM touch_records').get().count;
  const totalApplications = db.prepare('SELECT COUNT(*) as count FROM installment_applications').get().count;
  const approvedCount = db.prepare('SELECT COUNT(*) as count FROM installment_applications WHERE status = ?').get('已通过').count;
  
  const funnel = [
    { step: '客群筛选', count: totalSegments },
    { step: '触达客户', count: totalTouches },
    { step: '提交申请', count: totalApplications },
    { step: '审批通过', count: approvedCount }
  ];
  
  res.json({ success: true, data: funnel });
});

router.get('/channel-analysis', (req, res) => {
  const channels = db.prepare(`
    SELECT 
      channel,
      COUNT(*) as total,
      SUM(CASE WHEN result = '已申请' THEN 1 ELSE 0 END) as applied,
      SUM(CASE WHEN result = '客户拒绝' THEN 1 ELSE 0 END) as rejected,
      SUM(CASE WHEN result = '未接通' THEN 1 ELSE 0 END) as no_answer
    FROM touch_records
    GROUP BY channel
  `).all();
  
  channels.forEach(c => {
    c.conversion_rate = c.total > 0 ? ((c.applied / c.total) * 100).toFixed(2) + '%' : '0%';
  });
  
  res.json({ success: true, data: channels });
});

router.get('/product-performance', (req, res) => {
  const products = db.prepare(`
    SELECT 
      p.id,
      p.name,
      p.periods,
      COUNT(DISTINCT a.id) as application_count,
      COALESCE(COUNT(DISTINCT CASE WHEN a.status = '已通过' THEN a.id END), 0) as approved_count,
      COALESCE(SUM(CASE WHEN a.status = '已通过' THEN a.amount END), 0) as total_amount,
      COALESCE(SUM(CASE WHEN a.status = '已通过' THEN a.total_fee END), 0) as total_fee
    FROM installment_products p
    LEFT JOIN installment_applications a ON p.id = a.product_id
    GROUP BY p.id
    ORDER BY application_count DESC
  `).all();
  
  res.json({ success: true, data: products });
});

router.get('/customer-trace/:customerId', (req, res) => {
  const { customerId } = req.params;
  
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
  if (!customer) {
    return res.status(404).json({ success: false, message: '客户不存在' });
  }
  
  const touches = db.prepare(`
    SELECT tr.*, p.name as product_name, sr.name as segment_name
    FROM touch_records tr
    LEFT JOIN installment_products p ON tr.product_id = p.id
    LEFT JOIN segment_rules sr ON tr.segment_rule_id = sr.id
    WHERE tr.customer_id = ?
    ORDER BY tr.touch_time DESC
  `).all(customerId);
  
  const applications = db.prepare(`
    SELECT a.*, p.name as product_name
    FROM installment_applications a
    JOIN installment_products p ON a.product_id = p.id
    WHERE a.customer_id = ?
    ORDER BY a.created_at DESC
  `).all(customerId);
  
  res.json({
    success: true,
    data: {
      customer,
      touch_history: touches,
      application_history: applications
    }
  });
});

module.exports = router;
