const express = require('express');
const router = express.Router();
const orderService = require('../services/orderService');

router.get('/', async (req, res) => {
  try {
    const { is_locked, locked_by_order } = req.query;
    
    const filter = {};
    if (is_locked !== undefined) {
      filter.is_locked = is_locked === 'true';
    }
    if (locked_by_order) {
      filter.locked_by_order = locked_by_order;
    }
    
    const pois = await orderService.getPOIs(filter);
    res.json({ success: true, data: pois });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
