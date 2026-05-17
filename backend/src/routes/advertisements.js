const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.get('/', (req, res) => {
  try {
    const { position } = req.query;

    let query = 'SELECT * FROM advertisements WHERE active = 1';
    const params = [];

    if (position) {
      query += ' AND position = ?';
      params.push(position);
    }

    const ads = db.prepare(query).all(...params);

    res.json({
      success: true,
      data: ads
    });
  } catch (error) {
    console.error('获取广告失败:', error);
    res.status(500).json({ success: false, message: '获取广告失败' });
  }
});

module.exports = router;
