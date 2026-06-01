const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../database');

router.get('/', async (req, res) => {
  try {
    const { city_id, district, area, page = 1, size = 20 } = req.query;
    let sql = 'SELECT * FROM cinemas WHERE 1=1';
    let countSql = 'SELECT COUNT(*) as total FROM cinemas WHERE 1=1';
    let params = [];
    
    if (city_id) {
      sql += ' AND city_id = ?';
      countSql += ' AND city_id = ?';
      params.push(city_id);
    }
    
    if (district) {
      sql += ' AND district = ?';
      countSql += ' AND district = ?';
      params.push(district);
    }
    
    if (area) {
      sql += ' AND business_area = ?';
      countSql += ' AND business_area = ?';
      params.push(area);
    }
    
    sql += ' ORDER BY rating DESC LIMIT ? OFFSET ?';
    const offset = (page - 1) * size;
    params.push(parseInt(size), offset);
    
    const cinemas = await query(sql, params);
    const countResult = await queryOne(countSql);
    
    res.json({ 
      code: 0, 
      data: { 
        list: cinemas, 
        total: countResult.total,
        page: parseInt(page),
        size: parseInt(size)
      }, 
      message: 'success' 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 1, message: '服务器错误' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const cinema = await queryOne('SELECT * FROM cinemas WHERE id = ?', [id]);
    if (!cinema) {
      return res.status(404).json({ code: 1, message: '影院不存在' });
    }
    res.json({ code: 0, data: cinema, message: 'success' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 1, message: '服务器错误' });
  }
});

router.get('/:id/movies', async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;
    
    let sql = `
      SELECT DISTINCT m.*
      FROM movies m
      INNER JOIN schedules s ON m.id = s.movie_id
      WHERE s.cinema_id = ? AND s.status = 1
    `;
    let params = [id];
    
    if (date) {
      sql += ' AND DATE(s.start_time) = ?';
      params.push(date);
    }
    
    sql += ' ORDER BY m.rating DESC';
    
    const movies = await query(sql, params);
    res.json({ code: 0, data: movies, message: 'success' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 1, message: '服务器错误' });
  }
});

module.exports = router;
