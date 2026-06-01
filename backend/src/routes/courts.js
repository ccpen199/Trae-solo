const express = require('express');
const router = express.Router();
const db = require('../database/init');

router.get('/', (req, res) => {
  const courts = db.prepare('SELECT * FROM courts WHERE is_active = 1 ORDER BY name').all();
  res.json(courts);
});

router.post('/', (req, res) => {
  const { name, location, type, capacity, has_video_system } = req.body;
  const result = db.prepare(
    'INSERT INTO courts (name, location, type, capacity, has_video_system) VALUES (?, ?, ?, ?, ?)'
  ).run(name, location, type || 'general', capacity || 20, has_video_system ? 1 : 0);
  res.status(201).json({ id: result.lastInsertRowid, ...req.body });
});

module.exports = router;
