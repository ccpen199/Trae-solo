const Joi = require('joi');
const { db } = require('../database');

const bookingSchema = Joi.object({
  quotation_id: Joi.number().integer().allow(null),
  space_confirmation_id: Joi.number().integer().allow(null),
  customer: Joi.string().required(),
  operator: Joi.string().allow(''),
  status: Joi.string().default('draft'),
  cut_off_time: Joi.string().allow(''),
  port_cut_off_time: Joi.string().allow(''),
  so_no: Joi.string().allow(''),
  remarks: Joi.string().allow(''),
  created_by: Joi.string().allow(''),
});

function generateBookingNo() {
  const date = new Date();
  const prefix = `BKG${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  const row = db.prepare('SELECT MAX(id) as max_id FROM bookings').get();
  const seq = ((row?.max_id || 0) % 9999) + 1;
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

module.exports = function(app) {
  app.get('/api/bookings', (req, res) => {
    const { page = 1, pageSize = 20, status, customer } = req.query;
    let query = 'SELECT * FROM bookings WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (customer) {
      query += ' AND customer LIKE ?';
      params.push(`%${customer}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

    const bookings = db.prepare(query).all(...params);
    const total = db.prepare('SELECT COUNT(*) as count FROM bookings WHERE 1=1').get();

    res.json({
      success: true,
      data: bookings,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: total.count
      }
    });
  });

  app.get('/api/bookings/:id', (req, res) => {
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: '订舱单不存在' });
    }
    res.json({ success: true, data: booking });
  });

  app.post('/api/bookings', (req, res) => {
    try {
      const validated = bookingSchema.validate(req.body);
      if (validated.error) {
        return res.status(400).json({ success: false, message: validated.error.message });
      }

      if (validated.value.status === 'confirmed' && !validated.value.space_confirmation_id) {
        return res.status(400).json({ success: false, message: '舱位未确认前不能设置为已订舱状态' });
      }

      const space = validated.value.space_confirmation_id 
        ? db.prepare('SELECT * FROM space_confirmations WHERE id = ?').get(validated.value.space_confirmation_id)
        : null;

      if (space && space.status !== 'confirmed') {
        return res.status(400).json({ success: false, message: '舱位未确认前不能设置为已订舱状态' });
      }

      const booking_no = generateBookingNo();
      
      const result = db.prepare(`
        INSERT INTO bookings (
          booking_no, quotation_id, space_confirmation_id, customer, operator,
          status, cut_off_time, port_cut_off_time, so_no, remarks, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        booking_no, validated.value.quotation_id, validated.value.space_confirmation_id,
        validated.value.customer, validated.value.operator, validated.value.status,
        validated.value.cut_off_time, validated.value.port_cut_off_time,
        validated.value.so_no, validated.value.remarks, validated.value.created_by
      );

      const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(result.lastInsertRowid);
      res.json({ success: true, data: booking });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });

  app.put('/api/bookings/:id', (req, res) => {
    try {
      const validated = bookingSchema.validate(req.body);
      if (validated.error) {
        return res.status(400).json({ success: false, message: validated.error.message });
      }

      if (validated.value.status === 'confirmed' && !validated.value.space_confirmation_id) {
        return res.status(400).json({ success: false, message: '舱位未确认前不能设置为已订舱状态' });
      }

      db.prepare(`
        UPDATE bookings SET
          quotation_id = ?, space_confirmation_id = ?, customer = ?, operator = ?,
          status = ?, cut_off_time = ?, port_cut_off_time = ?, so_no = ?,
          remarks = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        validated.value.quotation_id, validated.value.space_confirmation_id,
        validated.value.customer, validated.value.operator, validated.value.status,
        validated.value.cut_off_time, validated.value.port_cut_off_time,
        validated.value.so_no, validated.value.remarks, req.params.id
      );

      const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
      res.json({ success: true, data: booking });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });

  app.delete('/api/bookings/:id', (req, res) => {
    db.prepare('DELETE FROM bookings WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });
};
