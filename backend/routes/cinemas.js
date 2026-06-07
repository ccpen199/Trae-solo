import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  try {
    const { city, status } = req.query;
    let sql = 'SELECT * FROM cinemas WHERE 1=1';
    const params = [];
    if (city) { sql += ' AND city = ?'; params.push(city); }
    if (status) { sql += ' AND status = ?'; params.push(status); }
    sql += ' ORDER BY id';
    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const cinema = db.prepare('SELECT * FROM cinemas WHERE id = ?').get(req.params.id);
    if (!cinema) return res.status(404).json({ error: 'Cinema not found' });
    const halls = db.prepare('SELECT id, name, seat_rows, seat_cols, screen_type, equipment_level, status, seat_count FROM halls WHERE cinema_id = ?').all(req.params.id);
    cinema.halls = halls;
    res.json(cinema);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  const tx = db.transaction((body) => {
    const {
      name, city, district, address, hall_count, equipment_level, scheduling_protocol, status,
      equipment_verify_date, equipment_verify_by, equipment_verify_status,
      protocol_start_date, protocol_end_date,
      min_schedule_ratio, max_daily_showtimes,
      last_review_date, next_review_date, review_notes, review_status, reviewed_by,
      halls
    } = body;

    const result = db.prepare(
      `INSERT INTO cinemas (
        name, city, district, address, hall_count, equipment_level, scheduling_protocol, status,
        equipment_verify_date, equipment_verify_by, equipment_verify_status,
        protocol_start_date, protocol_end_date,
        min_schedule_ratio, max_daily_showtimes,
        last_review_date, next_review_date, review_notes, review_status, reviewed_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      name, city, district, address,
      halls && halls.length > 0 ? halls.length : hall_count || 1,
      equipment_level || 'standard', scheduling_protocol || null, status || 'active',
      equipment_verify_date || null, equipment_verify_by || null, equipment_verify_status || null,
      protocol_start_date || null, protocol_end_date || null,
      min_schedule_ratio || null, max_daily_showtimes || null,
      last_review_date || null, next_review_date || null, review_notes || null, review_status || null, reviewed_by || null
    );

    const cinemaId = result.lastInsertRowid;

    if (halls && halls.length > 0) {
      const insertHall = db.prepare(
        'INSERT INTO halls (cinema_id, name, seat_rows, seat_cols, screen_type, equipment_level, status, seat_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      );
      for (const hall of halls) {
        const seatRows = Math.ceil(hall.seat_count / 14);
        insertHall.run(
          cinemaId, hall.hall_name, seatRows, 14, 'standard',
          hall.equipment_level || 'standard', hall.status || 'active', hall.seat_count
        );
      }
    }

    return { id: cinemaId };
  });

  try {
    const result = tx(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const tx = db.transaction((id, body) => {
    const existing = db.prepare('SELECT * FROM cinemas WHERE id = ?').get(id);
    if (!existing) throw new Error('Cinema not found');

    const {
      name, city, district, address, hall_count, equipment_level, scheduling_protocol, status,
      equipment_verify_date, equipment_verify_by, equipment_verify_status,
      protocol_start_date, protocol_end_date,
      min_schedule_ratio, max_daily_showtimes,
      last_review_date, next_review_date, review_notes, review_status, reviewed_by,
      halls
    } = body;

    const newHallCount = (halls && halls.length > 0) ? halls.length : (hall_count ?? existing.hall_count);

    db.prepare(
      `UPDATE cinemas SET
        name=?, city=?, district=?, address=?, hall_count=?, equipment_level=?, scheduling_protocol=?, status=?,
        equipment_verify_date=?, equipment_verify_by=?, equipment_verify_status=?,
        protocol_start_date=?, protocol_end_date=?,
        min_schedule_ratio=?, max_daily_showtimes=?,
        last_review_date=?, next_review_date=?, review_notes=?, review_status=?, reviewed_by=?,
        updated_at=datetime('now','localtime')
      WHERE id=?`
    ).run(
      name ?? existing.name,
      city ?? existing.city,
      district ?? existing.district,
      address ?? existing.address,
      newHallCount,
      equipment_level ?? existing.equipment_level,
      scheduling_protocol ?? existing.scheduling_protocol,
      status ?? existing.status,
      equipment_verify_date ?? existing.equipment_verify_date,
      equipment_verify_by ?? existing.equipment_verify_by,
      equipment_verify_status ?? existing.equipment_verify_status,
      protocol_start_date ?? existing.protocol_start_date,
      protocol_end_date ?? existing.protocol_end_date,
      min_schedule_ratio ?? existing.min_schedule_ratio,
      max_daily_showtimes ?? existing.max_daily_showtimes,
      last_review_date ?? existing.last_review_date,
      next_review_date ?? existing.next_review_date,
      review_notes ?? existing.review_notes,
      review_status ?? existing.review_status,
      reviewed_by ?? existing.reviewed_by,
      id
    );

    if (halls) {
      db.prepare('DELETE FROM halls WHERE cinema_id = ?').run(id);

      if (halls.length > 0) {
        const insertHall = db.prepare(
          'INSERT INTO halls (cinema_id, name, seat_rows, seat_cols, screen_type, equipment_level, status, seat_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        for (const hall of halls) {
          const seatRows = Math.ceil(hall.seat_count / 14);
          insertHall.run(
            id, hall.hall_name, seatRows, 14, 'standard',
            hall.equipment_level || 'standard', hall.status || 'active', hall.seat_count
          );
        }
      }
    }

    return { updated: true };
  });

  try {
    const result = tx(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    if (err.message === 'Cinema not found') {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM cinemas WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Cinema not found' });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/halls', (req, res) => {
  try {
    const cinema = db.prepare('SELECT * FROM cinemas WHERE id = ?').get(req.params.id);
    if (!cinema) return res.status(404).json({ error: 'Cinema not found' });
    const halls = db.prepare('SELECT id, name, seat_rows, seat_cols, screen_type, equipment_level, status, seat_count FROM halls WHERE cinema_id = ?').all(req.params.id);
    res.json(halls);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
