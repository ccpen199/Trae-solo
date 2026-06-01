const express = require('express');
const { db } = require('../models/db');

const router = express.Router();

router.get('/', (req, res) => {
  const destinations = db.prepare('SELECT * FROM destinations ORDER BY name').all();
  res.json(destinations);
});

router.get('/:name', (req, res) => {
  const destination = db.prepare('SELECT * FROM destinations WHERE name = ?').get(req.params.name);
  
  if (!destination) {
    return res.status(404).json({ error: '目的地不存在' });
  }
  
  res.json(destination);
});

module.exports = router;
