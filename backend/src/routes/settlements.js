const Joi = require('joi');
const { db } = require('../database');

const settlementSchema = Joi.object({
  booking_id: Joi.number().integer().allow(null),
  total_revenue: Joi.number().allow(null),
  total_cost: Joi.number().allow(null),
  profit: Joi.number().allow(null),
  status: Joi.string().default('pending'),
  invoiced_at: Joi.string().allow(''),
  paid_at: Joi.string().allow(''),
  remarks: Joi.string().allow(''),
});

const settlementItemSchema = Joi.object({
  item_type: Joi.string().required(),
  description: Joi.string().required(),
  amount: Joi.number().required(),
  currency: Joi.string().required(),
  is_revenue: Joi.boolean().default(true),
});

function generateSettlementNo() {
  const date = new Date();
  const prefix = `SET${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  const row = db.prepare('SELECT MAX(id) as max_id FROM settlements').get();
  const seq = ((row?.max_id || 0) % 9999) + 1;
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

function updateSettlementTotals(settlementId) {
  const items = db.prepare('SELECT * FROM settlement_items WHERE settlement_id = ?').all(settlementId);
  let total_revenue = 0;
  let total_cost = 0;
  items.forEach(item => {
    if (item.is_revenue) {
      total_revenue += item.amount;
    } else {
      total_cost += item.amount;
    }
  });
  const profit = total_revenue - total_cost;
  db.prepare(`
    UPDATE settlements SET
      total_revenue = ?, total_cost = ?, profit = ?
    WHERE id = ?
  `).run(total_revenue, total_cost, profit, settlementId);
}

module.exports = function(app) {
  app.get('/api/settlements', (req, res) => {
    const { page = 1, pageSize = 20, status, booking_id } = req.query;
    let query = 'SELECT * FROM settlements WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (booking_id) {
      query += ' AND booking_id = ?';
      params.push(booking_id);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

    const settlements = db.prepare(query).all(...params);
    const total = db.prepare('SELECT COUNT(*) as count FROM settlements WHERE 1=1').get();

    res.json({
      success: true,
      data: settlements,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: total.count
      }
    });
  });

  app.get('/api/settlements/:id', (req, res) => {
    const settlement = db.prepare('SELECT * FROM settlements WHERE id = ?').get(req.params.id);
    if (!settlement) {
      return res.status(404).json({ success: false, message: '结算单不存在' });
    }
    const items = db.prepare('SELECT * FROM settlement_items WHERE settlement_id = ?').all(req.params.id);
    res.json({ success: true, data: { ...settlement, items } });
  });

  app.post('/api/settlements', (req, res) => {
    try {
      const validated = settlementSchema.validate(req.body);
      if (validated.error) {
        return res.status(400).json({ success: false, message: validated.error.message });
      }

      const settlement_no = generateSettlementNo();
      
      const result = db.prepare(`
        INSERT INTO settlements (
          settlement_no, booking_id, total_revenue, total_cost, profit,
          status, invoiced_at, paid_at, remarks
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        settlement_no, validated.value.booking_id, validated.value.total_revenue,
        validated.value.total_cost, validated.value.profit, validated.value.status,
        validated.value.invoiced_at, validated.value.paid_at, validated.value.remarks
      );

      const settlement = db.prepare('SELECT * FROM settlements WHERE id = ?').get(result.lastInsertRowid);
      res.json({ success: true, data: settlement });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });

  app.post('/api/settlements/:id/items', (req, res) => {
    try {
      const validated = settlementItemSchema.validate(req.body);
      if (validated.error) {
        return res.status(400).json({ success: false, message: validated.error.message });
      }

      const result = db.prepare(`
        INSERT INTO settlement_items (
          settlement_id, item_type, description, amount, currency, is_revenue
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        req.params.id, validated.value.item_type, validated.value.description,
        validated.value.amount, validated.value.currency, validated.value.is_revenue ? 1 : 0
      );

      updateSettlementTotals(req.params.id);
      const item = db.prepare('SELECT * FROM settlement_items WHERE id = ?').get(result.lastInsertRowid);
      res.json({ success: true, data: item });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });

  app.delete('/api/settlements/:id/items/:itemId', (req, res) => {
    db.prepare('DELETE FROM settlement_items WHERE id = ?').run(req.params.itemId);
    updateSettlementTotals(req.params.id);
    res.json({ success: true });
  });

  app.put('/api/settlements/:id', (req, res) => {
    try {
      const validated = settlementSchema.validate(req.body);
      if (validated.error) {
        return res.status(400).json({ success: false, message: validated.error.message });
      }

      db.prepare(`
        UPDATE settlements SET
          status = ?, invoiced_at = ?, paid_at = ?, remarks = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        validated.value.status, validated.value.invoiced_at, validated.value.paid_at,
        validated.value.remarks, req.params.id
      );

      const settlement = db.prepare('SELECT * FROM settlements WHERE id = ?').get(req.params.id);
      res.json({ success: true, data: settlement });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });

  app.get('/api/reports/profit', (req, res) => {
    const { start_date, end_date } = req.query;
    let query = `
      SELECT 
        s.*, 
        b.booking_no, 
        b.customer,
        COUNT(DISTINCT b.id) as booking_count
      FROM settlements s
      LEFT JOIN bookings b ON s.booking_id = b.id
      WHERE 1=1
    `;
    const params = [];
    if (start_date) {
      query += ' AND s.created_at >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND s.created_at <= ?';
      params.push(end_date);
    }
    query += ' GROUP BY s.id ORDER BY s.created_at DESC';
    
    const settlements = db.prepare(query).all(...params);
    const total_revenue = settlements.reduce((sum, s) => sum + (s.total_revenue || 0), 0);
    const total_cost = settlements.reduce((sum, s) => sum + (s.total_cost || 0), 0);
    const total_profit = total_revenue - total_cost;

    res.json({
      success: true,
      data: {
        settlements,
        summary: { total_revenue, total_cost, total_profit, booking_count: settlements.length }
      }
    });
  });
};
