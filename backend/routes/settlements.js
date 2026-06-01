const express = require('express');
const router = express.Router();

router.get('/summary', (req, res) => {
  try {
    const db = req.app.locals.db;
    const byBrand = db.prepare(`
      SELECT b.name AS brand_name, COUNT(*) AS count,
        SUM(s.service_fee) AS total_service_fee,
        SUM(s.auxiliary_fee) AS total_auxiliary_fee,
        SUM(s.total_fee) AS total_fee
      FROM settlements s
      LEFT JOIN brands b ON s.brand_id = b.id
      GROUP BY s.brand_id
    `).all();
    const byCenter = db.prepare(`
      SELECT sc.name AS center_name, COUNT(*) AS count,
        SUM(s.service_fee) AS total_service_fee,
        SUM(s.auxiliary_fee) AS total_auxiliary_fee,
        SUM(s.total_fee) AS total_fee
      FROM settlements s
      LEFT JOIN service_centers sc ON s.service_center_id = sc.id
      GROUP BY s.service_center_id
    `).all();
    const byTechnician = db.prepare(`
      SELECT t.name AS technician_name, COUNT(*) AS count,
        SUM(s.service_fee) AS total_service_fee,
        SUM(s.auxiliary_fee) AS total_auxiliary_fee,
        SUM(s.total_fee) AS total_fee
      FROM settlements s
      LEFT JOIN technicians t ON s.technician_id = t.id
      GROUP BY s.technician_id
    `).all();
    const byStatus = db.prepare(`
      SELECT status, COUNT(*) AS count, SUM(total_fee) AS total_fee
      FROM settlements
      GROUP BY status
    `).all();

    res.json({ byBrand, byCenter, byTechnician, byStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/export', (req, res) => {
  try {
    const db = req.app.locals.db;
    const { status, brand_id } = req.query;

    let sql = `
      SELECT s.id, o.order_no, b.name AS brand_name, sc.name AS center_name,
        t.name AS technician_name, s.service_fee, s.auxiliary_fee, s.total_fee,
        s.status, s.created_at,
        r.unboxing_photos, r.install_steps, r.auxiliary_charges, r.user_signature
      FROM settlements s
      LEFT JOIN orders o ON s.order_id = o.id
      LEFT JOIN brands b ON s.brand_id = b.id
      LEFT JOIN service_centers sc ON s.service_center_id = sc.id
      LEFT JOIN technicians t ON s.technician_id = t.id
      LEFT JOIN on_site_records r ON r.order_id = s.order_id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND s.status = ?';
      params.push(status);
    }
    if (brand_id) {
      sql += ' AND s.brand_id = ?';
      params.push(brand_id);
    }
    sql += ' ORDER BY s.created_at DESC';

    const rows = db.prepare(sql).all(...params);

    rows.forEach(row => {
      try { row.unboxing_photos = JSON.parse(row.unboxing_photos); } catch { /* keep */ }
      try { row.install_steps = JSON.parse(row.install_steps); } catch { /* keep */ }
      try { row.auxiliary_charges = JSON.parse(row.auxiliary_charges); } catch { /* keep */ }
    });

    const header = 'ID,Order No,Brand,Center,Technician,Service Fee,Auxiliary Fee,Total Fee,Status,Created At,Has Unboxing Photos,Has Install Steps,Has Signature\n';
    const csvRows = rows.map(r =>
      `${r.id},"${r.order_no}","${r.brand_name}","${r.center_name}","${r.technician_name}",${r.service_fee},${r.auxiliary_fee},${r.total_fee},"${r.status}","${r.created_at}",${r.unboxing_photos ? 'Yes' : 'No'},${r.install_steps ? 'Yes' : 'No'},${r.user_signature ? 'Yes' : 'No'}`
    );
    const csv = header + csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=settlements_export.csv');
    res.send('\ufeff' + csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', (req, res) => {
  try {
    const db = req.app.locals.db;
    const { status, order_id, brand_id, service_center_id, technician_id, page = 1, pageSize = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    let countSql = 'SELECT COUNT(*) AS total FROM settlements s WHERE 1=1';
    let dataSql = `
      SELECT s.*, o.order_no, o.consumer_name, b.name AS brand_name,
        sc.name AS center_name, t.name AS technician_name
      FROM settlements s
      LEFT JOIN orders o ON s.order_id = o.id
      LEFT JOIN brands b ON s.brand_id = b.id
      LEFT JOIN service_centers sc ON s.service_center_id = sc.id
      LEFT JOIN technicians t ON s.technician_id = t.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      const clause = ' AND s.status = ?';
      countSql += clause;
      dataSql += clause;
      params.push(status);
    }
    if (order_id) {
      const clause = ' AND s.order_id = ?';
      countSql += clause;
      dataSql += clause;
      params.push(order_id);
    }
    if (brand_id) {
      const clause = ' AND s.brand_id = ?';
      countSql += clause;
      dataSql += clause;
      params.push(brand_id);
    }
    if (service_center_id) {
      const clause = ' AND s.service_center_id = ?';
      countSql += clause;
      dataSql += clause;
      params.push(service_center_id);
    }
    if (technician_id) {
      const clause = ' AND s.technician_id = ?';
      countSql += clause;
      dataSql += clause;
      params.push(technician_id);
    }

    const total = db.prepare(countSql).get(...params).total;
    dataSql += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
    const settlements = db.prepare(dataSql).all(...params, parseInt(pageSize), offset);

    res.json({
      data: settlements,
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
    const settlement = db.prepare(`
      SELECT s.*, o.order_no, o.consumer_name, b.name AS brand_name,
        sc.name AS center_name, t.name AS technician_name
      FROM settlements s
      LEFT JOIN orders o ON s.order_id = o.id
      LEFT JOIN brands b ON s.brand_id = b.id
      LEFT JOIN service_centers sc ON s.service_center_id = sc.id
      LEFT JOIN technicians t ON s.technician_id = t.id
      WHERE s.id = ?
    `).get(req.params.id);
    if (!settlement) return res.status(404).json({ error: 'Settlement not found' });
    res.json(settlement);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const db = req.app.locals.db;
    const { order_id, brand_id, service_center_id, technician_id, service_fee, auxiliary_fee } = req.body;

    if (!order_id || !brand_id || !service_center_id || !technician_id || service_fee === undefined) {
      return res.status(400).json({ error: 'order_id, brand_id, service_center_id, technician_id, and service_fee are required' });
    }

    const auxFee = auxiliary_fee || 0;
    const totalFee = service_fee + auxFee;

    const result = db.prepare(`
      INSERT INTO settlements (order_id, brand_id, service_center_id, technician_id, service_fee, auxiliary_fee, total_fee, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(order_id, brand_id, service_center_id, technician_id, service_fee, auxFee, totalFee);

    const settlement = db.prepare(`
      SELECT s.*, o.order_no, o.consumer_name, b.name AS brand_name,
        sc.name AS center_name, t.name AS technician_name
      FROM settlements s
      LEFT JOIN orders o ON s.order_id = o.id
      LEFT JOIN brands b ON s.brand_id = b.id
      LEFT JOIN service_centers sc ON s.service_center_id = sc.id
      LEFT JOIN technicians t ON s.technician_id = t.id
      WHERE s.id = ?
    `).get(result.lastInsertRowid);
    res.status(201).json(settlement);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const db = req.app.locals.db;
    const settlement = db.prepare('SELECT * FROM settlements WHERE id = ?').get(req.params.id);
    if (!settlement) return res.status(404).json({ error: 'Settlement not found' });

    const { status, service_fee, auxiliary_fee } = req.body;

    const validStatuses = ['pending', 'approved', 'paid'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Allowed: ${validStatuses.join(', ')}` });
    }

    const newServiceFee = service_fee ?? settlement.service_fee;
    const newAuxFee = auxiliary_fee ?? settlement.auxiliary_fee;
    const newTotal = newServiceFee + newAuxFee;
    const newStatus = status || settlement.status;

    db.prepare(`
      UPDATE settlements SET service_fee = ?, auxiliary_fee = ?, total_fee = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newServiceFee, newAuxFee, newTotal, newStatus, req.params.id);

    const updated = db.prepare(`
      SELECT s.*, o.order_no, o.consumer_name, b.name AS brand_name,
        sc.name AS center_name, t.name AS technician_name
      FROM settlements s
      LEFT JOIN orders o ON s.order_id = o.id
      LEFT JOIN brands b ON s.brand_id = b.id
      LEFT JOIN service_centers sc ON s.service_center_id = sc.id
      LEFT JOIN technicians t ON s.technician_id = t.id
      WHERE s.id = ?
    `).get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
