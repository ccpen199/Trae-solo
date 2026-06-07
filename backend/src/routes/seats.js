const express = require('express');
const { db } = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/event/:eventId', (req, res) => {
  const { eventId } = req.params;

  db.all(`
    SELECT sm.*, s.id as seat_id, s.row, s.seat_number, s.area, s.price_tier, s.status, s.lock_expires_at, s.locked_by
    FROM seat_maps sm
    LEFT JOIN seats s ON sm.id = s.seat_map_id
    WHERE sm.event_id = ?
    ORDER BY s.row, s.seat_number
  `, [eventId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: '查询失败' });
    }

    if (rows.length === 0) {
      return res.json({ seatMap: null, seats: [] });
    }

    const seatMap = {
      id: rows[0].id,
      event_id: rows[0].event_id,
      name: rows[0].name,
      total_seats: rows[0].total_seats,
      available_seats: rows[0].available_seats,
      layout_data: JSON.parse(rows[0].layout_data || '{}')
    };

    const seats = rows.filter(r => r.seat_id).map(r => ({
      id: r.seat_id,
      row: r.row,
      seat_number: r.seat_number,
      area: r.area,
      price_tier: r.price_tier,
      status: r.status,
      isLocked: r.status === 'locked' && new Date(r.lock_expires_at) > new Date(),
      lock_expires_at: r.lock_expires_at
    }));

    res.json({ seatMap, seats });
  });
});

router.post('/map', authenticateToken, requireAdmin, (req, res) => {
  const { eventId, name, layoutData } = req.body;

  db.run(
    'INSERT INTO seat_maps (event_id, name, layout_data) VALUES (?, ?, ?)',
    [eventId, name, JSON.stringify(layoutData)],
    function(err) {
      if (err) {
        return res.status(500).json({ error: '创建失败' });
      }
      res.status(201).json({ id: this.lastID, message: '创建成功' });
    }
  );
});

router.post('/batch', authenticateToken, requireAdmin, (req, res) => {
  const { seatMapId, seats } = req.body;

  const stmt = db.prepare('INSERT INTO seats (seat_map_id, row, seat_number, area, price_tier, status) VALUES (?, ?, ?, ?, ?, ?)');
  
  db.serialize(() => {
    seats.forEach(seat => {
      stmt.run([seatMapId, seat.row, seat.seat_number, seat.area, seat.price_tier, 'available']);
    });
    stmt.finalize((err) => {
      if (err) {
        return res.status(500).json({ error: '批量创建失败' });
      }
      res.json({ message: '批量创建成功' });
    });
  });
});

router.post('/lock', authenticateToken, (req, res) => {
  const { seatIds } = req.body;
  const userId = req.user.id;
  const lockDuration = 10 * 60 * 1000;
  const lockExpiresAt = new Date(Date.now() + lockDuration).toISOString();

  db.serialize(() => {
    const placeholders = seatIds.map(() => '?').join(',');
    const params = [...seatIds];

    db.all(`SELECT id, status FROM seats WHERE id IN (${placeholders})`, params, (err, seats) => {
      if (err) {
        return res.status(500).json({ error: '查询失败' });
      }

      const unavailable = seats.filter(s => s.status === 'sold');
      if (unavailable.length > 0) {
        return res.status(400).json({ error: '部分座位已售出' });
      }

      const lockedByOthers = seats.filter(s => s.status === 'locked');
      if (lockedByOthers.length > 0) {
        return res.status(400).json({ error: '部分座位已被锁定' });
      }

      const updateStmt = db.prepare('UPDATE seats SET status = "locked", locked_by = ?, lock_expires_at = ? WHERE id = ?');
      
      seats.forEach(seat => {
        updateStmt.run([userId, lockExpiresAt, seat.id]);
      });

      updateStmt.finalize((err) => {
        if (err) {
          return res.status(500).json({ error: '锁定失败' });
        }
        res.json({ message: '锁定成功', lockExpiresAt, duration: lockDuration });
      });
    });
  });
});

router.post('/unlock', authenticateToken, (req, res) => {
  const { seatIds } = req.body;
  const userId = req.user.id;

  const placeholders = seatIds.map(() => '?').join(',');
  const params = [userId, 'locked', ...seatIds];

  db.run(
    `UPDATE seats SET status = "available", locked_by = NULL, lock_expires_at = NULL 
     WHERE locked_by = ? AND status = ? AND id IN (${placeholders})`,
    params,
    function(err) {
      if (err) {
        return res.status(500).json({ error: '解锁失败' });
      }
      res.json({ message: '解锁成功', changed: this.changes });
    }
  );
});

module.exports = router;
