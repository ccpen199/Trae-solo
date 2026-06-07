const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  try {
    const suppliers = db.prepare(`
      SELECT s.*, u.name, u.phone, u.email, u.username
      FROM suppliers s
      JOIN users u ON s.user_id = u.id
    `).all();
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const supplier = db.prepare(`
      SELECT s.*, u.name, u.phone, u.email, u.username
      FROM suppliers s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `).get(req.params.id);
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    res.json(supplier);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { company_name, business_license, address, contact_person } = req.body;
    const result = db.prepare(`
      UPDATE suppliers SET
        company_name = COALESCE(?, company_name),
        business_license = COALESCE(?, business_license),
        address = COALESCE(?, address),
        contact_person = COALESCE(?, contact_person)
      WHERE id = ?
    `).run(company_name, business_license, address, contact_person, req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Supplier not found' });
    res.json({ message: 'Supplier updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/parts', (req, res) => {
  try {
    const parts = db.prepare(`
      SELECT * FROM parts WHERE supplier_id = ?
    `).all(req.params.id);
    res.json(parts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
