const Joi = require('joi');
const { db } = require('../database');

const inquirySchema = Joi.object({
  origin_port: Joi.string().required(),
  destination_port: Joi.string().required(),
  container_type: Joi.string().required(),
  container_count: Joi.number().integer().min(1).required(),
  sailing_date: Joi.string().allow(''),
  customer: Joi.string().required(),
  cargo_type: Joi.string().required(),
  cargo_attributes: Joi.string().allow(''),
  is_dangerous: Joi.boolean().default(false),
  dangerous_details: Joi.string().allow(''),
  is_refrigerated: Joi.boolean().default(false),
  refrigerated_details: Joi.string().allow(''),
  valid_until: Joi.string().required(),
  status: Joi.string().default('pending'),
  remarks: Joi.string().allow(''),
  created_by: Joi.string().allow(''),
});

function generateInquiryNo() {
  const date = new Date();
  const prefix = `INQ${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  const row = db.prepare('SELECT MAX(id) as max_id FROM inquiries').get();
  const seq = ((row?.max_id || 0) % 9999) + 1;
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

function validateDangerousCargo(data) {
  if (data.is_dangerous && !data.dangerous_details) {
    throw new Error('危险品必须提供详细信息');
  }
}

function validateRefrigeratedCargo(data) {
  if (data.is_refrigerated && !data.refrigerated_details) {
    throw new Error('冷藏货必须提供温度要求等详细信息');
  }
}

module.exports = function(app) {
  app.get('/api/inquiries', (req, res) => {
    const { page = 1, pageSize = 20, status, customer } = req.query;
    let query = 'SELECT * FROM inquiries WHERE 1=1';
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

    const inquiries = db.prepare(query).all(...params);
    const total = db.prepare('SELECT COUNT(*) as count FROM inquiries WHERE 1=1').get();

    res.json({
      success: true,
      data: inquiries,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: total.count
      }
    });
  });

  app.get('/api/inquiries/:id', (req, res) => {
    const inquiry = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ success: false, message: '询价单不存在' });
    }
    res.json({ success: true, data: inquiry });
  });

  app.post('/api/inquiries', (req, res) => {
    try {
      const validated = inquirySchema.validate(req.body);
      if (validated.error) {
        return res.status(400).json({ success: false, message: validated.error.message });
      }
      
      validateDangerousCargo(validated.value);
      validateRefrigeratedCargo(validated.value);

      const inquiry_no = generateInquiryNo();
      
      const result = db.prepare(`
        INSERT INTO inquiries (
          inquiry_no, origin_port, destination_port, container_type, container_count,
          sailing_date, customer, cargo_type, cargo_attributes, is_dangerous,
          dangerous_details, is_refrigerated, refrigerated_details, valid_until,
          status, remarks, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        inquiry_no, validated.value.origin_port, validated.value.destination_port, validated.value.container_type,
        validated.value.container_count, validated.value.sailing_date, validated.value.customer, validated.value.cargo_type,
        validated.value.cargo_attributes, validated.value.is_dangerous ? 1 : 0, validated.value.dangerous_details,
        validated.value.is_refrigerated ? 1 : 0, validated.value.refrigerated_details, validated.value.valid_until,
        validated.value.status, validated.value.remarks, validated.value.created_by
      );

      const inquiry = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(result.lastInsertRowid);
      res.json({ success: true, data: inquiry });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });

  app.put('/api/inquiries/:id', (req, res) => {
    try {
      const validated = inquirySchema.validate(req.body);
      if (validated.error) {
        return res.status(400).json({ success: false, message: validated.error.message });
      }
      
      validateDangerousCargo(validated.value);
      validateRefrigeratedCargo(validated.value);

      db.prepare(`
        UPDATE inquiries SET
          origin_port = ?, destination_port = ?, container_type = ?, container_count = ?,
          sailing_date = ?, customer = ?, cargo_type = ?, cargo_attributes = ?,
          is_dangerous = ?, dangerous_details = ?, is_refrigerated = ?, refrigerated_details = ?,
          valid_until = ?, status = ?, remarks = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        validated.value.origin_port, validated.value.destination_port, validated.value.container_type,
        validated.value.container_count, validated.value.sailing_date, validated.value.customer, validated.value.cargo_type,
        validated.value.cargo_attributes, validated.value.is_dangerous ? 1 : 0, validated.value.dangerous_details,
        validated.value.is_refrigerated ? 1 : 0, validated.value.refrigerated_details, validated.value.valid_until,
        validated.value.status, validated.value.remarks, req.params.id
      );

      const inquiry = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(req.params.id);
      res.json({ success: true, data: inquiry });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });

  app.delete('/api/inquiries/:id', (req, res) => {
    db.prepare('DELETE FROM inquiries WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });
};
