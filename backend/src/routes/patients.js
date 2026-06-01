const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

router.get('/', (req, res) => {
  const db = getDb();
  
  const patients = db.prepare(`
    SELECT p.*, d.name as department_name
    FROM patients p
    LEFT JOIN departments d ON p.department_id = d.id
    ORDER BY p.created_at DESC
  `).all();
  
  res.json(patients);
});

router.get('/departments', (req, res) => {
  const db = getDb();
  
  const departments = db.prepare(`
    SELECT * FROM departments ORDER BY name
  `).all();
  
  res.json(departments);
});

module.exports = router;
