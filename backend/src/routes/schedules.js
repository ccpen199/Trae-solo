const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../database');

router.get('/', async (req, res) => {
  try {
    const { movie_id, cinema_id, date } = req.query;
    
    let sql = `
      SELECT s.*, 
        m.title as movie_title, m.poster as movie_poster, m.duration,
        c.name as cinema_name, c.address,
        h.name as hall_name, h.type as hall_type
      FROM schedules s
      LEFT JOIN movies m ON s.movie_id = m.id
      LEFT JOIN cinemas c ON s.cinema_id = c.id
      LEFT JOIN halls h ON s.hall_id = h.id
      WHERE s.status = 1
    `;
    let params = [];
    
    if (movie_id) {
      sql += ' AND s.movie_id = ?';
      params.push(movie_id);
    }
    
    if (cinema_id) {
      sql += ' AND s.cinema_id = ?';
      params.push(cinema_id);
    }
    
    if (date) {
      sql += ' AND DATE(s.start_time) = ?';
      params.push(date);
    }
    
    sql += ' ORDER BY s.start_time ASC';
    
    const schedules = await query(sql, params);
    res.json({ code: 0, data: schedules, message: 'success' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 1, message: '服务器错误' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await queryOne(`
      SELECT s.*, 
        m.title as movie_title, m.poster as movie_poster, m.duration,
        c.name as cinema_name, c.address,
        h.name as hall_name, h.type as hall_type, h.rows, h.cols
      FROM schedules s
      LEFT JOIN movies m ON s.movie_id = m.id
      LEFT JOIN cinemas c ON s.cinema_id = c.id
      LEFT JOIN halls h ON s.hall_id = h.id
      WHERE s.id = ?
    `, [id]);
    
    if (!schedule) {
      return res.status(404).json({ code: 1, message: '场次不存在' });
    }
    
    const allSeats = await query('SELECT * FROM seats WHERE hall_id = ? ORDER BY row_num, col_num', [schedule.hall_id]);
    const soldSeats = await query('SELECT seats FROM orders WHERE schedule_id = ? AND status != 2', [id]);
    
    const soldSeatIds = new Set();
    soldSeats.forEach(order => {
      const seats = JSON.parse(order.seats || '[]');
      seats.forEach(seat => soldSeatIds.add(seat.id));
    });
    
    const seats = allSeats.map(seat => ({
      ...seat,
      is_sold: soldSeatIds.has(seat.id)
    }));
    
    res.json({ code: 0, data: { ...schedule, seats }, message: 'success' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 1, message: '服务器错误' });
  }
});

module.exports = router;
