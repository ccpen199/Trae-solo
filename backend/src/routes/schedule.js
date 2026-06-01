const express = require('express');
const router = express.Router();
const db = require('../database/connection');

router.get('/', (req, res) => {
  try {
    const { movie_id, cinema_id, date, city_id } = req.query;
    let query = `
      SELECT s.*, m.title as movie_title, m.poster as movie_poster,
             c.name as cinema_name, c.address as cinema_address
      FROM schedules s
      JOIN movies m ON s.movie_id = m.id
      JOIN cinemas c ON s.cinema_id = c.id
      WHERE 1=1
    `;
    let params = [];
    
    if (movie_id) {
      query += ' AND s.movie_id = ?';
      params.push(movie_id);
    }
    
    if (cinema_id) {
      query += ' AND s.cinema_id = ?';
      params.push(cinema_id);
    }
    
    if (date) {
      query += ' AND s.date = ?';
      params.push(date);
    }
    
    if (city_id) {
      query += ' AND c.city_id = ?';
      params.push(city_id);
    }
    
    query += ' ORDER BY s.date, s.start_time';
    
    const schedules = db.prepare(query).all(...params);
    
    const groupedByDate = schedules.reduce((acc, s) => {
      if (!acc[s.date]) {
        acc[s.date] = [];
      }
      acc[s.date].push(s);
      return acc;
    }, {});
    
    res.json({ success: true, data: schedules, grouped: groupedByDate });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/dates', (req, res) => {
  try {
    const { movie_id, cinema_id } = req.query;
    let query = 'SELECT DISTINCT date FROM schedules WHERE date >= DATE("now")';
    let params = [];
    
    if (movie_id) {
      query += ' AND movie_id = ?';
      params.push(movie_id);
    }
    
    if (cinema_id) {
      query += ' AND cinema_id = ?';
      params.push(cinema_id);
    }
    
    query += ' ORDER BY date LIMIT 7';
    
    const dates = db.prepare(query).all(...params).map(d => d.date);
    res.json({ success: true, data: dates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
