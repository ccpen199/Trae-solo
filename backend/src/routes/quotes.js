const express = require('express');
const router = express.Router();
const db = require('../models/db');

function generateQuoteNo() {
  const date = new Date();
  const prefix = 'Q' + date.getFullYear().toString().slice(-2) + 
    (date.getMonth() + 1).toString().padStart(2, '0') +
    date.getDate().toString().padStart(2, '0');
  
  const last = db.prepare(`
    SELECT quote_no FROM quotes WHERE quote_no LIKE ? 
    ORDER BY quote_no DESC LIMIT 1
  `).get(prefix + '%');
  
  if (last) {
    const seq = parseInt(last.quote_no.slice(-4)) + 1;
    return prefix + seq.toString().padStart(4, '0');
  }
  return prefix + '0001';
}

router.get('/', (req, res) => {
  const { recipe_id, status, channel } = req.query;
  let sql = `
    SELECT q.*, r.name as recipe_name, r.code as recipe_code,
      cc.total_cost as unit_cost
    FROM quotes q
    LEFT JOIN recipes r ON q.recipe_id = r.id
    LEFT JOIN cost_calculations cc ON q.cost_calculation_id = cc.id
    WHERE 1=1
  `;
  const params = [];
  
  if (recipe_id) {
    sql += ' AND q.recipe_id = ?';
    params.push(recipe_id);
  }
  if (status) {
    sql += ' AND q.status = ?';
    params.push(status);
  }
  if (channel) {
    sql += ' AND q.channel = ?';
    params.push(channel);
  }
  sql += ' ORDER BY q.created_at DESC LIMIT 50';
  
  const quotes = db.prepare(sql).all(...params);
  res.json(quotes);
});

router.get('/:id', (req, res) => {
  const quote = db.prepare(`
    SELECT q.*, r.name as recipe_name, r.code as recipe_code,
      cc.*
    FROM quotes q
    LEFT JOIN recipes r ON q.recipe_id = r.id
    LEFT JOIN cost_calculations cc ON q.cost_calculation_id = cc.id
    WHERE q.id = ?
  `).get(req.params.id);
  
  if (!quote) {
    return res.status(404).json({ error: '报价单不存在' });
  }
  
  const details = db.prepare('SELECT * FROM cost_details WHERE calculation_id = ?').all(quote.cost_calculation_id);
  const approvals = db.prepare('SELECT * FROM approval_records WHERE quote_id = ? ORDER BY created_at').all(req.params.id);
  
  res.json({ ...quote, cost_details: details, approvals });
});

router.post('/', (req, res) => {
  const { recipe_id, cost_calculation_id, channel, target_margin, base_price, discount, red_line_margin, valid_from, valid_to } = req.body;
  
  const costCalc = db.prepare('SELECT total_cost FROM cost_calculations WHERE id = ?').get(cost_calculation_id);
  if (!costCalc) {
    return res.status(400).json({ error: '成本计算记录不存在' });
  }
  
  const unitCost = costCalc.total_cost;
  const calculatedBasePrice = unitCost / (1 - (target_margin / 100));
  const finalBasePrice = base_price || calculatedBasePrice;
  const finalPrice = finalBasePrice * (1 - (discount / 100));
  const actualMargin = ((finalPrice - unitCost) / finalPrice) * 100;
  
  const needsApproval = actualMargin < (red_line_margin || 15);
  
  const quoteNo = generateQuoteNo();
  
  try {
    const result = db.prepare(`
      INSERT INTO quotes 
      (recipe_id, cost_calculation_id, quote_no, channel, target_margin, base_price, discount, final_price, actual_margin, red_line_margin, status, approval_status, valid_from, valid_to)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      recipe_id, cost_calculation_id, quoteNo, channel || 'default',
      target_margin || 30, finalBasePrice, discount || 0,
      finalPrice, actualMargin, red_line_margin || 15,
      'active', needsApproval ? 'pending' : 'approved',
      valid_from, valid_to
    );
    
    res.json({
      id: result.lastInsertRowid,
      quote_no: quoteNo,
      unit_cost: unitCost,
      base_price: finalBasePrice,
      final_price: finalPrice,
      actual_margin: actualMargin,
      needs_approval: needsApproval,
      approval_status: needsApproval ? 'pending' : 'approved'
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { target_margin, base_price, discount, red_line_margin, status, valid_from, valid_to } = req.body;
  
  const quote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.id);
  if (!quote) {
    return res.status(404).json({ error: '报价单不存在' });
  }
  
  const costCalc = db.prepare('SELECT total_cost FROM cost_calculations WHERE id = ?').get(quote.cost_calculation_id);
  const unitCost = costCalc.total_cost;
  
  const calculatedBasePrice = unitCost / (1 - (target_margin / 100));
  const finalBasePrice = base_price || calculatedBasePrice;
  const finalPrice = finalBasePrice * (1 - (discount / 100));
  const actualMargin = ((finalPrice - unitCost) / finalPrice) * 100;
  
  const needsApproval = actualMargin < (red_line_margin || 15);
  
  try {
    db.prepare(`
      UPDATE quotes 
      SET target_margin = ?, base_price = ?, discount = ?, final_price = ?, 
          actual_margin = ?, red_line_margin = ?, status = ?, 
          approval_status = ?, valid_from = ?, valid_to = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      target_margin, finalBasePrice, discount, finalPrice,
      actualMargin, red_line_margin, status,
      needsApproval ? 'pending' : 'approved',
      valid_from, valid_to, req.params.id
    );
    
    res.json({
      success: true,
      unit_cost: unitCost,
      final_price: finalPrice,
      actual_margin: actualMargin,
      needs_approval: needsApproval
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/approve', (req, res) => {
  const { approver, action, comment } = req.body;
  
  const quote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.id);
  if (!quote) {
    return res.status(404).json({ error: '报价单不存在' });
  }
  
  const approvalStatus = action === 'approve' ? 'approved' : 'rejected';
  
  db.prepare(`
    INSERT INTO approval_records (quote_id, approver, action, comment)
    VALUES (?, ?, ?, ?)
  `).run(req.params.id, approver || 'system', action, comment);
  
  db.prepare(`
    UPDATE quotes 
    SET approval_status = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(approvalStatus, approver || 'system', req.params.id);
  
  res.json({ success: true, approval_status: approvalStatus });
});

router.delete('/:id', (req, res) => {
  db.prepare('UPDATE quotes SET status = ? WHERE id = ?').run('cancelled', req.params.id);
  res.json({ success: true });
});

router.get('/report/margin-summary', (req, res) => {
  const data = db.prepare(`
    SELECT 
      r.name as recipe_name,
      COUNT(q.id) as quote_count,
      AVG(q.actual_margin) as avg_margin,
      MIN(q.actual_margin) as min_margin,
      MAX(q.actual_margin) as max_margin,
      AVG(cc.total_cost) as avg_unit_cost,
      AVG(q.final_price) as avg_price
    FROM quotes q
    LEFT JOIN recipes r ON q.recipe_id = r.id
    LEFT JOIN cost_calculations cc ON q.cost_calculation_id = cc.id
    WHERE q.status = 'active'
    GROUP BY q.recipe_id
    ORDER BY avg_margin DESC
  `).all();
  
  res.json(data);
});

module.exports = router;
