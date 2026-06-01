const express = require('express');
const router = express.Router();
const db = require('../database/connection');

router.get('/', (req, res) => {
  try {
    const { status, city_id, page = 1, limit = 20 } = req.query;
    let query = 'SELECT * FROM movies WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM movies WHERE 1=1';
    let params = [];
    
    if (status) {
      query += ' AND status = ?';
      countQuery += ' AND status = ?';
      params.push(status);
    }
    
    if (city_id) {
      query += ' AND city_id = ?';
      countQuery += ' AND city_id = ?';
      params.push(city_id);
    }
    
    query += ' ORDER BY rating DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    
    const movies = db.prepare(query).all(...params);
    const { total } = db.prepare(countQuery).get(...params.slice(0, params.length - 2));
    
    res.json({ 
      success: true, 
      data: movies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/showing', (req, res) => {
  try {
    const { city_id, page = 1, limit = 20 } = req.query;
    let query = 'SELECT * FROM movies WHERE is_showing = 1';
    let params = [];
    
    if (city_id) {
      query += ' AND city_id = ?';
      params.push(city_id);
    }
    
    query += ' ORDER BY rating DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    
    const movies = db.prepare(query).all(...params);
    res.json({ success: true, data: movies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/upcoming', (req, res) => {
  try {
    const { city_id, page = 1, limit = 20 } = req.query;
    let query = 'SELECT * FROM movies WHERE is_showing = 0';
    let params = [];
    
    if (city_id) {
      query += ' AND city_id = ?';
      params.push(city_id);
    }
    
    query += ' ORDER BY release_date ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    
    const movies = db.prepare(query).all(...params);
    res.json({ success: true, data: movies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const movie = db.prepare('SELECT * FROM movies WHERE id = ?').get(req.params.id);
    if (!movie) {
      return res.status(404).json({ success: false, message: '影片不存在' });
    }
    
    const cinemas = db.prepare(`
      SELECT DISTINCT c.* FROM cinemas c
      JOIN schedules s ON c.id = s.cinema_id
      WHERE s.movie_id = ? AND s.date >= DATE('now')
    `).all(req.params.id);
    
    res.json({ 
      success: true, 
      data: {
        ...movie,
        cinemas
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id/schedules', (req, res) => {
  try {
    const { date, cinema_id } = req.query;
    let query = `
      SELECT s.*, c.name as cinema_name, c.address as cinema_address
      FROM schedules s
      JOIN cinemas c ON s.cinema_id = c.id
      WHERE s.movie_id = ?
    `;
    let params = [req.params.id];
    
    if (date) {
      query += ' AND s.date = ?';
      params.push(date);
    }
    
    if (cinema_id) {
      query += ' AND s.cinema_id = ?';
      params.push(cinema_id);
    }
    
    query += ' ORDER BY s.date, s.start_time';
    
    const schedules = db.prepare(query).all(...params);
    res.json({ success: true, data: schedules });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
