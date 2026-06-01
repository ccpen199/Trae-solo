const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  try {
    const db = req.app.locals.db;
    const brands = db.prepare('SELECT * FROM brands ORDER BY id').all();
    res.json(brands);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const db = req.app.locals.db;
    const brand = db.prepare('SELECT * FROM brands WHERE id = ?').get(req.params.id);
    if (!brand) return res.status(404).json({ error: 'Brand not found' });
    res.json(brand);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
