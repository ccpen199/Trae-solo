const express = require('express');
const { all } = require('../database');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const departments = await all('SELECT * FROM departments ORDER BY id');
    res.json({ success: true, data: departments });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ success: false, message: '获取科室列表失败' });
  }
});

module.exports = router;
