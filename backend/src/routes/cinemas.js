const express = require('express');
const router = express.Router();
const db = require('../database/connection');

router.get('/', (req, res) => {
  try {
    const { city_id, district, page = 1, limit = 20 } = req.query;
    let query = 'SELECT * FROM cinemas WHERE 1=1';
    let params = [];
    
    if (city_id) {
      query += ' AND city_id = ?';
      params.push(city_id);
    }
    
    if (district) {
      query += ' AND district = ?';
      params.push(district);
    }
    
    query += ' ORDER BY rating DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    
    const cinemas = db.prepare(query).all(...params);
    res.json({ success: true, data: cinemas });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/nearby', (req, res) => {
  try {
    const { city_id, latitude, longitude, page = 1, limit = 10 } = req.query;
    let query = 'SELECT * FROM cinemas WHERE city_id = ?';
    let params = [city_id];
    
    query += ' ORDER BY rating DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    
    const cinemas = db.prepare(query).all(...params);
    res.json({ success: true, data: cinemas });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const cinema = db.prepare('SELECT * FROM cinemas WHERE id = ?').get(req.params.id);
    if (!cinema) {
      return res.status(404).json({ success: false, message: '影院不存在' });
    }
    
    const movies = db.prepare(`
      SELECT DISTINCT m.* FROM movies m
      JOIN schedules s ON m.id = s.movie_id
      WHERE s.cinema_id = ? AND s.date >= DATE('now')
    `).all(req.params.id);
    
    res.json({ 
      success: true, 
      data: {
        ...cinema,
        movies
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id/schedules', (req, res) => {
  try {
    const { date, movie_id } = req.query;
    let query = `
      SELECT s.*, m.title as movie_title, m.poster as movie_poster
      FROM schedules s
      JOIN movies m ON s.movie_id = m.id
      WHERE s.cinema_id = ?
    `;
    let params = [req.params.id];
    
    if (date) {
      query += ' AND s.date = ?';
      params.push(date);
    }
    
    if (movie_id) {
      query += ' AND s.movie_id = ?';
      params.push(movie_id);
    }
    
    query += ' ORDER BY s.date, s.start_time';
    
    const schedules = db.prepare(query).all(...params);
    res.json({ success: true, data: schedules });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
