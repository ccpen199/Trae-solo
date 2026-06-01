const express = require('express');
const db = require('../database');

const router = express.Router();

router.get('/', (req, res) => {
  const channels = db.prepare('SELECT * FROM channels ORDER BY sort_order ASC').all();
  res.json({ channels });
});

module.exports = router;
