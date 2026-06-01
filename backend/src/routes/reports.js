const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/summary', (req, res) => {
  const totalPolicies = db.prepare('SELECT COUNT(*) as count FROM policies').get().count;
  const activePolicies = db.prepare('SELECT COUNT(*) as count FROM policies WHERE status = ?').get('active').count;
  const totalClaims = db.prepare('SELECT COUNT(*) as count FROM claims').get().count;
  const approvedClaims = db.prepare('SELECT COUNT(*) as count FROM claims WHERE status = ?').get('approved').count;
  const rejectedClaims = db.prepare('SELECT COUNT(*) as count FROM claims WHERE status = ?').get('rejected').count;
  
  const totalPremium = db.prepare(`
    SELECT SUM(wp.price) as total FROM policies p
    LEFT JOIN warranty_products wp ON p.product_id = wp.id
  `).get().total || 0;
  
  const totalPayout = db.prepare(`
    SELECT SUM(rf.amount) as total FROM repair_fees rf
    LEFT JOIN service_orders so ON rf.order_id = so.id
    WHERE so.settled = 1
  `).get().total || 0;
  
  const partsTotal = db.prepare(`
    SELECT SUM(rp.total_price) as total FROM repair_parts rp
    LEFT JOIN service_orders so ON rp.order_id = so.id
    WHERE so.settled = 1
  `).get().total || 0;
  
  res.json({
    success: true,
    data: {
      totalPolicies,
      activePolicies,
      totalClaims,
      approvedClaims,
      rejectedClaims,
      claimRate: totalPolicies > 0 ? ((totalClaims / totalPolicies) * 100).toFixed(2) : 0,
      approvalRate: totalClaims > 0 ? ((approvedClaims / totalClaims) * 100).toFixed(2) : 0,
      totalPremium: parseFloat(totalPremium),
      totalPayout: parseFloat(totalPayout) + parseFloat(partsTotal),
      netProfit: parseFloat(totalPremium) - parseFloat(totalPayout) - parseFloat(partsTotal)
    }
  });
});

router.get('/policies-by-category', (req, res) => {
  const data = db.prepare(`
    SELECT wp.category, COUNT(*) as count, SUM(wp.price) as total
    FROM policies p
    LEFT JOIN warranty_products wp ON p.product_id = wp.id
    GROUP BY wp.category
    ORDER BY count DESC
  `).all();
  res.json({ success: true, data });
});

router.get('/policies-by-store', (req, res) => {
  const data = db.prepare(`
    SELECT s.name as store_name, COUNT(*) as count, SUM(wp.price) as total
    FROM policies p
    LEFT JOIN stores s ON p.store_id = s.id
    LEFT JOIN warranty_products wp ON p.product_id = wp.id
    WHERE s.name IS NOT NULL
    GROUP BY s.name
    ORDER BY count DESC
  `).all();
  res.json({ success: true, data });
});

router.get('/reject-reasons', (req, res) => {
  const data = db.prepare(`
    SELECT reject_reason, COUNT(*) as count
    FROM claims
    WHERE status = 'rejected' AND reject_reason IS NOT NULL
    GROUP BY reject_reason
    ORDER BY count DESC
  `).all();
  res.json({ success: true, data });
});

router.get('/provider-performance', (req, res) => {
  const data = db.prepare(`
    SELECT sp.name, sp.rating, 
           COUNT(so.id) as order_count,
           SUM(CASE WHEN so.status = 'completed' THEN 1 ELSE 0 END) as completed_count
    FROM service_providers sp
    LEFT JOIN service_orders so ON sp.id = so.provider_id
    GROUP BY sp.id
    ORDER BY order_count DESC
  `).all();
  res.json({ success: true, data });
});

router.get('/monthly-trend', (req, res) => {
  const policyTrend = db.prepare(`
    SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as policy_count
    FROM policies
    GROUP BY strftime('%Y-%m', created_at)
    ORDER BY month DESC
    LIMIT 12
  `).all();
  
  const claimTrend = db.prepare(`
    SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as claim_count
    FROM claims
    GROUP BY strftime('%Y-%m', created_at)
    ORDER BY month DESC
    LIMIT 12
  `).all();
  
  const months = [...new Set([...policyTrend.map(p => p.month), ...claimTrend.map(c => c.month)])].sort().slice(-12);
  
  const data = months.map(month => ({
    month,
    policy_count: policyTrend.find(p => p.month === month)?.policy_count || 0,
    claim_count: claimTrend.find(c => c.month === month)?.claim_count || 0
  }));
  
  res.json({ success: true, data });
});

module.exports = router;
