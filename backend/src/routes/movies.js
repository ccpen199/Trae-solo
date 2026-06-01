const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../database');

router.get('/', async (req, res) => {
  try {
    const { showing, page = 1, size = 20 } = req.query;
    let sql = 'SELECT * FROM movies WHERE status = 1';
    let countSql = 'SELECT COUNT(*) as total FROM movies WHERE status = 1';
    let params = [];
    
    if (showing === '1') {
      sql += ' AND is_showing = 1';
      countSql += ' AND is_showing = 1';
    } else if (showing === '0') {
      sql += ' AND is_showing = 0';
      countSql += ' AND is_showing = 0';
    }
    
    sql += ' ORDER BY rating DESC LIMIT ? OFFSET ?';
    const offset = (page - 1) * size;
    params.push(parseInt(size), offset);
    
    const movies = await query(sql, params);
    const countResult = await queryOne(countSql);
    
    res.json({ 
      code: 0, 
      data: { 
        list: movies, 
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
    const movie = await queryOne('SELECT * FROM movies WHERE id = ?', [id]);
    if (!movie) {
      return res.status(404).json({ code: 1, message: '影片不存在' });
    }
    
    const reviews = await query(`
      SELECT r.*, u.nickname, u.avatar 
      FROM reviews r 
      LEFT JOIN users u ON r.user_id = u.id 
      WHERE r.movie_id = ? 
      ORDER BY r.created_at DESC LIMIT 10
    `, [id]);
    
    res.json({ code: 0, data: { ...movie, reviews }, message: 'success' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 1, message: '服务器错误' });
  }
});

router.get('/:id/cinemas', async (req, res) => {
  try {
    const { id } = req.params;
    const { city_id, date } = req.query;
    
    let sql = `
      SELECT DISTINCT c.*, MIN(s.price) as min_price
      FROM cinemas c
      INNER JOIN schedules s ON c.id = s.cinema_id
      WHERE s.movie_id = ? AND s.status = 1
    `;
    let params = [id];
    
    if (city_id) {
      sql += ' AND c.city_id = ?';
      params.push(city_id);
    }
    
    if (date) {
      sql += ' AND DATE(s.start_time) = ?';
      params.push(date);
    }
    
    sql += ' GROUP BY c.id ORDER BY c.rating DESC';
    
    const cinemas = await query(sql, params);
    res.json({ code: 0, data: cinemas, message: 'success' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 1, message: '服务器错误' });
  }
});

module.exports = router;
