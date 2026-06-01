import { Router } from 'express';
import db from '../db';

const router = Router();

router.get('/', (req, res) => {
  const departments = db.prepare('SELECT * FROM departments ORDER BY id').all();
  res.json(departments);
});

router.get('/:id', (req, res) => {
  const department = db.prepare('SELECT * FROM departments WHERE id = ?').get(req.params.id);
  if (!department) {
    return res.status(404).json({ error: '部门不存在' });
  }
  res.json(department);
});

router.post('/', (req, res) => {
  const { name, code, type } = req.body;
  try {
    const result = db.prepare('INSERT INTO departments (name, code, type) VALUES (?, ?, ?)').run(name, code, type);
    res.json({ id: result.lastInsertRowid, name, code, type });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
