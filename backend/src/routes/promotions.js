const express = require('express');
const { db } = require('../database');
const router = express.Router();

router.get('/', (req, res) => {
  try {
    const promotions = db.prepare('SELECT * FROM promotions WHERE is_active = 1').all();
    res.json({ success: true, data: promotions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
