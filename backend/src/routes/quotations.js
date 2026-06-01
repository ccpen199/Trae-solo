const Joi = require('joi');
const { db } = require('../database');

const quotationSchema = Joi.object({
  inquiry_id: Joi.number().integer().allow(null),
  shipping_line: Joi.string().required(),
  freight_rate: Joi.number().required(),
  currency: Joi.string().required(),
  surcharges: Joi.string().allow(''),
  local_charges: Joi.string().allow(''),
  valid_from: Joi.string().required(),
  valid_until: Joi.string().required(),
  status: Joi.string().default('draft'),
  remarks: Joi.string().allow(''),
  created_by: Joi.string().allow(''),
});

function generateQuotationNo() {
  const date = new Date();
  const prefix = `QUT${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  const row = db.prepare('SELECT MAX(id) as max_id FROM quotations').get();
  const seq = ((row?.max_id || 0) % 9999) + 1;
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

module.exports = function(app) {
  app.get('/api/quotations', (req, res) => {
    const { page = 1, pageSize = 20, status, inquiry_id } = req.query;
    let query = 'SELECT * FROM quotations WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (inquiry_id) {
      query += ' AND inquiry_id = ?';
      params.push(inquiry_id);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

    const quotations = db.prepare(query).all(...params);
    const total = db.prepare('SELECT COUNT(*) as count FROM quotations WHERE 1=1').get();

    res.json({
      success: true,
      data: quotations,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: total.count
      }
    });
  });

  app.get('/api/quotations/:id', (req, res) => {
    const quotation = db.prepare('SELECT * FROM quotations WHERE id = ?').get(req.params.id);
    if (!quotation) {
      return res.status(404).json({ success: false, message: '报价单不存在' });
    }
    res.json({ success: true, data: quotation });
  });

  app.post('/api/quotations', (req, res) => {
    try {
      const validated = quotationSchema.validate(req.body);
      if (validated.error) {
        return res.status(400).json({ success: false, message: validated.error.message });
      }
      const quotation_no = generateQuotationNo();

      const result = db.prepare(`
        INSERT INTO quotations (
          quotation_no, inquiry_id, shipping_line, freight_rate, currency,
          surcharges, local_charges, valid_from, valid_until, status, remarks, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        quotation_no, validated.value.inquiry_id, validated.value.shipping_line, validated.value.freight_rate,
        validated.value.currency, validated.value.surcharges, validated.value.local_charges, validated.value.valid_from,
        validated.value.valid_until, validated.value.status, validated.value.remarks, validated.value.created_by
      );

      const quotation = db.prepare('SELECT * FROM quotations WHERE id = ?').get(result.lastInsertRowid);
      res.json({ success: true, data: quotation });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });

  app.put('/api/quotations/:id', (req, res) => {
    try {
      const quotation = db.prepare('SELECT * FROM quotations WHERE id = ?').get(req.params.id);
      if (!quotation) {
        return res.status(404).json({ success: false, message: '报价单不存在' });
      }
      if (quotation.is_locked) {
        return res.status(400).json({ success: false, message: '报价已锁定，无法修改' });
      }

      const validated = quotationSchema.validate(req.body);
      if (validated.error) {
        return res.status(400).json({ success: false, message: validated.error.message });
      }

      db.prepare(`
        UPDATE quotations SET
          shipping_line = ?, freight_rate = ?, currency = ?, surcharges = ?,
          local_charges = ?, valid_from = ?, valid_until = ?, status = ?,
          remarks = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        validated.value.shipping_line, validated.value.freight_rate, validated.value.currency, validated.value.surcharges,
        validated.value.local_charges, validated.value.valid_from, validated.value.valid_until, validated.value.status,
        validated.value.remarks, req.params.id
      );

      const updated = db.prepare('SELECT * FROM quotations WHERE id = ?').get(req.params.id);
      res.json({ success: true, data: updated });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });

  app.post('/api/quotations/:id/lock', (req, res) => {
    const { locked_by } = req.body;
    const quotation = db.prepare('SELECT * FROM quotations WHERE id = ?').get(req.params.id);
    if (!quotation) {
      return res.status(404).json({ success: false, message: '报价单不存在' });
    }

    db.prepare(`
      UPDATE quotations SET
        is_locked = 1, locked_at = CURRENT_TIMESTAMP, locked_by = ?, status = 'confirmed'
      WHERE id = ?
    `).run(locked_by || 'system', req.params.id);

    const updated = db.prepare('SELECT * FROM quotations WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: updated });
  });

  app.delete('/api/quotations/:id', (req, res) => {
    db.prepare('DELETE FROM quotations WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });
};
