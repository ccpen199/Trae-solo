const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  try {
    const db = req.app.locals.db;
    const centers = db.prepare(`
      SELECT sc.*, b.name AS brand_name
      FROM service_centers sc
      LEFT JOIN brands b ON sc.brand_id = b.id
      ORDER BY sc.id
    `).all();
    res.json(centers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const db = req.app.locals.db;
    const center = db.prepare(`
      SELECT sc.*, b.name AS brand_name
      FROM service_centers sc
      LEFT JOIN brands b ON sc.brand_id = b.id
      WHERE sc.id = ?
    `).get(req.params.id);
    if (!center) return res.status(404).json({ error: 'Service center not found' });
    res.json(center);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
