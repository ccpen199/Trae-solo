import express from 'express';
import { db } from '../database.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.get('/', (req, res) => {
  const { city, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  
  let query = 'SELECT * FROM venues';
  let params = [];
  
  if (city) {
    query += ' WHERE city = ?';
    params.push(city);
  }
  
  query += ' LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));
  
  const venues = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM venues' + (city ? ' WHERE city = ?' : '')).get(...(city ? [city] : []));
  
  res.json({ data: venues, total: total.count, page: Number(page), limit: Number(limit) });
});

router.get('/:id', (req, res) => {
  const venue = db.prepare('SELECT * FROM venues WHERE id = ?').get(req.params.id);
  if (!venue) return res.status(404).json({ error: 'Venue not found' });
  
  const sections = db.prepare(`
    SELECT s.*, COUNT(se.id) as seat_count
    FROM seat_sections s
    LEFT JOIN seats se ON se.section_id = s.id
    WHERE s.venue_id = ?
    GROUP BY s.id
  `).all(req.params.id);
  
  venue.sections = sections;
  venue.seat_config = venue.seat_config ? JSON.parse(venue.seat_config) : null;
  
  res.json(venue);
});

router.get('/:id/seats', (req, res) => {
  const sections = db.prepare('SELECT * FROM seat_sections WHERE venue_id = ?').all(req.params.id);
  
  const result = sections.map(section => {
    const seats = db.prepare('SELECT * FROM seats WHERE section_id = ?').all(section.id);
    return {
      ...section,
      coordinates: section.coordinates ? JSON.parse(section.coordinates) : null,
      seats
    };
  });
  
  res.json(result);
});

router.post('/', (req, res) => {
  const { name, city, address, capacity, seat_config } = req.body;
  const id = uuidv4();
  
  db.prepare(`
    INSERT INTO venues (id, name, city, address, capacity, seat_config)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, name, city, address, capacity || 0, JSON.stringify(seat_config || {}));
  
  res.status(201).json({ id, name, city, address, capacity });
});

router.post('/:id/sections', (req, res) => {
  const venueId = req.params.id;
  const { name, rows, seats_per_row, price_level, base_price, is_blind_zone, coordinates } = req.body;
  const sectionId = uuidv4();
  
  const insertSection = db.prepare(`
    INSERT INTO seat_sections (id, venue_id, name, rows, seats_per_row, price_level, base_price, is_blind_zone, coordinates)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const insertSeat = db.prepare(`
    INSERT INTO seats (id, section_id, row_label, seat_number, status, x, y, z)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const tx = db.transaction(() => {
    insertSection.run(sectionId, venueId, name, rows, seats_per_row, price_level || 'normal',
      base_price || 0, is_blind_zone ? 1 : 0, JSON.stringify(coordinates || {}));
    
    const coord = coordinates || { x: 400, y: 200 };
    for (let r = 0; r < rows; r++) {
      const rowLabel = String.fromCharCode(65 + r);
      for (let s = 1; s <= seats_per_row; s++) {
        const seatId = uuidv4();
        const x = coord.x - (seats_per_row * 20 / 2) + (s - 1) * 20 + 10;
        const y = coord.y + r * 25;
        insertSeat.run(seatId, sectionId, rowLabel, s, 'available', x, y, 0);
      }
    }
  });
  
  tx();
  
  res.status(201).json({ id: sectionId, name, rows, seats_per_row });
});

export default router;
