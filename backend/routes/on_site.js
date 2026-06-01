const express = require('express');
const router = express.Router();

function parseRecord(row) {
  if (!row) return row;
  try { row.unboxing_photos = JSON.parse(row.unboxing_photos); } catch { /* keep */ }
  try { row.install_steps = JSON.parse(row.install_steps); } catch { /* keep */ }
  try { row.auxiliary_charges = JSON.parse(row.auxiliary_charges); } catch { /* keep */ }
  return row;
}

router.get('/', (req, res) => {
  try {
    const db = req.app.locals.db;
    const { order_id, technician_id, status, page = 1, pageSize = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    let countSql = 'SELECT COUNT(*) AS total FROM on_site_records r WHERE 1=1';
    let dataSql = `
      SELECT r.*, o.order_no, o.consumer_name, t.name AS technician_name
      FROM on_site_records r
      LEFT JOIN orders o ON r.order_id = o.id
      LEFT JOIN technicians t ON r.technician_id = t.id
      WHERE 1=1
    `;
    const params = [];

    if (order_id) {
      const clause = ' AND r.order_id = ?';
      countSql += clause;
      dataSql += clause;
      params.push(order_id);
    }
    if (technician_id) {
      const clause = ' AND r.technician_id = ?';
      countSql += clause;
      dataSql += clause;
      params.push(technician_id);
    }
    if (status) {
      const clause = ' AND r.status = ?';
      countSql += clause;
      dataSql += clause;
      params.push(status);
    }

    const total = db.prepare(countSql).get(...params).total;
    dataSql += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
    const records = db.prepare(dataSql).all(...params, parseInt(pageSize), offset);
    records.forEach(parseRecord);

    res.json({
      data: records,
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
    const record = db.prepare(`
      SELECT r.*, o.order_no, o.consumer_name, t.name AS technician_name
      FROM on_site_records r
      LEFT JOIN orders o ON r.order_id = o.id
      LEFT JOIN technicians t ON r.technician_id = t.id
      WHERE r.id = ?
    `).get(req.params.id);
    if (!record) return res.status(404).json({ error: 'On-site record not found' });
    parseRecord(record);
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const db = req.app.locals.db;
    const {
      order_id, technician_id, latitude, longitude,
      unboxing_photos, install_steps, auxiliary_charges,
      user_signature, exception_notes, status
    } = req.body;

    if (!order_id || !technician_id) {
      return res.status(400).json({ error: 'order_id and technician_id are required' });
    }

    const result = db.prepare(`
      INSERT INTO on_site_records (order_id, technician_id, latitude, longitude, unboxing_photos, install_steps, auxiliary_charges, user_signature, exception_notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      order_id, technician_id, latitude, longitude,
      unboxing_photos ? JSON.stringify(unboxing_photos) : null,
      install_steps ? JSON.stringify(install_steps) : null,
      auxiliary_charges ? JSON.stringify(auxiliary_charges) : null,
      user_signature, exception_notes,
      status || 'in_progress'
    );

    const record = db.prepare(`
      SELECT r.*, o.order_no, o.consumer_name, t.name AS technician_name
      FROM on_site_records r
      LEFT JOIN orders o ON r.order_id = o.id
      LEFT JOIN technicians t ON r.technician_id = t.id
      WHERE r.id = ?
    `).get(result.lastInsertRowid);
    parseRecord(record);
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const db = req.app.locals.db;
    const record = db.prepare('SELECT * FROM on_site_records WHERE id = ?').get(req.params.id);
    if (!record) return res.status(404).json({ error: 'On-site record not found' });

    const {
      latitude, longitude, unboxing_photos, install_steps,
      auxiliary_charges, user_signature, exception_notes, status
    } = req.body;

    db.prepare(`
      UPDATE on_site_records SET
        latitude = ?, longitude = ?,
        unboxing_photos = ?, install_steps = ?, auxiliary_charges = ?,
        user_signature = ?, exception_notes = ?, status = ?
      WHERE id = ?
    `).run(
      latitude ?? record.latitude,
      longitude ?? record.longitude,
      unboxing_photos !== undefined ? JSON.stringify(unboxing_photos) : record.unboxing_photos,
      install_steps !== undefined ? JSON.stringify(install_steps) : record.install_steps,
      auxiliary_charges !== undefined ? JSON.stringify(auxiliary_charges) : record.auxiliary_charges,
      user_signature ?? record.user_signature,
      exception_notes ?? record.exception_notes,
      status ?? record.status,
      req.params.id
    );

    if (status === 'completed') {
      db.prepare("UPDATE orders SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(record.order_id);
    }

    const updated = db.prepare(`
      SELECT r.*, o.order_no, o.consumer_name, t.name AS technician_name
      FROM on_site_records r
      LEFT JOIN orders o ON r.order_id = o.id
      LEFT JOIN technicians t ON r.technician_id = t.id
      WHERE r.id = ?
    `).get(req.params.id);
    parseRecord(updated);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
