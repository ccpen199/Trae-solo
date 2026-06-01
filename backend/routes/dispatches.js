const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  try {
    const db = req.app.locals.db;
    const { status, order_id, technician_id, dispatch_type, page = 1, pageSize = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    let countSql = 'SELECT COUNT(*) AS total FROM dispatches d WHERE 1=1';
    let dataSql = `
      SELECT d.*, o.order_no, o.consumer_name, t.name AS technician_name, sc.name AS service_center_name
      FROM dispatches d
      LEFT JOIN orders o ON d.order_id = o.id
      LEFT JOIN technicians t ON d.technician_id = t.id
      LEFT JOIN service_centers sc ON d.service_center_id = sc.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      const clause = ' AND d.status = ?';
      countSql += clause;
      dataSql += clause;
      params.push(status);
    }
    if (order_id) {
      const clause = ' AND d.order_id = ?';
      countSql += clause;
      dataSql += clause;
      params.push(order_id);
    }
    if (technician_id) {
      const clause = ' AND d.technician_id = ?';
      countSql += clause;
      dataSql += clause;
      params.push(technician_id);
    }
    if (dispatch_type) {
      const clause = ' AND d.dispatch_type = ?';
      countSql += clause;
      dataSql += clause;
      params.push(dispatch_type);
    }

    const total = db.prepare(countSql).get(...params).total;
    dataSql += ' ORDER BY d.created_at DESC LIMIT ? OFFSET ?';
    const dispatches = db.prepare(dataSql).all(...params, parseInt(pageSize), offset);

    res.json({
      data: dispatches,
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

router.post('/auto-match', (req, res) => {
  try {
    const db = req.app.locals.db;
    const { order_id } = req.body;
    if (!order_id) return res.status(400).json({ error: 'order_id is required' });

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const productType = (order.product_model || '').split(/\s+/)[0] || '';

    const candidates = db.prepare(`
      SELECT t.*, sc.name AS service_center_name
      FROM technicians t
      LEFT JOIN service_centers sc ON t.service_center_id = sc.id
      WHERE t.status = 'available'
        AND (t.service_center_id = ? OR ? IS NULL)
    `).all(order.service_center_id, order.service_center_id);

    let bestMatch = null;
    let bestScore = -1;

    for (const tech of candidates) {
      let score = 0;
      let skills = [];
      try { skills = JSON.parse(tech.skills); } catch { /* keep empty */ }
      let brandAuths = [];
      try { brandAuths = JSON.parse(tech.brand_authorizations); } catch { /* keep empty */ }

      if (skills.some(s => productType.includes(s))) score += 10;
      if (brandAuths.includes(String(order.brand_id))) score += 5;
      if (tech.service_center_id === order.service_center_id) score += 3;

      if (score > bestScore) {
        bestScore = score;
        bestMatch = tech;
      }
    }

    if (!bestMatch) {
      return res.status(404).json({ error: 'No available technician found matching the criteria' });
    }

    res.json({ technician: bestMatch, score: bestScore });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const db = req.app.locals.db;
    const { order_id, technician_id, service_center_id, dispatch_type } = req.body;

    if (!order_id || !technician_id) {
      return res.status(400).json({ error: 'order_id and technician_id are required' });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const result = db.prepare(`
      INSERT INTO dispatches (order_id, technician_id, service_center_id, dispatch_type, status, dispatch_time)
      VALUES (?, ?, ?, ?, 'assigned', CURRENT_TIMESTAMP)
    `).run(order_id, technician_id, service_center_id || order.service_center_id, dispatch_type || 'auto');

    db.prepare("UPDATE orders SET status = 'dispatched', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(order_id);

    const dispatch = db.prepare(`
      SELECT d.*, o.order_no, o.consumer_name, t.name AS technician_name, sc.name AS service_center_name
      FROM dispatches d
      LEFT JOIN orders o ON d.order_id = o.id
      LEFT JOIN technicians t ON d.technician_id = t.id
      LEFT JOIN service_centers sc ON d.service_center_id = sc.id
      WHERE d.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(dispatch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const db = req.app.locals.db;
    const dispatch = db.prepare('SELECT * FROM dispatches WHERE id = ?').get(req.params.id);
    if (!dispatch) return res.status(404).json({ error: 'Dispatch not found' });

    const { status, reject_reason, technician_id } = req.body;

    if (status === 'accepted') {
      db.prepare(`
        UPDATE dispatches SET status = 'accepted', accept_time = CURRENT_TIMESTAMP WHERE id = ?
      `).run(req.params.id);
      db.prepare("UPDATE orders SET status = 'installing', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(dispatch.order_id);
      db.prepare("UPDATE technicians SET status = 'busy' WHERE id = ?").run(dispatch.technician_id);
    } else if (status === 'rejected') {
      db.prepare(`
        UPDATE dispatches SET status = 'rejected', reject_reason = ? WHERE id = ?
      `).run(reject_reason || '', req.params.id);
    } else if (status === 'completed') {
      db.prepare("UPDATE dispatches SET status = 'completed' WHERE id = ?").run(req.params.id);
      db.prepare("UPDATE orders SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(dispatch.order_id);
      db.prepare("UPDATE technicians SET status = 'available' WHERE id = ?").run(dispatch.technician_id);
    } else if (technician_id) {
      db.prepare(`
        UPDATE dispatches SET technician_id = ? WHERE id = ?
      `).run(technician_id, req.params.id);
    }

    const updated = db.prepare(`
      SELECT d.*, o.order_no, o.consumer_name, t.name AS technician_name, sc.name AS service_center_name
      FROM dispatches d
      LEFT JOIN orders o ON d.order_id = o.id
      LEFT JOIN technicians t ON d.technician_id = t.id
      LEFT JOIN service_centers sc ON d.service_center_id = sc.id
      WHERE d.id = ?
    `).get(req.params.id);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
