const Joi = require('joi');
const { db } = require('../database');

const spaceSchema = Joi.object({
  quotation_id: Joi.number().integer().allow(null),
  vessel: Joi.string().allow(''),
  voyage: Joi.string().allow(''),
  etd: Joi.string().allow(''),
  eta: Joi.string().allow(''),
  cut_off_time: Joi.string().allow(''),
  port_cut_off_time: Joi.string().allow(''),
  status: Joi.string().default('pending'),
  confirmed_by: Joi.string().allow(''),
  remarks: Joi.string().allow(''),
});

function generateSpaceNo() {
  const date = new Date();
  const prefix = `SPC${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  const row = db.prepare('SELECT MAX(id) as max_id FROM space_confirmations').get();
  const seq = ((row?.max_id || 0) % 9999) + 1;
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

module.exports = function(app) {
  app.get('/api/space', (req, res) => {
    const { page = 1, pageSize = 20, status, quotation_id } = req.query;
    let query = 'SELECT * FROM space_confirmations WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (quotation_id) {
      query += ' AND quotation_id = ?';
      params.push(quotation_id);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

    const spaces = db.prepare(query).all(...params);
    const total = db.prepare('SELECT COUNT(*) as count FROM space_confirmations WHERE 1=1').get();

    res.json({
      success: true,
      data: spaces,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: total.count
      }
    });
  });

  app.get('/api/space/:id', (req, res) => {
    const space = db.prepare('SELECT * FROM space_confirmations WHERE id = ?').get(req.params.id);
    if (!space) {
      return res.status(404).json({ success: false, message: '舱位确认单不存在' });
    }
    res.json({ success: true, data: space });
  });

  app.post('/api/space', (req, res) => {
    try {
      const validated = spaceSchema.validate(req.body);
      if (validated.error) {
        return res.status(400).json({ success: false, message: validated.error.message });
      }

      const confirmation_no = generateSpaceNo();
      
      const result = db.prepare(`
        INSERT INTO space_confirmations (
          confirmation_no, quotation_id, vessel, voyage, etd, eta,
          cut_off_time, port_cut_off_time, status, remarks
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        confirmation_no, validated.value.quotation_id, validated.value.vessel,
        validated.value.voyage, validated.value.etd, validated.value.eta,
        validated.value.cut_off_time, validated.value.port_cut_off_time,
        validated.value.status, validated.value.remarks
      );

      const space = db.prepare('SELECT * FROM space_confirmations WHERE id = ?').get(result.lastInsertRowid);
      res.json({ success: true, data: space });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });

  app.post('/api/space/:id/confirm', (req, res) => {
    const { confirmed_by } = req.body;
    db.prepare(`
      UPDATE space_confirmations SET
        status = 'confirmed', confirmed_at = CURRENT_TIMESTAMP, confirmed_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(confirmed_by || 'system', req.params.id);

    const space = db.prepare('SELECT * FROM space_confirmations WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: space });
  });

  app.post('/api/space/:id/cancel', (req, res) => {
    db.prepare(`
      UPDATE space_confirmations SET
        status = 'cancelled', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.params.id);

    const space = db.prepare('SELECT * FROM space_confirmations WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: space });
  });

  app.put('/api/space/:id', (req, res) => {
    try {
      const validated = spaceSchema.validate(req.body);
      if (validated.error) {
        return res.status(400).json({ success: false, message: validated.error.message });
      }

      db.prepare(`
        UPDATE space_confirmations SET
          vessel = ?, voyage = ?, etd = ?, eta = ?, cut_off_time = ?,
          port_cut_off_time = ?, status = ?, remarks = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        validated.value.vessel, validated.value.voyage, validated.value.etd,
        validated.value.eta, validated.value.cut_off_time, validated.value.port_cut_off_time,
        validated.value.status, validated.value.remarks, req.params.id
      );

      const space = db.prepare('SELECT * FROM space_confirmations WHERE id = ?').get(req.params.id);
      res.json({ success: true, data: space });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });
};
