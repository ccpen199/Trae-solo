const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const { customer_id, page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;

  let query = `
    SELECT o.*, c.name as customer_name, c.phone as customer_phone
    FROM optometry_records o
    JOIN customers c ON o.customer_id = c.id
    WHERE o.is_current = 1
  `;
  let countQuery = 'SELECT COUNT(*) as total FROM optometry_records WHERE is_current = 1';
  const params = [];

  if (customer_id) {
    query += ' AND o.customer_id = ?';
    countQuery += ' AND customer_id = ?';
    params.push(customer_id);
  }

  query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), offset);

  const records = db.prepare(query).all(...params);
  const { total } = db.prepare(countQuery).get(...params.slice(0, params.length - 2));

  res.json({ data: records, total, page: Number(page), pageSize: Number(pageSize) });
});

router.get('/:id', (req, res) => {
  const record = db.prepare(`
    SELECT o.*, c.name as customer_name
    FROM optometry_records o
    JOIN customers c ON o.customer_id = c.id
    WHERE o.id = ?
  `).get(req.params.id);

  if (!record) {
    return res.status(404).json({ error: '验光记录不存在' });
  }

  const versions = db.prepare(`
    SELECT * FROM optometry_records
    WHERE parent_id = ? OR id = ?
    ORDER BY version DESC
  `).all(req.params.id, req.params.id);

  res.json({ ...record, versions });
});

router.post('/', (req, res) => {
  const {
    customer_id,
    optometrist,
    sphere_od,
    sphere_os,
    cylinder_od,
    cylinder_os,
    axis_od,
    axis_os,
    pd,
    corrected_vision_od,
    corrected_vision_os,
    notes
  } = req.body;

  if (!customer_id || !optometrist) {
    return res.status(400).json({ error: '客户ID和验光师必填' });
  }

  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customer_id);
  if (!customer) {
    return res.status(404).json({ error: '客户不存在' });
  }

  const result = db.prepare(`
    INSERT INTO optometry_records (
      customer_id, optometrist, sphere_od, sphere_os, cylinder_od, cylinder_os,
      axis_od, axis_os, pd, corrected_vision_od, corrected_vision_os, notes, version, is_current
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
  `).run(
    customer_id,
    optometrist,
    sphere_od || null,
    sphere_os || null,
    cylinder_od || null,
    cylinder_os || null,
    axis_od || null,
    axis_os || null,
    pd || null,
    corrected_vision_od || null,
    corrected_vision_os || null,
    notes || null
  );

  const record = db.prepare('SELECT * FROM optometry_records WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(record);
});

router.put('/:id', (req, res) => {
  const {
    optometrist,
    sphere_od,
    sphere_os,
    cylinder_od,
    cylinder_os,
    axis_od,
    axis_os,
    pd,
    corrected_vision_od,
    corrected_vision_os,
    notes
  } = req.body;

  const oldRecord = db.prepare('SELECT * FROM optometry_records WHERE id = ?').get(req.params.id);
  if (!oldRecord) {
    return res.status(404).json({ error: '验光记录不存在' });
  }

  db.prepare('UPDATE optometry_records SET is_current = 0 WHERE id = ?').run(req.params.id);

  const newVersion = oldRecord.version + 1;
  const result = db.prepare(`
    INSERT INTO optometry_records (
      customer_id, optometrist, sphere_od, sphere_os, cylinder_od, cylinder_os,
      axis_od, axis_os, pd, corrected_vision_od, corrected_vision_os, notes,
      version, parent_id, is_current
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(
    oldRecord.customer_id,
    optometrist || oldRecord.optometrist,
    sphere_od !== undefined ? sphere_od : oldRecord.sphere_od,
    sphere_os !== undefined ? sphere_os : oldRecord.sphere_os,
    cylinder_od !== undefined ? cylinder_od : oldRecord.cylinder_od,
    cylinder_os !== undefined ? cylinder_os : oldRecord.cylinder_os,
    axis_od !== undefined ? axis_od : oldRecord.axis_od,
    axis_os !== undefined ? axis_os : oldRecord.axis_os,
    pd !== undefined ? pd : oldRecord.pd,
    corrected_vision_od !== undefined ? corrected_vision_od : oldRecord.corrected_vision_od,
    corrected_vision_os !== undefined ? corrected_vision_os : oldRecord.corrected_vision_os,
    notes !== undefined ? notes : oldRecord.notes,
    newVersion,
    oldRecord.parent_id || oldRecord.id
  );

  const record = db.prepare('SELECT * FROM optometry_records WHERE id = ?').get(result.lastInsertRowid);
  res.json(record);
});

router.delete('/:id', (req, res) => {
  const record = db.prepare('SELECT * FROM optometry_records WHERE id = ?').get(req.params.id);
  if (!record) {
    return res.status(404).json({ error: '验光记录不存在' });
  }

  db.prepare('DELETE FROM optometry_records WHERE id = ? OR parent_id = ?').run(req.params.id, req.params.id);
  res.json({ message: '删除成功' });
});

module.exports = router;
