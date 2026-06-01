const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  try {
    const db = req.app.locals.db;
    const { status, service_center_id, skill } = req.query;
    let sql = `
      SELECT t.*, sc.name AS service_center_name
      FROM technicians t
      LEFT JOIN service_centers sc ON t.service_center_id = sc.id
      WHERE 1=1
    `;
    const params = [];
    if (status) {
      sql += ' AND t.status = ?';
      params.push(status);
    }
    if (service_center_id) {
      sql += ' AND t.service_center_id = ?';
      params.push(service_center_id);
    }
    if (skill) {
      sql += ' AND t.skills LIKE ?';
      params.push(`%"${skill}"%`);
    }
    sql += ' ORDER BY t.id';
    const technicians = db.prepare(sql).all(...params);
    technicians.forEach(t => {
      try { t.skills = JSON.parse(t.skills); } catch { /* keep as-is */ }
      try { t.brand_authorizations = JSON.parse(t.brand_authorizations); } catch { /* keep as-is */ }
    });
    res.json(technicians);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const db = req.app.locals.db;
    const tech = db.prepare(`
      SELECT t.*, sc.name AS service_center_name
      FROM technicians t
      LEFT JOIN service_centers sc ON t.service_center_id = sc.id
      WHERE t.id = ?
    `).get(req.params.id);
    if (!tech) return res.status(404).json({ error: 'Technician not found' });
    try { tech.skills = JSON.parse(tech.skills); } catch { /* keep as-is */ }
    try { tech.brand_authorizations = JSON.parse(tech.brand_authorizations); } catch { /* keep as-is */ }
    res.json(tech);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const db = req.app.locals.db;
    const { status } = req.body;
    const allowed = ['available', 'busy', 'off_duty'];
    if (status && !allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Allowed: available, busy, off_duty' });
    }
    const tech = db.prepare('SELECT * FROM technicians WHERE id = ?').get(req.params.id);
    if (!tech) return res.status(404).json({ error: 'Technician not found' });
    db.prepare('UPDATE technicians SET status = ? WHERE id = ?').run(status || tech.status, req.params.id);
    const updated = db.prepare('SELECT * FROM technicians WHERE id = ?').get(req.params.id);
    try { updated.skills = JSON.parse(updated.skills); } catch { /* keep as-is */ }
    try { updated.brand_authorizations = JSON.parse(updated.brand_authorizations); } catch { /* keep as-is */ }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
