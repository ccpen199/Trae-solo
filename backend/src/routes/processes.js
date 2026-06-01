import express from 'express';
import db from '../models/database.js';

const router = express.Router();

router.get('/', (req, res) => {
  const processes = db.prepare('SELECT * FROM processes ORDER BY created_at DESC').all();
  res.json(processes);
});

router.post('/', (req, res) => {
  const { code, name, description, equipment, position } = req.body;
  const result = db.prepare(`
    INSERT INTO processes (code, name, description, equipment, position)
    VALUES (?, ?, ?, ?, ?)
  `).run(code, name, description, equipment, position);
  res.json({ id: result.lastInsertRowid, message: 'Process created successfully' });
});

router.put('/:id', (req, res) => {
  const { code, name, description, equipment, position } = req.body;
  db.prepare(`
    UPDATE processes 
    SET code = ?, name = ?, description = ?, equipment = ?, position = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(code, name, description, equipment, position, req.params.id);
  res.json({ message: 'Process updated successfully' });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM processes WHERE id = ?').run(req.params.id);
  res.json({ message: 'Process deleted successfully' });
});

export default router;
