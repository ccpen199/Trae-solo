import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  try {
    const { cinema_id, movie_id, date } = req.query;
    let sql = 'SELECT s.*, m.title as movie_title, h.name as hall_name, c.name as cinema_name FROM showtimes s JOIN movies m ON s.movie_id = m.id JOIN halls h ON s.hall_id = h.id JOIN cinemas c ON s.cinema_id = c.id WHERE 1=1';
    const params = [];
    if (cinema_id) { sql += ' AND s.cinema_id = ?'; params.push(cinema_id); }
    if (movie_id) { sql += ' AND s.movie_id = ?'; params.push(movie_id); }
    if (date) { sql += ' AND s.show_date = ?'; params.push(date); }
    sql += ' ORDER BY s.show_date, s.show_time';
    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT s.*, m.title as movie_title, h.name as hall_name, c.name as cinema_name FROM showtimes s JOIN movies m ON s.movie_id = m.id JOIN halls h ON s.hall_id = h.id JOIN cinemas c ON s.cinema_id = c.id WHERE s.id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Showtime not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/seats', (req, res) => {
  try {
    const showtime = db.prepare('SELECT s.*, h.seat_rows, h.seat_cols FROM showtimes s JOIN halls h ON s.hall_id = h.id WHERE s.id = ?').get(req.params.id);
    if (!showtime) return res.status(404).json({ error: 'Showtime not found' });

    const locks = db.prepare('SELECT row, col, status, locked_by FROM seats_lock WHERE showtime_id = ?').all(req.params.id);
    const lockMap = {};
    for (const l of locks) {
      lockMap[`${l.row}-${l.col}`] = l;
    }

    const seats = [];
    for (let r = 1; r <= showtime.seat_rows; r++) {
      for (let c = 1; c <= showtime.seat_cols; c++) {
        const key = `${r}-${c}`;
        const lock = lockMap[key];
        seats.push({
          row: r,
          col: c,
          status: lock ? lock.status : 'available',
          locked_by: lock ? lock.locked_by : null
        });
      }
    }

    res.json({
      showtime_id: showtime.id,
      seat_rows: showtime.seat_rows,
      seat_cols: showtime.seat_cols,
      seats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
