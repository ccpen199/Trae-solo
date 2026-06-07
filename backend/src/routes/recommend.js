const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { auth } = require('../middleware/auth');
const { getRecommendations } = require('../utils/recommendation');

router.get('/', auth, (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const recommendations = getRecommendations(req.user.id, parseInt(limit));

    res.json({ code: 0, data: recommendations, message: 'ok' });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

module.exports = router;
