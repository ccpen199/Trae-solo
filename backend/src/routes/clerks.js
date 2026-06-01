const express = require('express');
const router = express.Router();
const db = require('../database/init');

router.get('/', (req, res) => {
  const clerks = db.prepare('SELECT * FROM clerks WHERE is_active = 1 ORDER BY name').all();
  res.json(clerks);
});

module.exports = router;
