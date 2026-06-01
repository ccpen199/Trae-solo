const express = require('express');
const router = express.Router();
const { query } = require('../database');

router.get('/', async (req, res) => {
  try {
    const banners = await query('SELECT * FROM banners WHERE status = 1 ORDER BY sort_order ASC');
    res.json({ code: 0, data: banners, message: 'success' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 1, message: '服务器错误' });
  }
});

module.exports = router;
