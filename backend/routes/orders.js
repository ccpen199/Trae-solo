const express = require('express');
const router = express.Router();

function parseOrder(row) {
  if (!row) return row;
  if (row.skills) { try { row.skills = JSON.parse(row.skills); } catch { /* keep */ } }
  return row;
}

router.get('/stats', (req, res) => {
  try {
    const db = req.app.locals.db;
    const total = db.prepare('SELECT COUNT(*) AS count FROM orders').get().count;
    const byStatus = db.prepare('SELECT status, COUNT(*) AS count FROM orders GROUP BY status').all();
    const byBrand = db.prepare(`
      SELECT b.name AS brand_name, COUNT(*) AS count
      FROM orders o
      LEFT JOIN brands b ON o.brand_id = b.id
      GROUP BY o.brand_id
    `).all();
    const today = new Date().toISOString().slice(0, 10);
    const todayCount = db.prepare('SELECT COUNT(*) AS count FROM orders WHERE DATE(created_at) = ?').get(today).count;
    res.json({ total, byStatus, byBrand, todayCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', (req, res) => {
  try {
    const db = req.app.locals.db;
    const { status, brand_id, search, page = 1, pageSize = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    let countSql = 'SELECT COUNT(*) AS total FROM orders o WHERE 1=1';
    let dataSql = `
      SELECT o.*, b.name AS brand_name, sc.name AS service_center_name
      FROM orders o
      LEFT JOIN brands b ON o.brand_id = b.id
      LEFT JOIN service_centers sc ON o.service_center_id = sc.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      const clause = ' AND o.status = ?';
      countSql += clause;
      dataSql += clause;
      params.push(status);
    }
    if (brand_id) {
      const clause = ' AND o.brand_id = ?';
      countSql += clause;
      dataSql += clause;
      params.push(brand_id);
    }
    if (search) {
      const clause = ' AND (o.order_no LIKE ? OR o.consumer_name LIKE ? OR o.consumer_phone LIKE ? OR o.product_model LIKE ?)';
      countSql += clause;
      dataSql += clause;
      const like = `%${search}%`;
      params.push(like, like, like, like);
    }

    const total = db.prepare(countSql).get(...params).total;
    dataSql += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    const orders = db.prepare(dataSql).all(...params, parseInt(pageSize), offset);

    res.json({
      data: orders,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / parseInt(pageSize))
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const db = req.app.locals.db;
    const order = db.prepare(`
      SELECT o.*, b.name AS brand_name, sc.name AS service_center_name
      FROM orders o
      LEFT JOIN brands b ON o.brand_id = b.id
      LEFT JOIN service_centers sc ON o.service_center_id = sc.id
      WHERE o.id = ?
    `).get(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const db = req.app.locals.db;
    const maxOrder = db.prepare("SELECT MAX(order_no) AS max_no FROM orders WHERE order_no LIKE 'INS2026%'").get();
    let nextNum = 1;
    if (maxOrder && maxOrder.max_no) {
      nextNum = parseInt(maxOrder.max_no.replace('INS2026', '')) + 1;
    }
    const orderNo = `INS2026${String(nextNum).padStart(4, '0')}`;

    const {
      consumer_name, consumer_phone, product_model, purchase_channel,
      install_address, appointment_time, parts_requirements,
      warranty_status, brand_id, service_center_id
    } = req.body;

    if (!consumer_name) return res.status(400).json({ error: 'consumer_name is required' });

    const result = db.prepare(`
      INSERT INTO orders (order_no, consumer_name, consumer_phone, product_model, purchase_channel, install_address, appointment_time, parts_requirements, warranty_status, status, brand_id, service_center_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `).run(
      orderNo, consumer_name, consumer_phone, product_model, purchase_channel,
      install_address, appointment_time, parts_requirements,
      warranty_status || 'in_warranty', brand_id, service_center_id
    );

    const order = db.prepare(`
      SELECT o.*, b.name AS brand_name, sc.name AS service_center_name
      FROM orders o
      LEFT JOIN brands b ON o.brand_id = b.id
      LEFT JOIN service_centers sc ON o.service_center_id = sc.id
      WHERE o.id = ?
    `).get(result.lastInsertRowid);
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const db = req.app.locals.db;
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const {
      consumer_name, consumer_phone, product_model, purchase_channel,
      install_address, appointment_time, parts_requirements,
      warranty_status, status, brand_id, service_center_id
    } = req.body;

    db.prepare(`
      UPDATE orders SET
        consumer_name = ?, consumer_phone = ?, product_model = ?, purchase_channel = ?,
        install_address = ?, appointment_time = ?, parts_requirements = ?,
        warranty_status = ?, status = ?, brand_id = ?, service_center_id = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      consumer_name ?? order.consumer_name,
      consumer_phone ?? order.consumer_phone,
      product_model ?? order.product_model,
      purchase_channel ?? order.purchase_channel,
      install_address ?? order.install_address,
      appointment_time ?? order.appointment_time,
      parts_requirements ?? order.parts_requirements,
      warranty_status ?? order.warranty_status,
      status ?? order.status,
      brand_id ?? order.brand_id,
      service_center_id ?? order.service_center_id,
      req.params.id
    );

    const updated = db.prepare(`
      SELECT o.*, b.name AS brand_name, sc.name AS service_center_name
      FROM orders o
      LEFT JOIN brands b ON o.brand_id = b.id
      LEFT JOIN service_centers sc ON o.service_center_id = sc.id
      WHERE o.id = ?
    `).get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
