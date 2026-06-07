import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.post('/lock', (req, res) => {
  try {
    const { showtime_id, seats, locked_by } = req.body;
    if (!showtime_id || !seats || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ error: 'showtime_id and seats array are required' });
    }

    const showtime = db.prepare('SELECT * FROM showtimes WHERE id = ?').get(showtime_id);
    if (!showtime) return res.status(404).json({ error: 'Showtime not found' });
    if (showtime.status !== 'open') return res.status(400).json({ error: 'Showtime is not available for booking' });

    const insertLock = db.prepare(
      "INSERT INTO seats_lock (showtime_id, row, col, status, locked_by, locked_at) VALUES (?, ?, ?, ?, ?, datetime('now','localtime'))"
    );

    const locked = [];
    const alreadyTaken = [];

    const transaction = db.transaction(() => {
      for (const seat of seats) {
        const existing = db.prepare(
          "SELECT * FROM seats_lock WHERE showtime_id = ? AND row = ? AND col = ? AND status IN ('locked','sold')"
        ).get(showtime_id, seat.row, seat.col);

        if (existing) {
          alreadyTaken.push(seat);
        } else {
          db.prepare("DELETE FROM seats_lock WHERE showtime_id = ? AND row = ? AND col = ? AND status = 'available'")
            .run(showtime_id, seat.row, seat.col);
          insertLock.run(showtime_id, seat.row, seat.col, 'locked', locked_by || null);
          locked.push(seat);
        }
      }
    });

    transaction();

    res.json({ locked, alreadyTaken, lock_count: locked.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/unlock', (req, res) => {
  try {
    const { showtime_id, seats } = req.body;
    if (!showtime_id || !seats || !Array.isArray(seats)) {
      return res.status(400).json({ error: 'showtime_id and seats array are required' });
    }

    const transaction = db.transaction(() => {
      for (const seat of seats) {
        db.prepare("DELETE FROM seats_lock WHERE showtime_id = ? AND row = ? AND col = ? AND status = 'locked'")
          .run(showtime_id, seat.row, seat.col);
      }
    });

    transaction();

    res.json({ unlocked: seats.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
