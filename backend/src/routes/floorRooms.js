import express from 'express';
import db from '../db.js';

const router = express.Router();

router.get('/', (req, res) => {
  const rooms = db.prepare('SELECT * FROM floor_rooms ORDER BY floor, room_number').all();
  res.json(rooms);
});

router.post('/', (req, res) => {
  const { floor, room_number, room_type } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO floor_rooms (floor, room_number, room_type) VALUES (?, ?, ?)');
    const result = stmt.run(floor, room_number, room_type);
    res.json({ id: result.lastInsertRowid, floor, room_number, room_type });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  const stmt = db.prepare('DELETE FROM floor_rooms WHERE id=?');
  const result = stmt.run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json({ message: 'Room deleted' });
});

export default router;
