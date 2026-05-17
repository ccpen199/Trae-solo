const express = require('express');
const { get, all } = require('../database');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, async (req, res) => {
  try {
    const { keyword, page = 1, limit = 10 } = req.query;
    let sql = 'SELECT * FROM hospitals WHERE 1=1';
    const params = [];

    if (keyword) {
      sql += ' AND (name LIKE ? OR address LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    const offset = (page - 1) * limit;
    sql += ` ORDER BY rating DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const hospitals = await all(sql, params);
    
    let countSql = 'SELECT COUNT(*) as count FROM hospitals WHERE 1=1';
    const countParams = [];
    if (keyword) {
      countSql += ' AND (name LIKE ? OR address LIKE ?)';
      countParams.push(`%${keyword}%`, `%${keyword}%`);
    }
    const total = await get(countSql, countParams);

    res.json({ success: true, data: { list: hospitals, total: total.count, page: parseInt(page) } });
  } catch (error) {
    console.error('Get hospitals error:', error);
    res.status(500).json({ success: false, message: '获取医院列表失败' });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const hospital = await get('SELECT * FROM hospitals WHERE id = ?', [req.params.id]);
    if (!hospital) {
      return res.status(404).json({ success: false, message: '医院不存在' });
    }

    const doctors = await all('SELECT * FROM doctors WHERE hospital_id = ?', [req.params.id]);

    res.json({ success: true, data: { ...hospital, doctors } });
  } catch (error) {
    console.error('Get hospital error:', error);
    res.status(500).json({ success: false, message: '获取医院详情失败' });
  }
});

module.exports = router;
