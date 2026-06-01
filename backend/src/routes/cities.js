const express = require('express');
const router = express.Router();
const { query } = require('../database');

router.get('/', async (req, res) => {
  try {
    const { hot } = req.query;
    let sql = 'SELECT * FROM cities ORDER BY sort_order ASC';
    let params = [];
    
    if (hot === '1') {
      sql = 'SELECT * FROM cities WHERE is_hot = 1 ORDER BY sort_order ASC';
    }
    
    const cities = await query(sql, params);
    res.json({ code: 0, data: cities, message: 'success' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 1, message: '服务器错误' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const city = await query('SELECT * FROM cities WHERE id = ?', [id]);
    if (city.length === 0) {
      return res.status(404).json({ code: 1, message: '城市不存在' });
    }
    res.json({ code: 0, data: city[0], message: 'success' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 1, message: '服务器错误' });
  }
});

module.exports = router;
