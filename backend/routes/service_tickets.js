const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  try {
    const db = req.app.locals.db;
    const { status, type, order_id, page = 1, pageSize = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    let countSql = 'SELECT COUNT(*) AS total FROM service_tickets st WHERE 1=1';
    let dataSql = `
      SELECT st.*, o.order_no, o.consumer_name
      FROM service_tickets st
      LEFT JOIN orders o ON st.order_id = o.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      const clause = ' AND st.status = ?';
      countSql += clause;
      dataSql += clause;
      params.push(status);
    }
    if (type) {
      const clause = ' AND st.type = ?';
      countSql += clause;
      dataSql += clause;
      params.push(type);
    }
    if (order_id) {
      const clause = ' AND st.order_id = ?';
      countSql += clause;
      dataSql += clause;
      params.push(order_id);
    }

    const total = db.prepare(countSql).get(...params).total;
    dataSql += ' ORDER BY st.created_at DESC LIMIT ? OFFSET ?';
    const tickets = db.prepare(dataSql).all(...params, parseInt(pageSize), offset);

    res.json({
      data: tickets,
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
    const ticket = db.prepare(`
      SELECT st.*, o.order_no, o.consumer_name
      FROM service_tickets st
      LEFT JOIN orders o ON st.order_id = o.id
      WHERE st.id = ?
    `).get(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Service ticket not found' });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const db = req.app.locals.db;
    const { order_id, type, description } = req.body;

    if (!order_id || !type || !description) {
      return res.status(400).json({ error: 'order_id, type, and description are required' });
    }

    const validTypes = ['reschedule', 'complaint', 'second_visit', 'missing_parts', 'charge_dispute'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: `Invalid type. Allowed: ${validTypes.join(', ')}` });
    }

    const result = db.prepare(`
      INSERT INTO service_tickets (order_id, type, description, status)
      VALUES (?, ?, ?, 'open')
    `).run(order_id, type, description);

    const ticket = db.prepare(`
      SELECT st.*, o.order_no, o.consumer_name
      FROM service_tickets st
      LEFT JOIN orders o ON st.order_id = o.id
      WHERE st.id = ?
    `).get(result.lastInsertRowid);
    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const db = req.app.locals.db;
    const ticket = db.prepare('SELECT * FROM service_tickets WHERE id = ?').get(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Service ticket not found' });

    const { status, handler_name, resolution } = req.body;

    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Allowed: ${validStatuses.join(', ')}` });
    }

    const newStatus = status || ticket.status;
    let newHandler = handler_name ?? ticket.handler_name;
    let newResolution = resolution ?? ticket.resolution;

    if (newStatus === 'in_progress' && !newHandler) {
      return res.status(400).json({ error: 'handler_name is required when setting status to in_progress' });
    }
    if (newStatus === 'resolved' && !newResolution) {
      return res.status(400).json({ error: 'resolution is required when setting status to resolved' });
    }

    db.prepare(`
      UPDATE service_tickets SET status = ?, handler_name = ?, resolution = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newStatus, newHandler, newResolution, req.params.id);

    const updated = db.prepare(`
      SELECT st.*, o.order_no, o.consumer_name
      FROM service_tickets st
      LEFT JOIN orders o ON st.order_id = o.id
      WHERE st.id = ?
    `).get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
