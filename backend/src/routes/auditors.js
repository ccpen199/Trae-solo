const express = require('express');
const { db } = require('../database');
const router = express.Router();

router.get('/', (req, res) => {
  const auditors = db.prepare('SELECT * FROM auditors ORDER BY created_at DESC').all();
  res.json(auditors);
});

module.exports = router;
