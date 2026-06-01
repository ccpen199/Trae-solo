const Joi = require('joi');
const { db } = require('../database');

const blSchema = Joi.object({
  booking_id: Joi.number().integer().allow(null),
  shipper: Joi.string().required(),
  consignee: Joi.string().required(),
  notify_party: Joi.string().allow(''),
  marks: Joi.string().allow(''),
  description: Joi.string().allow(''),
  release_type: Joi.string().allow(''),
  status: Joi.string().default('draft'),
  customer_confirmed: Joi.boolean().default(false),
  remarks: Joi.string().allow(''),
});

function generateBLNo() {
  const date = new Date();
  const prefix = `BL${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  const row = db.prepare('SELECT MAX(id) as max_id FROM bill_of_lading').get();
  const seq = ((row?.max_id || 0) % 9999) + 1;
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

module.exports = function(app) {
  app.get('/api/bl', (req, res) => {
    const { page = 1, pageSize = 20, status, booking_id } = req.query;
    let query = 'SELECT * FROM bill_of_lading WHERE 1=1';
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

    const bls = db.prepare(query).all(...params);
    const total = db.prepare('SELECT COUNT(*) as count FROM bill_of_lading WHERE 1=1').get();

    res.json({
      success: true,
      data: bls,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: total.count
      }
    });
  });

  app.get('/api/bl/:id', (req, res) => {
    const bl = db.prepare('SELECT * FROM bill_of_lading WHERE id = ?').get(req.params.id);
    if (!bl) {
      return res.status(404).json({ success: false, message: '提单不存在' });
    }
    res.json({ success: true, data: bl });
  });

  app.get('/api/bl/:id/revisions', (req, res) => {
    const revisions = db.prepare('SELECT * FROM bl_revisions WHERE bl_id = ? ORDER BY created_at DESC').all(req.params.id);
    res.json({ success: true, data: revisions });
  });

  app.post('/api/bl', (req, res) => {
    try {
      const validated = blSchema.validate(req.body);
      if (validated.error) {
        return res.status(400).json({ success: false, message: validated.error.message });
      }

      const bl_no = generateBLNo();
      
      const result = db.prepare(`
        INSERT INTO bill_of_lading (
          bl_no, booking_id, shipper, consignee, notify_party, marks,
          description, release_type, status, customer_confirmed, remarks
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        bl_no, validated.value.booking_id, validated.value.shipper, validated.value.consignee,
        validated.value.notify_party, validated.value.marks, validated.value.description,
        validated.value.release_type, validated.value.status, validated.value.customer_confirmed ? 1 : 0,
        validated.value.remarks
      );

      const bl = db.prepare('SELECT * FROM bill_of_lading WHERE id = ?').get(result.lastInsertRowid);
      res.json({ success: true, data: bl });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });

  app.put('/api/bl/:id', (req, res) => {
    try {
      const bl = db.prepare('SELECT * FROM bill_of_lading WHERE id = ?').get(req.params.id);
      if (!bl) {
        return res.status(404).json({ success: false, message: '提单不存在' });
      }

      const revision = db.prepare('SELECT MAX(version) as max_version FROM bl_revisions WHERE bl_id = ?').get(req.params.id);
      const nextVersion = (revision?.max_version || 0) + 1;
      db.prepare(`
        INSERT INTO bl_revisions (bl_id, version, content, changed_by, reason)
        VALUES (?, ?, ?, ?, ?)
      `).run(req.params.id, nextVersion, JSON.stringify(bl), req.body.changed_by || 'system', '修改前版本');

      const validated = blSchema.validate(req.body);
      if (validated.error) {
        return res.status(400).json({ success: false, message: validated.error.message });
      }

      db.prepare(`
        UPDATE bill_of_lading SET
          shipper = ?, consignee = ?, notify_party = ?, marks = ?,
          description = ?, release_type = ?, status = ?, remarks = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        validated.value.shipper, validated.value.consignee, validated.value.notify_party,
        validated.value.marks, validated.value.description, validated.value.release_type,
        validated.value.status, validated.value.remarks, req.params.id
      );

      const updated = db.prepare('SELECT * FROM bill_of_lading WHERE id = ?').get(req.params.id);
      res.json({ success: true, data: updated });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });

  app.post('/api/bl/:id/confirm', (req, res) => {
    db.prepare(`
      UPDATE bill_of_lading SET
        customer_confirmed = 1, confirmed_at = CURRENT_TIMESTAMP, confirmed_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.body.confirmed_by || 'customer', req.params.id);

    const bl = db.prepare('SELECT * FROM bill_of_lading WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: bl });
  });

  app.delete('/api/bl/:id', (req, res) => {
    db.prepare('DELETE FROM bl_revisions WHERE bl_id = ?').run(req.params.id);
    db.prepare('DELETE FROM bill_of_lading WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });
};
