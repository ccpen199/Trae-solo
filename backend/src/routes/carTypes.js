const express = require('express');
const { db } = require('../database');
const router = express.Router();

router.get('/', (req, res) => {
  try {
    const carTypes = db.prepare('SELECT * FROM car_types ORDER BY base_price').all();
    res.json({ success: true, data: carTypes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
